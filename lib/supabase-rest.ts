const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;

export class SupabaseConfigurationError extends Error {}

function getConfig() {
  if (!projectUrl || !secretKey) {
    throw new SupabaseConfigurationError("Supabase não está configurado no servidor.");
  }
  return { projectUrl, secretKey };
}

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { projectUrl, secretKey } = getConfig();
  const response = await fetch(`${projectUrl}/rest/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      apikey: secretKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase respondeu ${response.status}: ${detail.slice(0, 300)}`);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}
