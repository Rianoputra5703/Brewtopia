// ==================================================================
// ROUTING MIDDLEWARE (Vercel) — bikin preview link WA/Facebook selalu
// ikut data terbaru dari Supabase (tab Pengaturan > SEO di admin),
// tanpa perlu edit index.html manual lagi.
//
// SETUP (dilakukan SEKALI per project Vercel, bukan tiap ganti data):
// 1. File ini WAJIB ditaruh di ROOT project (sejajar package.json),
//    namanya harus persis "middleware.ts" — bukan di dalam folder src,
//    dan jangan ada file "middleware.js" lain di root pada saat
//    bersamaan (Vercel hanya boleh punya SATU file middleware).
// 2. Di Vercel Dashboard → project → Settings → Environment Variables,
//    tambahkan 2 variable ini:
//      SUPABASE_URL       = https://xxxxx.supabase.co
//      SUPABASE_ANON_KEY  = anon/public key project Supabase, format
//                            "Legacy" yang diawali "eyJhbGci..."
//                            (BUKAN format baru "sb_publishable_...").
//                            Ambil di Supabase Dashboard > Project
//                            Settings > API > "Legacy API Keys".
// 3. Middleware ini TIDAK jalan kalau cuma `npm run dev` (itu Vite
//    dev server biasa). Untuk tes, deploy dulu ke Vercel, lalu cek
//    lewat Facebook Sharing Debugger atau opengraph.xyz — JANGAN
//    langsung tes ke WhatsApp karena WA suka nyimpen cache lama.
// ==================================================================

declare const process: { env: Record<string, string | undefined> }

export const config = {
  matcher: '/((?!api|assets|.*\\.(?:png|jpg|jpeg|gif|svg|css|js|ico|woff2?)$).*)',
}

const BOT_UA_REGEX =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|vkShare|SkypeUriPreview|line-poker/i

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''

  if (!BOT_UA_REGEX.test(userAgent)) {
    return
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  let title = 'Coffee Shop'
  let description = ''
  let image = ''
  let cafeName = 'Website'

  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const [seoRes, cafeRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.seo&select=value`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }),
        fetch(`${SUPABASE_URL}/rest/v1/cafe_info?select=name&limit=1`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }),
      ])

      const seoData = await seoRes.json()
      if (seoData?.[0]?.value) {
        const parsed = JSON.parse(seoData[0].value)
        title = parsed.title || title
        description = parsed.meta_description || description
        image = parsed.og_image_url || image
      }

      const cafeData = await cafeRes.json()
      if (cafeData?.[0]?.name) {
        cafeName = cafeData[0].name
        if (!title || title === 'Coffee Shop') title = cafeName
      }
    }
  } catch (e) {
    // kalau Supabase gagal diakses, tetap balas HTML dengan nilai default
  }

  const pageUrl = request.url

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapeHtml(cafeName)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />` : ''}
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
</head>
<body></body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return String(str || '').replace(/[&<>"']/g, (c) => map[c])
}