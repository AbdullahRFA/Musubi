"use client";

import Link from "next/link";
import { useState } from "react";
import { UserCheck, MapPin, Clock, Send, Star, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/types";
import { usePublicProfile } from "@/lib/services/profileService";
import { createDirectRequest, useRequestBetween } from "@/lib/services/requestService";
import { useSession } from "@/lib/services/authService";
import { groupShort } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { RatingStars } from "@/components/common/RatingStars";
import { RequestStatusBadge } from "@/components/common/StatusBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function PersonCard({ person }: { person: Profile }) {
  const session = useSession();
  const publicData = usePublicProfile(person.id);
  const existingRequest = useRequestBetween(person.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert("Please log in to send a request.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await createDirectRequest(person.id, message);
      setSentSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        setSentSuccess(false);
        setMessage("");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const isMe = session?.id === person.id;

  return (
    <>
      <Card className="flex flex-col justify-between border-2 border-border bg-[#fffdfa] hover:border-secondary transition-all shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt={person.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials(person.fullName)
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <Link href={`/profile/${person.id}`} className="group">
                <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                  {person.fullName}
                </h3>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    person.userGroup === "og"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {groupShort(person.userGroup)}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {person.location || "Local"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4 flex-1">
          {/* Rating & Completed exchanges count */}
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-md bg-muted/60 border border-border/60">
            <RatingStars
              rating={publicData?.averageRating ?? null}
              count={publicData?.reviewCount}
              size="sm"
            />
            <span className="font-semibold text-foreground">
              {publicData?.completedCount ?? 0} completed
            </span>
          </div>

          {/* Bio snippet */}
          {person.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 italic">
              “{person.bio}”
            </p>
          )}

          {/* Skills and services offered */}
          {person.skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Expertise & Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {person.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {person.availability && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              <span>Available: {person.availability}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-5 pt-0 border-t border-border/60 mt-auto flex items-center justify-between gap-2">
          <Link href={`/profile/${person.id}`}>
            <Button variant="outline" size="sm" className="font-semibold">
              Profile
            </Button>
          </Link>

          {!isMe && (
            <>
              {existingRequest ? (
                <div className="flex items-center gap-1.5">
                  <RequestStatusBadge status={existingRequest.status} />
                  {existingRequest.status === "accepted" && (
                    <Link href="/chat">
                      <Button size="sm" variant="default" className="text-xs">
                        Chat
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setModalOpen(true)}
                  className="font-bold gap-1 bg-secondary hover:bg-[#32402e] text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Connect / Request</span>
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {/* Direct Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border-2 border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-foreground">
              Send Request to {person.fullName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Ask about learning from their expertise or propose a skill exchange.
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {sentSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Request sent successfully!</span>
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Your message or proposal:
                </label>
                <Textarea
                  rows={4}
                  placeholder={`Hi ${person.fullName}, I noticed your expertise and would love to connect...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={280}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="font-bold">
                  {sending ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
