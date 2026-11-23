"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
import { postSchema, type PostValues } from "@/lib/validators";
import { usePost, updatePost } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { AuthGuard } from "@/components/common/AuthGuard";
import { PostForm } from "@/components/posts/PostForm";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const post = usePost(id);
  const session = useSession();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<PostValues>({ resolver: zodResolver(postSchema) });
  const { reset } = form;

  useEffect(() => {
    if (!post) return;
    // Only the author may edit
    if (session && post.authorId !== session.id) {
      router.replace(`/posts/${post.id}`);
      return;
    }
    reset({
      title: post.title,
      description: post.description,
      category: post.category,
      skill: post.skill,
      location: post.location,
      availability: post.availability,
      postType: post.postType,
      exchangeMethod: post.exchangeMethod,
      amount: post.amount,
    });
  }, [post, session, reset, router]);

  if (!post) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-muted-foreground">
        <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading post details...
      </div>
    );
  }

  const onSubmit = async (values: PostValues) => {
    setError(null);
    setLoading(true);
    try {
      await updatePost(post.id, { ...values, templateId: post.templateId });
      router.push(`/posts/${post.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update post.");
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
        icon={Edit}
        eyebrow="Editing Post"
        title={post.title}
        submitLabel="Save Changes"
        loadingLabel="Saving changes..."
      />
    </AuthGuard>
  );
}
