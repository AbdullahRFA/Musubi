"use client";

import Link from "next/link";
import { MessageSquare, Clock, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import { useConversations } from "@/lib/services/chatService";
import { groupShort } from "@/lib/constants";
import { formatWhen, initials } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function ChatListPage() {
  const conversations = useConversations();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6 space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span>Messages & Arrangements</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Private conversations unlock once a service request is accepted by the author.
          </p>
        </div>

        {/* Safety Note */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
          <span>
            Remember: For your first meetings, choose a public or community place (like a library, park bench, or cafe).
          </span>
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
              <p className="text-base font-semibold text-foreground">No active conversations yet.</p>
              <p className="text-sm text-muted-foreground">
                When you or another neighbor accept a service request, a private chat unlocks here.
              </p>
              <Link href="/posts">
                <Button variant="default">Browse Community Posts</Button>
              </Link>
            </div>
          ) : (
            conversations.map(({ conversation, other, otherId, last, post }) => (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="block rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-[#fffdfa] p-5 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-base shrink-0">
                      {other ? initials(other.fullName) : "?"}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {other?.fullName ?? "Community Member"}
                        </h3>
                        {other && (
                          <span className="text-xs font-semibold text-primary">
                            {groupShort(other.userGroup)}
                          </span>
                        )}
                      </div>

                      {post && (
                        <span className="inline-block text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-xs">
                          {post.title}
                        </span>
                      )}

                      <p className="text-sm text-muted-foreground truncate">
                        {last ? last.body : "Conversation opened. Say hello!"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {last ? formatWhen(last.createdAt) : formatWhen(conversation.createdAt)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
