import { NextRequest, NextResponse } from "next/server";

/**
 * Yupoo image proxy.
 *
 * photo.yupoo.com hot-link-protects its CDN — it only serves images when the
 * request carries a Referer from a *.yupoo.com page. Browsers loading our
 * pages send Referer: jerseydrop.vercel.app, so direct <img src> requests
 * come back as 403 broken icons.
 *
 * This route fetches the upstream image server-side with the correct Referer
 * (synthesized from the username at the start of the path:
 *   photo.yupoo.com/USERNAME/HASH/big.jpg → https://USERNAME.x.yupoo.com/),
 * then streams the bytes back to the browser. Allowed hosts are restricted
 * to photo(s).yupoo.com so the route can't be used as an open proxy.
 */

const ALLOWED_HOSTS = new Set(["photo.yupoo.com", "photos.yupoo.com"]);

export const runtime = "nodejs";
// Static-route cache window — Next will keep the proxied bytes in the route
// handler cache for 1 day before revalidating upstream.
export const revalidate = 86400;
// Always rendered on demand (we still cache via headers + Next data cache)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  // Build a yupoo subdomain referer from the first path segment (username).
  // e.g. photo.yupoo.com/jianbo666888/HASH/big.jpg → https://jianbo666888.x.yupoo.com/
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  const username = pathParts[0] || "";
  const referer = username
    ? `https://${username}.x.yupoo.com/`
    : "https://yupoo.com/";

  try {
    const upstream = await fetch(target, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
      },
      // Use Next data cache so identical requests don't re-hit upstream
      cache: "force-cache",
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Long browser cache — yupoo URLs are content-hashed so they're
        // safe to treat as immutable.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Image-Source": "yupoo-proxy",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
