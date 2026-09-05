import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import type { ArtifactWithImage } from "@/lib/archive";

const pinIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:var(--primary);box-shadow:0 0 0 4px color-mix(in oklch, var(--gold) 55%, transparent), 0 2px 6px rgba(0,0,0,.35)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function ArtifactMap({ artifacts }: { artifacts: ArtifactWithImage[] }) {
  const located = useMemo(
    () => artifacts.filter((a) => a.latitude !== null && a.longitude !== null),
    [artifacts],
  );

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((artifact) => (
        <Marker
          key={artifact.id}
          position={[artifact.latitude as number, artifact.longitude as number]}
          icon={pinIcon}
        >
          <Popup>
            <Link
              to="/artifact/$id"
              params={{ id: artifact.id }}
              className="flex w-52 flex-col gap-2 no-underline"
            >
              {artifact.signedUrl ? (
                <img
                  src={artifact.signedUrl}
                  alt={artifact.title}
                  className="h-28 w-full rounded-md object-cover"
                />
              ) : null}
              <span className="font-display text-base leading-tight font-semibold text-foreground">
                {artifact.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {artifact.origin_place ?? "Unknown origin"}
                {artifact.era ? ` · ${artifact.era}` : ""}
              </span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
