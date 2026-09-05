import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ImageOff, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchArtifact, fetchComments } from "@/lib/archive";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/artifact/$id")({
  head: () => ({
    meta: [
      { title: "Artifact Record — Antiquary Archive" },
      {
        name: "description",
        content:
          "An AI-written historical reading of a community-uploaded cultural artifact, with public notes and origin details.",
      },
      { property: "og:title", content: "Artifact Record — Antiquary Archive" },
      {
        property: "og:description",
        content: "Read the history behind this artifact and add your own notes.",
      },
    ],
  }),
  component: ArtifactPage,
});

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ArtifactPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const artifactQuery = useQuery({
    queryKey: ["artifact", id],
    queryFn: () => fetchArtifact(id),
  });
  const commentsQuery = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id),
  });

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase
        .from("comments")
        .insert({ artifact_id: id, user_id: user.id, body: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not post."),
  });

  const removeComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", id] }),
  });

  const artifact = artifactQuery.data;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/gallery">
            <ArrowLeft className="size-4" />
            Back to gallery
          </Link>
        </Button>

        {artifactQuery.isLoading ? (
          <Skeleton className="h-[60vh] rounded-xl" />
        ) : !artifact ? (
          <p className="text-sm text-muted-foreground">This artifact could not be found.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <div className="surface-card overflow-hidden rounded-xl">
                {artifact.signedUrl ? (
                  <img
                    src={artifact.signedUrl}
                    alt={artifact.title}
                    className="max-h-[65vh] w-full bg-muted object-contain"
                  />
                ) : (
                  <div className="flex h-80 items-center justify-center text-muted-foreground">
                    <ImageOff className="size-8" />
                  </div>
                )}
              </div>

              <p className="eyebrow mt-8">Artifact record</p>
              <h1 className="mt-2 text-4xl font-semibold">{artifact.title}</h1>
              {artifact.origin_place ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {artifact.origin_place}
                  {artifact.era ? ` · ${artifact.era}` : ""}
                </p>
              ) : null}

              <div className="gold-rule mt-6 h-px w-full" />

              <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed whitespace-pre-line">
                {artifact.description}
              </div>

              {artifact.significance ? (
                <blockquote className="mt-6 border-l-2 border-primary/60 pl-4 font-display text-lg italic">
                  {artifact.significance}
                </blockquote>
              ) : null}

              {artifact.user_note ? (
                <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <span className="eyebrow block">Owner's note</span>
                  {artifact.user_note}
                </p>
              ) : null}

              <section className="mt-12">
                <h2 className="text-2xl font-semibold">Notes from the community</h2>
                <div className="gold-rule mt-4 h-px w-full" />

                {user ? (
                  <div className="mt-6 flex flex-col gap-3">
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={3}
                      placeholder="Share what you know about this object…"
                    />
                    <Button
                      className="self-start"
                      disabled={!body.trim() || addComment.isPending}
                      onClick={() => addComment.mutate(body.trim())}
                    >
                      Post note
                    </Button>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    <Link to="/auth" className="underline underline-offset-4">
                      Sign in
                    </Link>{" "}
                    to add a note.
                  </p>
                )}

                <ul className="mt-8 flex flex-col gap-5">
                  {(commentsQuery.data ?? []).map((comment) => (
                    <li key={comment.id} className="surface-card rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {user?.id === comment.user_id ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto size-7"
                            aria-label="Delete note"
                            onClick={() => removeComment.mutate(comment.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                        {comment.body}
                      </p>
                    </li>
                  ))}
                  {commentsQuery.data?.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      No notes yet — be the first to comment.
                    </li>
                  ) : null}
                </ul>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card rounded-xl p-5">
                <h2 className="font-display text-xl font-semibold">Catalogue</h2>
                <dl className="mt-3">
                  <Fact label="Culture" value={artifact.culture} />
                  <Fact label="Era" value={artifact.era} />
                  <Fact label="Materials" value={artifact.materials} />
                  <Fact label="Origin" value={artifact.origin_place} />
                  <Fact label="Contributed by" value={artifact.author} />
                  <Fact
                    label="Added"
                    value={new Date(artifact.created_at).toLocaleDateString(undefined, {
                      dateStyle: "long",
                    })}
                  />
                </dl>
                {artifact.confidence ? (
                  <Badge variant="outline" className="mt-4">
                    AI confidence: {artifact.confidence}
                  </Badge>
                ) : null}
                {artifact.latitude !== null ? (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link to="/map">View on map</Link>
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 px-1 text-xs text-muted-foreground">
                Descriptions are AI-generated estimates and may be incomplete or wrong.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
