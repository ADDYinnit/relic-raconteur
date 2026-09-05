import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnalyzeInput = z.object({
  imageDataUrl: z.string().min(32),
  note: z.string().max(600).optional(),
});

export type ArtifactAnalysis = {
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
};

const SYSTEM_PROMPT = `You are a museum curator and material-culture historian. A visitor shows you a photograph of an object.
Identify it as best you can and write a careful, engaging historical reading.
Be honest about uncertainty: say "likely", "resembles", or "possibly" rather than inventing facts.
Reply with ONLY a JSON object, no markdown fences, using exactly these keys:
{
  "title": short evocative object name (max 8 words),
  "description": 2-3 paragraphs of plain prose on what the object is, how it was likely made and used, and its historical context,
  "culture": culture or tradition, or null,
  "era": approximate period, e.g. "late 19th century" or "Edo period (1603-1868)", or null,
  "materials": likely materials, or null,
  "significance": one or two sentences on cultural significance, or null,
  "origin_place": most likely place of origin as "City, Country" or "Region, Country", or null,
  "latitude": decimal latitude of that place, or null,
  "longitude": decimal longitude of that place, or null,
  "confidence": one of "high", "medium", "low"
}
If the photo clearly shows no cultural object, set title to "Unidentified object" and explain that in description.`;

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("The AI response could not be read.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export const analyzeArtifact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<ArtifactAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this app yet.");

    const userText = data.note
      ? `Analyze this artifact photo. The owner adds this context: "${data.note}"`
      : "Analyze this artifact photo.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("AI gateway error", response.status, body);
      if (response.status === 429) {
        throw new Error("The AI is busy right now — please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("This app has run out of AI credits. The owner needs to top them up.");
      }
      if (response.status === 403) {
        throw new Error("AI access is currently blocked for this app.");
      }
      throw new Error("The AI could not analyze this photo. Please try another image.");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty reading. Please try again.");

    const parsed = extractJson(content) as Record<string, unknown>;

    return {
      title: asText(parsed["title"]) ?? "Unidentified object",
      description: asText(parsed["description"]) ?? "No description could be produced.",
      culture: asText(parsed["culture"]),
      era: asText(parsed["era"]),
      materials: asText(parsed["materials"]),
      significance: asText(parsed["significance"]),
      origin_place: asText(parsed["origin_place"]),
      latitude: asNumber(parsed["latitude"], -90, 90),
      longitude: asNumber(parsed["longitude"], -180, 180),
      confidence: asText(parsed["confidence"])?.toLowerCase() ?? null,
    };
  });
