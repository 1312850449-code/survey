import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

type Submission = {
  time_location: string;
  problem_content: string;
  phone?: string | null;
  created_at?: string;
};

// 动态获取所有管理员邮箱：管理员注册后自动成为提醒接收人
async function getAdminEmails(): Promise<string[]> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const emails: string[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("List admin users error:", error.message);
      break;
    }
    data.users.forEach((u) => {
      if (u.email) emails.push(u.email);
    });
    if (data.users.length < perPage) break;
    page += 1;
  }

  return Array.from(new Set(emails));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 向所有管理员发送新反馈提醒；未配置 SMTP 时静默跳过
export async function notifyAdmins(submission: Submission): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);

  if (!host || !user || !pass) {
    return;
  }

  const recipients = await getAdminEmails();
  if (recipients.length === 0) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const time = submission.created_at
    ? new Date(submission.created_at).toLocaleString("zh-CN")
    : new Date().toLocaleString("zh-CN");

  const html = `
    <div style="font-family:Arial,'Microsoft YaHei',sans-serif;max-width:600px">
      <h2 style="color:#1e293b">收到一条新的质量问题反馈</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:110px">时间与地点</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${escapeHtml(submission.time_location)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc">问题内容</td>
            <td style="padding:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(submission.problem_content)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc">联系电话</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${escapeHtml(submission.phone || "未填写")}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc">提交时间</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${escapeHtml(time)}</td></tr>
      </table>
      <p style="font-size:13px;color:#64748b;margin-top:16px">
        请登录管理后台查看：<a href="https://survey-n91j.vercel.app/admin">管理后台</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"质量问题反馈" <${user}>`,
    to: recipients.join(","),
    subject: `【新反馈】${submission.time_location.slice(0, 40)}`,
    html,
  });
}
