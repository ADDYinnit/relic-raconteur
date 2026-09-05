import { supabase } from "@/integrations/supabase/client";

export type Artifact = {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  description: string;
  culture: string | null;
  era: string | null;
  materials: string | null;
  significance: string | null;
  origin_place: string | null;
  latitude: number | null;
  longitude: number | null;
  confidence: string | null;
  user_note: string | null;
  created_at: string;
};

export type ArtifactWithImage = Artifact & {
  signedUrl: string | null;
  author: string;
};

export type CommentRow = {
  id: string;
  artifact_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: string;
};

const BUCKET = "artifacts";

export async function signImages(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 60 * 60 * 6);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((entry, index) => {
    const path = entry.path ?? unique[index];
    if (path && entry.signedUrl) map[path] = entry.signedUrl;
  });
  return map;
}

async function authorNames(userIds: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return {};
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  const map: Record<string, string> = {};
  (data ?? []).forEach((row) => {
    map[row.id] = row.display_name ?? "Explorer";
  });
  return map;
}

export async function fetchArtifacts(): Promise<ArtifactWithImage[]> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as Artifact[];
  const [urls, names] = await Promise.all([
    signImages(rows.map((r) => r.image_url)),
    authorNames(rows.map((r) => r.user_id)),
  ]);
  return rows.map((row) => ({
    ...row,
    signedUrl: urls[row.image_url] ?? null,
    author: names[row.user_id] ?? "Explorer",
  }));
}

export async function fetchArtifact(id: string): Promise<ArtifactWithImage | null> {
  const { data, error } = await supabase.from("artifacts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Artifact;
  const [urls, names] = await Promise.all([
    signImages([row.image_url]),
    authorNames([row.user_id]),
  ]);
  return {
    ...row,
    signedUrl: urls[row.image_url] ?? null,
    author: names[row.user_id] ?? "Explorer",
  };
}

export async function fetchComments(artifactId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("artifact_id", artifactId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Omit<CommentRow, "author">[];
  const names = await authorNames(rows.map((r) => r.user_id));
  return rows.map((row) => ({ ...row, author: names[row.user_id] ?? "Explorer" }));
}

/** Downscale an image file to a JPEG data URL, keeping uploads and AI calls small. */
export function fileToResizedDataUrl(file: File, maxSize = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta ?? "")?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
