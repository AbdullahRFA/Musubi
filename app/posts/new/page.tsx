"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { postSchema, type PostValues } from "@/lib/validators";
import { createPost } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, AVAILABILITY, PLACES } from "@/lib/constants";
import { ASSISTANT_DRAFT_KEY, type AssistantDraftPost } from "@/lib/assistant/types";
import type { Category } from "@/lib/types";
import { AuthGuard } from "@/components/common/AuthGuard";
import { ProfileGate } from "@/components/posts/ProfileGate";
import { PostForm } from "@/components/posts/PostForm";

export default function CreatePostPage() {
  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      description: "",
      category: CATEGORIES[0],
      skill: "",
      location: session?.location || PLACES[0].name,
      availability: session?.availability || AVAILABILITY[0],
      postType: "request",
      exchangeMethod: "free",
      amount: null,
    },
  });

  // The profile may load after this page: use the member's own location and
  // availability as defaults once it arrives (unless they've already changed them)
  useEffect(() => {
    if (!session) return;
    const { dirtyFields } = form.formState;
    if (!dirtyFields.location && session.location) form.setValue("location", session.location);
    if (!dirtyFields.availability && session.availability) form.setValue("availability", session.availability);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.location, session?.availability]);

  // Prefill from a draft written by the Musubi Guide assistant (one-time hand-off)
  const [fromAssistant, setFromAssistant] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ASSISTANT_DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(ASSISTANT_DRAFT_KEY);
      const draft = JSON.parse(raw) as AssistantDraftPost;
      const values = form.getValues();
      form.reset({
        ...values,
        title: draft.title?.slice(0, 100) || values.title,
        description: draft.description?.slice(0, 800) || values.description,
        category: CATEGORIES.includes(draft.category as Category) ? (draft.category as Category) : values.category,
        skill: draft.skill?.slice(0, 60) || values.skill,
        availability: AVAILABILITY.includes(draft.availability) ? draft.availability : values.availability,
        exchangeMethod: draft.exchangeMethod === "paid" ? "paid" : draft.exchangeMethod === "exchange" ? "exchange" : "free",
        amount: null,
      });
      setFromAssistant(true);
    } catch {
      // ignore malformed drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: PostValues) => {
    setError(null);
    setLoading(true);
    try {
      const created = await createPost({ ...values, postType: "request", templateId: null });
      router.push(`/posts/${created.id}?created=1`);
    } catch (err: any) {
      setError(err?.message || "Failed to create post. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <ProfileGate>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        error={error}
        loading={loading}
        icon={PlusCircle}
        eyebrow="Standard Post Creation"
        title="Create a Community Request"
        description={
          fromAssistant
            ? "Musubi Guide filled this in for you. Please check every detail, change anything you like, then press Publish."
            : "Request assistance, practical guidance, or companionship from neighbors across generations."
        }
        submitLabel="Publish Post"
        loadingLabel="Publishing post..."
      />
      </ProfileGate>
    </AuthGuard>
  );
}
