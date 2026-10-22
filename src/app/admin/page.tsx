import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );

  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: viewRecords, error: viewError } = await supabase
    .from("view_records")
    .select("*");

  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  const currentUser = userData?.user
    ? {
        id: userData.user.id,
        email: userData.user.email || "",
      }
    : null;

  return (
    <AdminDashboard
      initialSubmissions={submissions || []}
      initialViewRecords={viewRecords || []}
      currentUser={currentUser}
    />
  );
}
