import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createUserClient(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, username, role, must_change_password")
    .order("username");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optional: get referral counts per user from affiliates table
  const { data: affiliateStats } = await adminClient
    .from("affiliates")
    .select("user_id, referrals_count");
  const totalByUser = (affiliateStats ?? []).reduce(
    (acc, row) => {
      acc[row.user_id] = (acc[row.user_id] ?? 0) + (row.referrals_count ?? 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const users = (profiles ?? []).map((p) => ({
    ...p,
    totalReferrals: totalByUser[p.id] ?? 0,
  }));

  return NextResponse.json(users);
}
