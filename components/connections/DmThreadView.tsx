"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Check,
  ImagePlus,
  Loader2,
  MoreVertical,
  Pencil,
  SendHorizontal,
  SmilePlus,
  Trash2,
  User,
  UserMinus,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConnectionStore } from "@/lib/store/useConnectionStore";
import { blockMember, fetchConnections, removeConnection, useConnections } from "@/lib/services/connectionService";
import { DM_MAX_LENGTH, deleteDm, editDm, groupReactions, reactDm, sendDm, useDmImageUrl, useDmThread } from "@/lib/services/dmService";
import { getActiveConversation, markConversationRead, setActiveConversation } from "@/lib/services/notificationService";
import { useProfile } from "@/lib/services/profileService";
import { MAX_SOURCE_IMAGE_BYTES } from "@/lib/imageResize";
import { DM_REACTIONS, type DirectMessage, type DirectReaction, type DmReactionEmoji, type Profile } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function Avatar({ person, size = "h-10 w-10" }: { person: Profile | null; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold`}>
      {person?.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(person?.fullName ?? "?")}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Photo                                                                      */
/* -------------------------------------------------------------------------- */

function DmPhoto({ path, onOpen }: { path: string; onOpen: (url: string) => void }) {
  const { url, failed } = useDmImageUrl(path);
  if (failed) {
    return <div className="flex h-32 w-48 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Photo unavailable</div>;
  }
  if (!url) return <div className="h-48 w-56 max-w-full animate-pulse rounded-xl bg-muted" />;
  return (
    <button type="button" onClick={() => onOpen(url)} className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open photo">
      <img src={url} alt="Shared photo" className="max-h-72 w-auto max-w-[min(18rem,70vw)] object-cover transition-transform duration-300 hover:scale-[1.02]" loading="lazy" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Message bubble                                                             */
/* -------------------------------------------------------------------------- */

function MessageBubble({
  message,
  mine,
  reactions,
  myId,
  startsGroup,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onReact,
  onOpenPhoto,
}: {
  message: DirectMessage;
  mine: boolean;
  reactions: DirectReaction[];
  myId: string | null;
  startsGroup: boolean;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onEdit: (m: DirectMessage) => void;
  onDelete: (m: DirectMessage) => void;
  onReact: (m: DirectMessage, e: DmReactionEmoji) => void;
  onOpenPhoto: (url: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const groups = groupReactions(reactions, message.id, myId);
  const deleted = Boolean(message.deletedAt);
  const myReaction = reactions.find((r) => r.messageId === message.id && r.userId === myId)?.emoji;

  useEffect(() => {
    if (!selected) setPickerOpen(false);
  }, [selected]);

  const bubbleShape = mine ? (startsGroup ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-r-md") : startsGroup ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-l-md";

  return (
    <div className={`group/msg flex ${mine ? "justify-end" : "justify-start"} ${startsGroup ? "mt-3" : "mt-0.5"}`}>
      <div className={`relative flex max-w-[85%] sm:max-w-[70%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
          {/* Bubble */}
          <div
            onClick={() => !deleted && onSelect(selected ? null : message.id)}
            className={`cursor-default select-text ${bubbleShape} ${
              deleted
                ? "border border-dashed border-border bg-transparent px-3.5 py-2 text-sm italic text-muted-foreground"
                : mine
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-foreground shadow-xs"
            } ${message.imagePath && !message.body ? "p-1" : message.imagePath ? "p-1 pb-2" : "px-3.5 py-2"} ${
              selected ? "ring-2 ring-ring/60" : ""
            } transition-shadow`}
          >
            {deleted ? (
              <span className="inline-flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" />
                {mine ? "You deleted this message" : "This message was deleted"}
              </span>
            ) : (
              <>
                {message.imagePath && <DmPhoto path={message.imagePath} onOpen={onOpenPhoto} />}
                {message.body && (
                  <p className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${message.imagePath ? "px-2.5 pt-1.5" : ""}`}>{message.body}</p>
                )}
              </>
            )}
          </div>

          {/* Hover / tap action bar */}
          {!deleted && (
            <div
              className={`flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-soft transition-opacity duration-150 ${
                selected ? "opacity-100" : "pointer-events-none opacity-0 sm:group-hover/msg:pointer-events-auto sm:group-hover/msg:opacity-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="React"
                title="React"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
              {mine && message.body !== null && (
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Edit message"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {mine && (
                <button
                  type="button"
                  onClick={() => onDelete(message)}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete message"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Emoji picker */}
        {pickerOpen && !deleted && (
          <div
            className={`z-10 mt-1 flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-1 shadow-lift animate-in fade-in zoom-in-95 duration-150 ${
              mine ? "self-end" : "self-start"
            }`}
            role="menu"
            aria-label="Pick a reaction"
          >
            {DM_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="menuitem"
                onClick={() => {
                  onReact(message, emoji);
                  setPickerOpen(false);
                  onSelect(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform duration-150 hover:scale-125 hover:bg-muted ${
                  myReaction === emoji ? "bg-primary/15" : ""
                }`}
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reactions */}
        {groups.length > 0 && !deleted && (
          <div className={`-mt-1.5 flex flex-wrap gap-1 ${mine ? "mr-2 justify-end" : "ml-2"}`}>
            {groups.map((g) => (
              <button
                key={g.emoji}
                type="button"
                onClick={() => onReact(message, g.emoji)}
                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs shadow-xs transition-colors ${
                  g.mine ? "border-primary/40 bg-primary/10 font-bold text-primary" : "border-border bg-card text-foreground hover:bg-muted"
                }`}
                aria-label={`${g.emoji} ${g.count}${g.mine ? ", tap to remove yours" : ""}`}
              >
                <span className="text-sm leading-none">{g.emoji}</span>
                {g.count > 1 && <span className="tabular-nums">{g.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Meta */}
        {(selected || startsGroup) && (
          <span className={`mt-0.5 px-1 text-[11px] text-muted-foreground ${mine ? "text-right" : ""}`}>
            {timeFmt.format(new Date(message.createdAt))}
            {message.editedAt && !deleted && " · Edited"}
          </span>
        )}
        {!selected && !startsGroup && message.editedAt && !deleted && <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">Edited</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Thread                                                                     */
/* -------------------------------------------------------------------------- */

export function DmThreadView({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const myId = useAppStore((s) => s.sessionUserId);
  const { loaded: connectionsLoaded, otherOf } = useConnections();
  const connection = useConnectionStore((s) => s.connections.find((c) => c.id === connectionId));
  const otherId = connection ? otherOf(connection) : null;
  const other = useProfile(otherId);
  const { messages, reactions, loaded } = useDmThread(connection?.status === "accepted" ? connectionId : null);

  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<DirectMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DirectMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);

  const conversationKey = `dm:${connectionId}`;

  // Mark this conversation active so its notifications don't toast, and read
  useEffect(() => {
    setActiveConversation(conversationKey);
    markConversationRead(conversationKey);
    const onVisible = () => document.visibilityState === "visible" && markConversationRead(conversationKey);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (getActiveConversation() === conversationKey) setActiveConversation(null);
    };
  }, [conversationKey]);

  useEffect(() => {
    if (messages.length && document.visibilityState === "visible") markConversationRead(conversationKey);
  }, [messages.length, conversationKey]);

  // Refresh connections once in case this link was opened from a notification
  useEffect(() => {
    if (!connection) fetchConnections();
  }, [connection]);

  // Auto-scroll on new messages when the reader is already near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const first = lastCount.current === 0;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    const lastMine = messages[messages.length - 1]?.senderId === myId;
    if (first || (grew && (stickToBottom.current || lastMine))) {
      requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: first ? "auto" : "smooth" }));
    }
  }, [messages, myId]);

  // Close the header menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  // Preview URL for the chosen photo
  useEffect(() => {
    if (!image) return setImagePreview(null);
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Auto-grow the composer
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const items = useMemo(() => {
    const out: ({ kind: "day"; label: string; key: string } | { kind: "msg"; message: DirectMessage; startsGroup: boolean })[] = [];
    let lastDay = "";
    let prev: DirectMessage | null = null;
    for (const m of messages) {
      const day = new Date(m.createdAt).toDateString();
      if (day !== lastDay) {
        out.push({ kind: "day", label: dayLabel(m.createdAt), key: `day-${day}` });
        lastDay = day;
        prev = null;
      }
      const gap = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
      out.push({ kind: "msg", message: m, startsGroup: !prev || prev.senderId !== m.senderId || gap > 5 * 60 * 1000 });
      prev = m;
    }
    return out;
  }, [messages]);

  /* ------------------------------ actions ------------------------------ */

  const pickImage = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose a photo (JPG, PNG, WebP…).");
    if (file.size > MAX_SOURCE_IMAGE_BYTES) return setError("That photo is too large. Please choose one under 15 MB.");
    setEditing(null);
    setImage(file);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditing(null);
    setText("");
  };

  const startEdit = (m: DirectMessage) => {
    setSelectedId(null);
    setImage(null);
    setEditing(m);
    setText(m.body ?? "");
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const submit = async () => {
    if (sending) return;
    const body = text.trim();
    setError(null);

    if (editing) {
      setSending(true);
      try {
        await editDm(editing, body);
        cancelEdit();
      } catch (err: any) {
        setError(err?.message || "Couldn't edit the message.");
      } finally {
        setSending(false);
      }
      return;
    }

    if (!body && !image) return;
    const photo = image;
    setSending(true);
    setText("");
    setImage(null);
    stickToBottom.current = true;
    try {
      await sendDm(connectionId, { body, image: photo });
    } catch (err: any) {
      setError(err?.message || "Couldn't send the message.");
      setText(body);
      setImage(photo);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const doDelete = async () => {
    const m = confirmDelete;
    setConfirmDelete(null);
    if (!m) return;
    if (editing?.id === m.id) cancelEdit();
    try {
      await deleteDm(m);
    } catch (err: any) {
      setError(err?.message || "Couldn't delete the message.");
    }
  };

  const react = async (m: DirectMessage, emoji: DmReactionEmoji) => {
    try {
      await reactDm(m, emoji);
    } catch (err: any) {
      setError(err?.message || "Couldn't react.");
    }
  };

  const handleRemove = async () => {
    setMenuOpen(false);
    if (!confirm(`Remove ${other?.fullName ?? "this member"} from your connections? Your messages with them will be deleted for both of you.`)) return;
    try {
      await removeConnection(connectionId);
      router.push("/connections");
    } catch (err: any) {
      setError(err?.message || "Couldn't remove the connection.");
    }
  };

  const handleBlock = async () => {
    setMenuOpen(false);
    if (!otherId) return;
    if (!confirm(`Block ${other?.fullName ?? "this member"}? They won't be able to message you or send you requests, and this conversation will be removed.`)) return;
    try {
      await blockMember(otherId);
      router.push("/connections?tab=blocked");
    } catch (err: any) {
      setError(err?.message || "Couldn't block this member.");
    }
  };

  /* ------------------------------- render ------------------------------- */

  if (!connectionsLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connection || connection.status !== "accepted") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <UserMinus className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-extrabold">This conversation isn&apos;t available</h2>
        <p className="max-w-sm text-sm text-muted-foreground">You can only message members you&apos;re connected with. The connection may have been removed.</p>
        <Button asChild variant="outline">
          <Link href="/connections">Back to connections</Link>
        </Button>
      </div>
    );
  }

  const canSend = editing ? text.trim().length > 0 || Boolean(editing.imagePath) : text.trim().length > 0 || Boolean(image);
  const nearLimit = text.length > DM_MAX_LENGTH - 200;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none border-border bg-[#fffdfa] sm:rounded-3xl sm:border-2 sm:shadow-soft">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur sm:px-4">
        <Button asChild variant="ghost" size="sm" className="h-9 w-9 shrink-0 p-0" aria-label="Back to connections">
          <Link href="/connections">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Link href={otherId ? `/profile/${otherId}` : "#"} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted/60">
          <Avatar person={other} />
          <div className="min-w-0">
            <p className="truncate font-extrabold text-foreground">{other?.fullName ?? "Member"}</p>
            <p className="truncate text-xs text-muted-foreground">Connected · Private messages</p>
          </div>
        </Link>
        <div ref={menuRef} className="relative">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setMenuOpen((v) => !v)} aria-label="Conversation options" aria-expanded={menuOpen}>
            <MoreVertical className="h-5 w-5" />
          </Button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lift animate-in fade-in zoom-in-95 duration-150">
              {otherId && (
                <Link role="menuitem" href={`/profile/${otherId}`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted">
                  <User className="h-4 w-4" /> View profile
                </Link>
              )}
              <button role="menuitem" onClick={handleRemove} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted">
                <UserMinus className="h-4 w-4" /> Remove connection
              </button>
              <button role="menuitem" onClick={handleBlock} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10">
                <Ban className="h-4 w-4" /> Block
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {!loaded ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center animate-fade-up">
            <Avatar person={other} size="h-20 w-20" />
            <div>
              <p className="text-lg font-extrabold">{other?.fullName ?? "Member"}</p>
              <p className="text-sm text-muted-foreground">You&apos;re now connected. Say hello! 👋</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["Hello! 👋", "Nice to meet you!", "How are you?"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setText(s);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          items.map((item) =>
            item.kind === "day" ? (
              <div key={item.key} className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {item.label}
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : (
              <MessageBubble
                key={item.message.id}
                message={item.message}
                mine={item.message.senderId === myId}
                reactions={reactions}
                myId={myId}
                startsGroup={item.startsGroup}
                selected={selectedId === item.message.id}
                onSelect={setSelectedId}
                onEdit={startEdit}
                onDelete={(m) => {
                  setSelectedId(null);
                  setConfirmDelete(m);
                }}
                onReact={react}
                onOpenPhoto={setLightbox}
              />
            )
          )
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4">
        {error && (
          <div role="alert" className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {editing && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm animate-in fade-in">
            <Pencil className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-primary">Editing message</p>
              <p className="truncate text-xs text-muted-foreground">{editing.body}</p>
            </div>
            <button onClick={cancelEdit} className="rounded-full p-1 hover:bg-muted" aria-label="Cancel editing">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2 animate-in fade-in">
            <img src={imagePreview} alt="Selected photo" className="h-16 w-16 rounded-lg object-cover" />
            <div className="min-w-0 flex-1 text-xs text-muted-foreground">
              <p className="truncate font-semibold text-foreground">{image?.name}</p>
              <p>We&apos;ll resize it before sending. Add a caption if you like.</p>
            </div>
            <button onClick={() => setImage(null)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Remove photo">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2"
        >
          {!editing && (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                pickImage(e.target.files?.[0]);
                e.target.value = "";
              }} />
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-full p-0 text-primary hover:bg-primary/10"
                onClick={() => fileRef.current?.click()}
                disabled={sending}
                aria-label="Attach a photo"
                title="Send a photo"
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </>
          )}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, DM_MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape" && editing) cancelEdit();
              }}
              onPaste={(e) => {
                const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
                if (file && !editing) {
                  e.preventDefault();
                  pickImage(file);
                }
              }}
              rows={1}
              placeholder={editing ? "Edit your message" : image ? "Add a caption…" : "Write a message…"}
              aria-label="Message"
              className="block max-h-40 min-h-[44px] w-full resize-none rounded-3xl border-2 border-border bg-background px-4 py-2.5 text-[15px] leading-snug outline-none transition-colors focus:border-primary/50"
            />
            {nearLimit && (
              <span className="absolute -top-5 right-2 text-[11px] tabular-nums text-muted-foreground">
                {text.length}/{DM_MAX_LENGTH}
              </span>
            )}
          </div>
          <Button type="submit" disabled={!canSend || sending} className="h-11 w-11 shrink-0 rounded-full p-0" aria-label={editing ? "Save edit" : "Send"}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : editing ? <Check className="h-5 w-5" /> : <SendHorizontal className="h-5 w-5" />}
          </Button>
        </form>
        <p className="mt-1.5 hidden text-center text-[11px] text-muted-foreground sm:block">Enter to send · Shift + Enter for a new line · Hover a message to react, edit or delete</p>
      </div>

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(null)} title="Delete this message?" description="It will be removed for both of you. This can't be undone.">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={doDelete} className="gap-1.5">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </Dialog>

      {/* Photo lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-label="Photo"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 animate-in fade-in"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close photo">
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox} alt="Shared photo" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
