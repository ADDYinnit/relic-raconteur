import { Link } from "@tanstack/react-router";
import { ImageOff, MapPin, MessageCircle } from "lucide-react";
import type { ArtifactWithImage } from "@/lib/archive";
import { Badge } from "@/components/ui/badge";

function confidenceLabel(value: string | null) {
  if (!value) return null;
  if (value.startsWith("h")) return "High confidence";
  if (value.startsWith("m")) return "Medium confidence";
  return "Low confidence";
}

export function ArtifactCard({
  artifact,
  commentCount,
}: {
  artifact: ArtifactWithImage;
  commentCount?: number;
}) {
  const confidence = confidenceLabel(artifact.confidence);

  return (
    <Link
      to="/artifact/$id"
      params={{ id: artifact.id }}
      className="group surface-card relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {artifact.signedUrl ? (
          <img
            src={artifact.signedUrl}
            alt={artifact.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent opacity-90" />

        {artifact.era ? (
          <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-foreground uppercase backdrop-blur-sm">
            {artifact.era}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl leading-tight font-semibold text-background drop-shadow-sm">
            {artifact.title}
          </h3>
          {artifact.origin_place ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-background/85">
              <MapPin className="size-3" />
              {artifact.origin_place}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="gold-rule h-px w-full" />
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {artifact.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {artifact.culture ? <Badge variant="secondary">{artifact.culture}</Badge> : null}
          {confidence ? <Badge variant="outline">{confidence}</Badge> : null}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            {typeof commentCount === "number" ? (
              <>
                <MessageCircle className="size-3.5" />
                {commentCount}
              </>
            ) : null}
          </span>
        </div>
        <p className="text-[0.7rem] text-muted-foreground">Added by {artifact.author}</p>
      </div>
    </Link>
  );
}
