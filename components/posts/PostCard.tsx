"use client";

import Link from "next/link";
import { MapPin, Clock, ArrowRight, UserCheck, HandHelping, BookOpen, Coins } from "lucide-react";
import type { Post } from "@/lib/types";
import { usePublicProfile } from "@/lib/services/profileService";
import { exchangeLabel, groupShort } from "@/lib/constants";
import { initials, money } from "@/lib/utils";
import { PostStatusBadge } from "@/components/common/StatusBadge";
import { RatingStars } from "@/components/common/RatingStars";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PostCard({ post }: { post: Post }) {
  const author = usePublicProfile(post.authorId);

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow border-2 border-border bg-card">
      <CardHeader className="p-5 pb-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                post.postType === "offer"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {post.postType === "offer" ? "Offering Help" : "Requesting Help"}
            </span>
            <Badge variant="outline" className="text-xs font-medium bg-muted/60">
              {post.category}
            </Badge>
          </div>
          <PostStatusBadge status={post.status} />
        </div>

        {/* Title */}
        <Link href={`/posts/${post.id}`} className="group">
          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4 flex-1">
        {/* Description snippet */}
        <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">
          {post.description}
        </p>

        {/* Details chips: Skill, Location, Availability */}
        <div className="space-y-2 pt-1 border-t border-border/60 text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="text-muted-foreground">Skill:</span>
            <span className="bg-muted px-2.5 py-0.5 rounded text-xs font-semibold">{post.skill}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {post.location}
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              {post.availability}
            </span>
          </div>
        </div>

        {/* Exchange Method Highlight */}
        <div className="rounded-md bg-muted/50 p-2.5 border border-border/80 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Exchange:</span>
          <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
            {post.exchangeMethod === "knowledge" && (
              <>
                <BookOpen className="h-4 w-4 text-secondary" />
                <span>Knowledge Exchange</span>
              </>
            )}
            {post.exchangeMethod === "service" && (
              <>
                <HandHelping className="h-4 w-4 text-primary" />
                <span>Service Exchange</span>
              </>
            )}
            {post.exchangeMethod === "payment" && (
              <>
                <Coins className="h-4 w-4 text-amber-600" />
                <span>
                  {post.amount ? money(post.amount) : "Agreed amount"}{" "}
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded font-mono">
                    DEMO
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t border-border/60 mt-auto flex items-center justify-between gap-3">
        {/* Author Snapshot */}
        {author ? (
          <Link
            href={`/profile/${author.id}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold shadow-xs">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials(author.fullName)
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground line-clamp-1">
                {author.fullName}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">{groupShort(author.userGroup)}</span>
                {author.averageRating && (
                  <>
                    <span>·</span>
                    <RatingStars rating={author.averageRating} size="sm" />
                  </>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">Community member</div>
        )}

        {/* View Link */}
        <Link href={`/posts/${post.id}`}>
          <Button variant="default" size="sm" className="font-semibold gap-1">
            <span>View</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
