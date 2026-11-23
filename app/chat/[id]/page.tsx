"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Coins,
} from "lucide-react";
import { useThread, sendMessage, acknowledgeSafety } from "@/lib/services/chatService";
import { usePublicProfile } from "@/lib/services/profileService";
import { confirmCompletion } from "@/lib/services/requestService";
import { useSession } from "@/lib/services/authService";
import { groupShort } from "@/lib/constants";
import { formatWhen, initials, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const thread = useThread(conversationId);
  const session = useSession();
  const otherPublic = usePublicProfile(thread?.other?.id ?? "");

  const [inputBody, setInputBody] = useState("");
  const [sending, setSending] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread?.needsSafety) {
      setSafetyModalOpen(true);
    }
  }, [thread?.needsSafety]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Conversation not found</h2>
        <p className="text-muted-foreground">
          This conversation may not be active or you may not be a participant.
        </p>
        <Link href="/chat">
          <Button variant="outline">Back to messages</Button>
        </Link>
      </div>
    );
  }

  const { messages, other, request, post } = thread;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim()) return;
    if (thread.needsSafety) {
      setSafetyModalOpen(true);
      return;
    }
    setSending(true);
    try {
      await sendMessage(conversationId, inputBody);
      setInputBody("");
    } catch (err: any) {
      alert(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleAgreeSafety = async () => {
    await acknowledgeSafety(conversationId);
    setSafetyModalOpen(false);
  };

  const handleCompleteActivity = async () => {
    if (!confirm("Confirm marking this exchange as completed?")) return;
    setCompleting(true);
    try {
      const res = await confirmCompletion(request.id);
      if (res.completed && res.activityId) {
        router.push(`/feedback/${res.activityId}`);
      } else {
        alert("You marked this activity completed! Waiting for the other person to confirm.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update completion.");
    } finally {
      setCompleting(false);
    }
  };

  const isCompleted = request.status === "completed";

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
        {/* Header Bar */}
        <div className="rounded-t-xl border-2 border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="p-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
              {other ? initials(other.fullName) : "?"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${other?.id}`}
                  className="font-bold text-foreground hover:text-primary transition-colors text-base"
                >
                  {other?.fullName}
                </Link>
                {other && (
                  <span className="text-xs font-semibold text-primary">
                    {groupShort(other.userGroup)}
                  </span>
                )}
              </div>
              {post && (
                <div className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                  Topic: {post.title}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons in chat header */}
          <div className="flex items-center gap-2 pl-9 sm:pl-0">
            {/* Phone contact if consented */}
            {otherPublic?.phoneShared && otherPublic.phone && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                <span>{otherPublic.phone}</span>
              </div>
            )}

            {/* Demo Payment link if monetary post */}
            {post?.exchangeMethod === "paid" && post.amount && (
              <Link href="/transactions">
                <Button size="sm" variant="outline" className="text-xs gap-1 border-blue-300 bg-blue-50 text-blue-900">
                  <Coins className="h-3.5 w-3.5 text-blue-600" />
                  <span>Pay £{post.amount} (Demo)</span>
                </Button>
              </Link>
            )}

            {/* Mark Activity Completed Button */}
            {!isCompleted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompleteActivity}
                disabled={completing}
                className="text-xs font-bold gap-1 text-foreground hover:border-primary"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark Completed</span>
              </Button>
            ) : (
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Completed</span>
              </span>
            )}
          </div>
        </div>

        {/* Public Place Safety Tip Banner */}
        <div className="bg-amber-50 border-x-2 border-amber-300 px-4 py-2 text-xs font-medium text-amber-900 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
          <span>For first meetings, always choose a public or community place (library, cafe, park).</span>
        </div>

        {/* Message Thread List */}
        <div className="flex-1 overflow-y-auto border-x-2 border-border bg-[#faf6f0] p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">This is the start of your message thread.</p>
              <p>Say hello and coordinate when and where to meet.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === session?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                    {!isMe && (
                      <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-[10px] shrink-0 mb-1">
                        {other ? initials(other.fullName) : "?"}
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-base leading-relaxed ${
                        isMe
                          ? "bg-primary text-white rounded-br-xs shadow-xs"
                          : "bg-card text-foreground border-2 border-border rounded-bl-xs shadow-xs"
                      }`}
                    >
                      <p>{m.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground px-1">
                    <span>{formatWhen(m.createdAt)}</span>
                    {m.canned && <span className="italic">(auto-reply)</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Box */}
        <form
          onSubmit={handleSend}
          className="rounded-b-xl border-2 border-border bg-card p-3 sm:p-4 flex items-center gap-2 shadow-sm"
        >
          <Input
            placeholder="Type a friendly message..."
            value={inputBody}
            onChange={(e) => setInputBody(e.target.value)}
            disabled={sending}
            maxLength={500}
            className="flex-1 text-base h-12"
          />
          <Button
            type="submit"
            disabled={sending || !inputBody.trim()}
            className="h-12 px-5 font-bold gap-1 bg-primary text-white"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>

        {/* Safety Tips Modal before first message */}
        {safetyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border-2 border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-primary font-bold text-xl">
                <ShieldAlert className="h-6 w-6" />
                <span>Community Safety Advice</span>
              </div>

              <div className="space-y-3 text-base text-foreground">
                <p>
                  Before sending your first message, please review our core safety guidelines:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Public places first:</strong> Always arrange initial knowledge or skill exchanges in public venues such as a library, community hub, or daytime cafe.
                  </li>
                  <li>
                    <strong>Keep private details safe:</strong> Do not share bank account details, passwords, or home access keys.
                  </li>
                  <li>
                    <strong>No real money:</strong> Any payments on this platform are simulated demo amounts only.
                  </li>
                  <li>
                    <strong>Tell a friend:</strong> Let a family member or friend know when and where you are meeting.
                  </li>
                </ul>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleAgreeSafety}
                  className="w-full font-bold bg-primary hover:bg-[#832c0f] text-white"
                >
                  I Understand & Agree
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
