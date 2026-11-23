"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { postSchema, type PostValues } from "@/lib/validators";
import { createPost } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, AVAILABILITY, PLACES } from "@/lib/constants";
import { AuthGuard } from "@/components/common/AuthGuard";
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

  const onSubmit = async (values: PostValues) => {
    setError(null);
    setLoading(true);
    try {
      const created = await createPost({ ...values, postType: "request", templateId: null });
      router.push(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create post. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        error={error}
        loading={loading}
        icon={PlusCircle}
        eyebrow="Standard Post Creation"
        title="Create a Community Request"
        description="Request assistance, practical guidance, or companionship from neighbors across generations."
        submitLabel="Publish Post"
        loadingLabel="Publishing post..."
      />
    </AuthGuard>
  );
}
