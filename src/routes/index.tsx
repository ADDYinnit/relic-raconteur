import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Globe2, MessagesSquare } from "lucide-react";
import heroImage from "@/assets/hero-artifacts.jpg";
import { fetchArtifacts } from "@/lib/archive";
import { SiteHeader } from "@/components/SiteHeader";
import { ArtifactCard } from "@/components/ArtifactCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Antiquary — AI Archive of Cultural Artifacts" },
      {
        name: "description",
        content:
          "Photograph a cultural artifact, get an instant AI historical reading, and share it in a public gallery and world map anyone can explore and discuss.",
      },
      { property: "og:title", content: "Antiquary — AI Archive of Cultural Artifacts" },
      {
        property: "og:description",
        content: "Upload an artifact photo, get its history, and add it to a shared public archive.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: Camera,
    title: "Photograph it",
    body: "Upload any object — an heirloom, a market find, a museum piece you were allowed to shoot.",
  },
  {
    icon: Globe2,
    title: "Read its history",
    body: "AI proposes the culture, era, materials and likely place of origin, then pins it on the map.",
  },
  {
    icon: MessagesSquare,
    title: "Let others weigh in",
    body: "Every entry joins the public gallery where visitors can correct, confirm and add context.",
  },
];

function Home() {
  const { data } = useQuery({ queryKey: ["artifacts"], queryFn: fetchArtifacts });
  const recent = (data ?? []).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">A community archive</p>
            <h1 className="mt-3 text-5xl leading-tight font-semibold sm:text-6xl">
              Every object carries a history. Let's read it.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Upload a photo of a cultural artifact and receive an instant historical description —
              its likely culture, era and meaning — then publish it to a shared archive that anyone
              can browse, map and discuss.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/upload">Add an artifact</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/gallery">Browse the gallery</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card overflow-hidden rounded-2xl">
            <img
              src={heroImage}
              alt="An inscribed stone fragment and a bronze vessel resting on aged parchment"
              width={1600}
              height={1100}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="gold-rule h-px w-full" />
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title}>
                <step.icon className="size-6 text-primary" />
                <h2 className="mt-3 font-display text-xl font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {recent.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 pb-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Recently catalogued</p>
                <h2 className="mt-2 text-3xl font-semibold">Latest arrivals</h2>
              </div>
              <Button asChild variant="ghost">
                <Link to="/gallery">See all</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Antiquary · AI descriptions are estimates and may be incomplete.
      </footer>
    </div>
  );
}
