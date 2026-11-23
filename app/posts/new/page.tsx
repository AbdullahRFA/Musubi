"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Sparkles, AlertCircle } from "lucide-react";
import { postSchema, type PostValues } from "@/lib/validators";
import { createPost } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES, DEMO_AMOUNTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";

export default function CreatePostPage() {
  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      description: "",
      category: CATEGORIES[0],
      skill: "",
      location: session?.location || PLACES[0].name,
      availability: session?.availability || AVAILABILITY[0],
      postType: "offer",
      exchangeMethod: "free",
      amount: null,
    },
  });

  const postType = watch("postType");
  const exchangeMethod = watch("exchangeMethod");
  const selectedAmount = watch("amount");

  const onSubmit = async (values: PostValues) => {
    setError(null);
    setLoading(true);
    try {
      const created = await createPost({
        ...values,
        templateId: null,
      });
      router.push(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create post. Please check your details.");
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
              <PlusCircle className="h-6 w-6" />
              <span>Standard Post Creation</span>
            </div>
            <CardTitle className="text-3xl font-extrabold">Create a Community Post</CardTitle>
            <CardDescription className="text-base">
              Share a skill or request a service from neighbors across generations.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Post Type: Offer or Request */}
              <div className="space-y-2">
                <label className="text-base font-bold text-foreground">Are you offering or requesting?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("postType", "offer")}
                    className={`p-4 rounded-lg border-2 text-left font-bold transition-all ${
                      postType === "offer"
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    I am offering help / teaching a skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("postType", "request")}
                    className={`p-4 rounded-lg border-2 text-left font-bold transition-all ${
                      postType === "request"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    I am requesting help / want to learn
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Category</label>
                <select
                  {...register("category")}
                  className="w-full rounded-md border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Post Title</label>
                <Input
                  placeholder="e.g. Traditional Japanese origami workshop, or Need help setting up Zoom"
                  {...register("title")}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && (
                  <p className="text-xs text-destructive font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Skill Tag */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Primary Skill or Service</label>
                <Input
                  placeholder="e.g. Origami, Grocery shopping, Calligraphy, Smartphone setup"
                  {...register("skill")}
                  aria-invalid={Boolean(errors.skill)}
                />
                {errors.skill && (
                  <p className="text-xs text-destructive font-medium">{errors.skill.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Description</label>
                <Textarea
                  placeholder="Describe what you will do, what you are looking for, and any materials or expectations..."
                  {...register("description")}
                  aria-invalid={Boolean(errors.description)}
                  className="h-32"
                />
                {errors.description && (
                  <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
                )}
              </div>

              {/* Location & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-foreground">Location / Neighborhood</label>
                  <select
                    {...register("location")}
                    className="w-full rounded-md border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-full rounded-md border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exchange Method */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <label className="text-base font-bold text-foreground">Exchange Arrangement</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EXCHANGE_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setValue("exchangeMethod", method.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        exchangeMethod === method.value
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <div className="font-bold text-sm text-foreground">{method.label}</div>
                      <p className="text-xs text-muted-foreground mt-1">{method.hint}</p>
                    </button>
                  ))}
                </div>

                {/* Amount selection if monetary */}
                {exchangeMethod === "paid" && (
                  <div className="space-y-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                    <DemoPaymentBanner />
                    <label className="text-sm font-bold text-foreground block">
                      Select Demo Amount (£)
                    </label>
                    <div className="flex gap-2">
                      {DEMO_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setValue("amount", amt)}
                          className={`px-4 py-2 rounded-md border-2 font-bold text-sm transition-all ${
                            selectedAmount === amt
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-border bg-card hover:bg-muted text-foreground"
                          }`}
                        >
                          £{amt}
                        </button>
                      ))}
                    </div>
                    {errors.amount && (
                      <p className="text-xs text-destructive font-medium">{errors.amount.message}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-6 flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="font-bold" disabled={loading}>
                {loading ? "Publishing post..." : "Publish Post"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
