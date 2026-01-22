type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  user_id?: number;
  refresh_token?: string;
};

export async function getAccessToken(): Promise<{ accessToken: string; source: "refresh" }> {
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const refreshToken = process.env.MELI_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan MELI_CLIENT_ID / MELI_CLIENT_SECRET / MELI_REFRESH_TOKEN.");
  }

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("refresh_token", refreshToken);

  const r = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = (await r.json().catch(() => null)) as TokenResponse | null;

  if (!r.ok || !data?.access_token) {
    throw new Error(`No se pudo refrescar access token (status ${r.status}).`);
  }

  return { accessToken: data.access_token, source: "refresh" };
}
