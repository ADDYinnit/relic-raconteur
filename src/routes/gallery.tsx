import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fetchArtifacts } from "@/lib/archive";
import { SiteHeader } from "@/components/SiteHeader";
import { ArtifactCard } from "@/components/ArtifactCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Public Gallery — Antiquary Artifact Archive" },
      {
        name: "description",
        content:
          "Browse cultural artifacts uploaded by the community, each with an AI-written historical reading and public notes.",
      },
      { property: "og:title", content: "Public Gallery — Antiquary Artifact Archive" },
      {
        property: "og:description",
        content: "Explore heirlooms, relics and everyday objects from around the world.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["artifacts"],
    queryFn: fetchArtifacts,
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) =>
      [a.title, a.culture, a.era, a.origin_place, a.materials, a.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [data, query]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The collection</p>
            <h1 className="mt-2 text-4xl font-semibold">Public gallery</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every object here was photographed by a visitor and read by AI. Open one to add your
              own knowledge in the notes.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search culture, era, place…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="gold-rule mt-8 h-px w-full" />

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-10 text-sm text-destructive">
            The collection could not be loaded. Please refresh.
          </p>
        ) : filtered.length === 0 ? (
          <div className="surface-card mt-10 rounded-xl p-12 text-center">
            <h2 className="font-display text-2xl font-semibold">Nothing here yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {query ? "No artifacts match that search." : "Be the first to add an artifact."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
