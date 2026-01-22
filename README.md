# Analista MeLI

Esta app **NO usa la API oficial** de MercadoLibre. En su lugar:
- hace un **fetch del HTML** del listado (ej: `https://listado.mercadolibre.com.ar/auricular`)
- y extrae productos con `cheerio`.

## Advertencia importante (realista)
Este enfoque **puede ser bloqueado** por medidas anti-bot (403/Access Denied/Captcha), especialmente en entornos serverless (Vercel).
Tampermonkey suele funcionar mejor porque corre **dentro del navegador** en el sitio de MercadoLibre.

## Localhost
```bash
npm install
npm run dev
```
Abrí http://localhost:3000

## Deploy en Vercel
- Subí a GitHub
- Importá en Vercel (Next.js detectado automáticamente)

## Notas de estabilidad
Si te devuelve "Bloqueo anti-bot detectado" o no extrae productos:
- probá otra red / IP
- probá consultas más generales
- o considerá volver a opción A (Tampermonkey) para estabilidad.


## Campos adicionales (best-effort)
La UI muestra `Vendedor` y `Vendidos` cuando el HTML del listado los incluye. En algunos listados MercadoLibre no expone esos datos en la tarjeta y pueden aparecer como `—`.


## Selector Top (10/20/100/Ver todo)
Podés elegir Top 10, Top 20, Top 100 o Ver todo (hasta 200 por estabilidad). La app ordena por `Vendidos` (cuando el HTML lo incluye).


## Nota sobre status 200 sin resultados
A veces MercadoLibre devuelve HTTP 200 con un HTML "shell" (sin cards) y renderiza resultados con JavaScript en el cliente, o aplica bloqueo silencioso. En ese caso la API `/api/search` intenta extraer desde JSON embebido; si no existe, puede fallar.
