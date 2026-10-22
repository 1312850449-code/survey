import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/api/submit"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico";

  const res = NextResponse.next();

  if (isPublic) {
    return res;
  }

  const accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  if (pathname.startsWith("/admin/login")) {
    if (accessToken) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      );
      const { data } = await supabase.auth.getUser(accessToken);
      if (data.user) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
    return res;
  }

  if (pathname.startsWith("/admin")) {
    if (!accessToken) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      if (refreshToken) {
        const { data: refreshData } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (refreshData.session) {
          res.cookies.set({
            name: "sb-access-token",
            value: refreshData.session.access_token,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
          res.cookies.set({
            name: "sb-refresh-token",
            value: refreshData.session.refresh_token,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
          return res;
        }
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
