"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Web Speech API (not in TS's DOM lib everywhere). */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Voice input (speech-to-text) and output (text-to-speech) using the
 * browser's built-in Web Speech API. No external service or cost.
 */
export function useSpeech(language: "en" | "ja") {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const [voiceOutputSupported, setVoiceOutputSupported] = useState(false);

  useEffect(() => {
    setVoiceInputSupported(Boolean(getRecognitionCtor()));
    setVoiceOutputSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  /** Starts listening; calls onFinal with the full transcript when the user stops talking. */
  const startListening = useCallback(
    (onFinal: (text: string) => void, onError?: (message: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      // Don't talk over the user
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingId(null);

      recognitionRef.current?.abort();
      const recognition = new Ctor();
      recognition.lang = locale;
      recognition.interimResults = true;
      recognition.continuous = false;

      let finalText = "";
      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interimText += result[0].transcript;
        }
        setInterim(finalText + interimText);
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          onError?.(
            language === "ja"
              ? "マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。"
              : "Microphone access is blocked. Please allow the microphone in your browser settings."
          );
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          onError?.(language === "ja" ? "音声を認識できませんでした。" : "Sorry, I couldn't hear that clearly.");
        }
      };
      recognition.onend = () => {
        setListening(false);
        setInterim("");
        const text = finalText.trim();
        if (text) onFinal(text);
      };

      recognitionRef.current = recognition;
      setListening(true);
      try {
        recognition.start();
      } catch {
        setListening(false);
      }
    },
    [locale, language]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /** Reads text aloud at a slower, clear pace. Calling again with the same id stops it. */
  const speak = useCallback(
    (id: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      if (speakingId === id) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 0.92;
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(locale.slice(0, 2)));
      if (voice) utterance.voice = voice;
      utterance.onend = () => setSpeakingId((current) => (current === id ? null : current));
      utterance.onerror = () => setSpeakingId((current) => (current === id ? null : current));
      setSpeakingId(id);
      synth.speak(utterance);
    },
    [locale, speakingId]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  return {
    listening,
    interim,
    speakingId,
    voiceInputSupported,
    voiceOutputSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
