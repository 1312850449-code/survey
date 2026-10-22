import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { time_location, problem_content, phone } = body;

    if (!time_location || !time_location.trim()) {
      return NextResponse.json({ error: "时间与地点必填" }, { status: 400 });
    }
    if (!problem_content || !problem_content.trim()) {
      return NextResponse.json({ error: "问题内容必填" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 不使用 .select() 回读：anon 角色只有 INSERT 权限，
    // 带 RETURNING 的插入会因缺少 SELECT 策略被 RLS 拒绝（42501）
    const { error } = await supabase.from("submissions").insert({
      time_location: time_location.trim(),
      problem_content: problem_content.trim(),
      phone: phone && phone.trim() ? phone.trim() : null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
