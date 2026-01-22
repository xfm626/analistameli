# Analista MeLI

Esta versión usa **MercadoLibre API oficial** con **OAuth (Authorization Code)** para evitar bloqueos anti-bot típicos del scraping server-side.

## 1) Configurar variables de entorno (local)
1. Copiá `.env.example` a `.env.local`
2. Completá:
- `MELI_CLIENT_ID` (App ID)
- `MELI_CLIENT_SECRET`
- `MELI_REDIRECT_URI` = `http://localhost:3000/api/auth/callback`
- `MELI_SITE_ID` = `MLA`

## 2) Ejecutar
```bash
npm install
npm run dev
```

## 3) Hacer OAuth y obtener refresh_token
1. Abrí en el navegador:
   - `http://localhost:3000/api/auth/start`
2. Iniciá sesión y aceptá permisos.
3. Te redirige a `/api/auth/callback` y te muestra el `refresh_token`.
4. Copiá ese `refresh_token` y pegalo en `.env.local` como `MELI_REFRESH_TOKEN`.
5. Reiniciá el server (Ctrl+C y `npm run dev`).

## 4) Deploy en Vercel
En Vercel → Project → Settings → Environment Variables, cargá:
- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`
- `MELI_REDIRECT_URI` = `https://TU-DOMINIO.vercel.app/api/auth/callback`
- `MELI_SITE_ID` = `MLA`
- `MELI_REFRESH_TOKEN`

Redeploy.

## Notas
- La app ordena por “más vendido” usando `sold_quantity` cuando está disponible.
- Si el endpoint `/sites/{site_id}/search` te devuelve 403, revisá políticas/limitaciones y considerá endpoints alternativos de usuario.

