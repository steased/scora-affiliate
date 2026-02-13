import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generateTempPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function POST(request: Request) {
  const { username, role } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const normalized = normalizeUsername(username);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const safeRole = role === "admin" ? "admin" : "affiliate";
  const email = `${normalized}@affiliate.getscora.app`;
  const tempPassword = generateTempPassword();

  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    return NextResponse.json({ error: userError?.message ?? "Create user failed" }, { status: 400 });
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userData.user.id,
    username: normalized,
    role: safeRole,
    must_change_password: true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ email, tempPassword, username: normalized });
}
