import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const cookieStore = req.headers.get("cookie") || "";
    const accessToken = cookieStore
      .split(";")
      .find((c) => c.trim().startsWith("sb-access-token="))
      ?.split("=")[1];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (accessToken) {
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
    response.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}
