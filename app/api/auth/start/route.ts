import { NextResponse } from "next/server";

export const runtime = "nodejs";

function randomState() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function GET() {
  const clientId = process.env.MELI_CLIENT_ID;
  const redirectUri = process.env.MELI_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: "Faltan MELI_CLIENT_ID o MELI_REDIRECT_URI en variables de entorno." },
      { status: 500 }
    );
  }

  const url = new URL("https://auth.mercadolibre.com.ar/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", randomState());

  return NextResponse.redirect(url.toString());
}
