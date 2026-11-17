import { defaultSettings } from "@/lib/defaults";
import type { PublicSettings } from "@/lib/types";

export async function getSiteSettings(): Promise<PublicSettings> {
  const baseUrl =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000/api/v1";

  try {
    const response = await fetch(`${baseUrl}/settings`, { next: { revalidate: 60 } });
    if (!response.ok) {
      return defaultSettings;
    }

    const envelope = (await response.json()) as { data?: PublicSettings };
    return envelope.data ?? defaultSettings;
  } catch {
    return defaultSettings;
  }
}
