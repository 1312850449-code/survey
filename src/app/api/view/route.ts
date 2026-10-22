import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const { submission_id, admin_id, admin_username } = body;

    if (!submission_id) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("view_records")
      .upsert(
        {
          submission_id,
          admin_id: userData.user.id,
          admin_username:
            userData.user.email || admin_username || "管理员",
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "submission_id,admin_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("View record error:", error);
      return NextResponse.json({ error: "记录失败" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("View API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
