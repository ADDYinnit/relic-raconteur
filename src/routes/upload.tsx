import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeArtifact } from "@/lib/artifacts.functions";
import { dataUrlToBlob, fileToResizedDataUrl } from "@/lib/archive";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Add an Artifact — Antiquary" },
      {
        name: "description",
        content:
          "Upload a photo of a cultural artifact and let AI write its historical description, then share it with the archive.",
      },
      { property: "og:title", content: "Add an Artifact — Antiquary" },
      {
        property: "og:description",
        content: "Photograph an object and get an instant AI historical reading.",
      },
    ],
  }),
  component: UploadPage,
});

type Stage = "idle" | "analyzing" | "saving";

function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeArtifact);

  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<Stage>("idle");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      setPreview(await fileToResizedDataUrl(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that photo.");
    }
  };

  const submit = async () => {
    if (!preview || !user) return;
    try {
      setStage("analyzing");
      const analysis = await analyze({
        data: { imageDataUrl: preview, note: note.trim() || undefined },
      });

      setStage("saving");
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("artifacts")
        .upload(path, dataUrlToBlob(preview), { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: inserted, error: insertError } = await supabase
        .from("artifacts")
        .insert({
          user_id: user.id,
          image_url: path,
          title: analysis.title,
          description: analysis.description,
          culture: analysis.culture,
          era: analysis.era,
          materials: analysis.materials,
          significance: analysis.significance,
          origin_place: analysis.origin_place,
          latitude: analysis.latitude,
          longitude: analysis.longitude,
          confidence: analysis.confidence,
          user_note: note.trim() || null,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["artifacts"] });
      toast.success("Artifact added to the archive.");
      navigate({ to: "/artifact/$id", params: { id: inserted.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setStage("idle");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="eyebrow">New entry</p>
        <h1 className="mt-2 text-4xl font-semibold">Add an artifact</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Photograph the object against a plain background if you can. The AI will suggest what it
          is, where it came from and why it matters.
        </p>

        {!loading && !user ? (
          <div className="surface-card mt-8 rounded-xl p-10 text-center">
            <h2 className="font-display text-2xl font-semibold">Sign in to contribute</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browsing is open to everyone, but adding artifacts needs an account.
            </p>
            <Button asChild className="mt-6">
              <Link to="/auth">Sign in or create an account</Link>
            </Button>
          </div>
        ) : (
          <div className="surface-card mt-8 flex flex-col gap-6 rounded-xl p-6">
            <div>
              <Label htmlFor="photo">Photo</Label>
              <label
                htmlFor="photo"
                className="mt-2 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 transition-colors hover:border-ring"
              >
                {preview ? (
                  <img src={preview} alt="Selected artifact" className="size-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <ImagePlus className="size-7" />
                    Choose or drop a photo
                  </span>
                )}
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Anything you already know (optional)</Label>
              <Textarea
                id="note"
                value={note}
                maxLength={600}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Passed down from my grandmother in Oaxaca; roughly 30cm tall."
                rows={3}
              />
            </div>

            <Button
              size="lg"
              disabled={!preview || stage !== "idle"}
              onClick={submit}
              className="self-start"
            >
              {stage === "idle" ? (
                <>
                  <Sparkles className="size-4" />
                  Analyze and publish
                </>
              ) : (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {stage === "analyzing" ? "Reading the object…" : "Adding to the archive…"}
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
