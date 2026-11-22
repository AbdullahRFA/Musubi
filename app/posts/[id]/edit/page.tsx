"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, AlertCircle } from "lucide-react";
import { postSchema, type PostValues } from "@/lib/validators";
import { usePost, updatePost } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES, DEMO_AMOUNTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const post = usePost(id);
  const session = useSession();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
  });

  useEffect(() => {
    if (post) {
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
    }
  }, [post, session, reset, router]);

  const exchangeMethod = watch("exchangeMethod");
  const selectedAmount = watch("amount");

  if (!post) {
    return <div className="p-8 text-center">Loading post details...</div>;
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="border-2 border-border bg-card shadow-md">
          <CardHeader className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Edit className="h-6 w-6" />
              <span>Editing Post</span>
            </div>
            <CardTitle className="text-3xl font-extrabold">{post.title}</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Post Title</label>
                <Input {...register("title")} aria-invalid={Boolean(errors.title)} />
                {errors.title && (
                  <p className="text-xs text-destructive font-medium">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Skill or Service</label>
                <Input {...register("skill")} aria-invalid={Boolean(errors.skill)} />
                {errors.skill && (
                  <p className="text-xs text-destructive font-medium">{errors.skill.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Description</label>
                <Textarea {...register("description")} aria-invalid={Boolean(errors.description)} rows={4} />
                {errors.description && (
                  <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-foreground">Location</label>
                  <select
                    {...register("location")}
                    className="w-full rounded-md border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground"
                  >
                    {PLACES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-base font-bold text-foreground">Availability</label>
                  <select
                    {...register("availability")}
                    className="w-full rounded-md border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground"
                  >
                    {AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {exchangeMethod === "payment" && (
                <div className="space-y-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                  <DemoPaymentBanner />
                  <label className="text-sm font-bold text-foreground block">Demo Amount (£)</label>
                  <div className="flex gap-2">
                    {DEMO_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setValue("amount", amt)}
                        className={`px-4 py-2 rounded-md border-2 font-bold text-sm ${
                          selectedAmount === amt
                            ? "border-blue-700 bg-blue-700 text-white"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        £{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border pt-6 flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="font-bold" disabled={loading}>
                {loading ? "Saving changes..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
