import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import { fetchArtifacts } from "@/lib/archive";
import { SiteHeader } from "@/components/SiteHeader";
import { Skeleton } from "@/components/ui/skeleton";

const ArtifactMap = lazy(() => import("@/components/ArtifactMap"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "World Map — Antiquary Artifact Archive" },
      {
        name: "description",
        content:
          "See where every uploaded artifact likely came from, plotted on an interactive world map.",
      },
      { property: "og:title", content: "World Map — Antiquary Artifact Archive" },
      {
        property: "og:description",
        content: "An interactive map of artifact origins from across the archive.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({ queryKey: ["artifacts"], queryFn: fetchArtifacts });
  const artifacts = data ?? [];
  const located = artifacts.filter((a) => a.latitude !== null && a.longitude !== null);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">Provenance</p>
        <h1 className="mt-2 text-4xl font-semibold">Map of origins</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each pin is an artifact placed at its most likely place of origin, as estimated by the AI
          reading. {located.length} of {artifacts.length} artifacts are placed.
        </p>

        <div className="surface-card mt-8 h-[70vh] min-h-100 overflow-hidden rounded-xl">
          {!mounted || isLoading ? (
            <Skeleton className="size-full rounded-none" />
          ) : (
            <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
              <ArtifactMap artifacts={artifacts} />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
