import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  });
}


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
  const { email, refCode, role } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  if (!refCode || typeof refCode !== "string") {
    return NextResponse.json({ error: "Missing refCode" }, { status: 400 });
  }

  const normalized = normalizeUsername(refCode);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid refCode" }, { status: 400 });
  }

  const safeRole = role === "admin" ? "admin" : "affiliate";
  const tempPassword = generateTempPassword();

  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

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

  return NextResponse.json({ email, tempPassword, refCode: normalized });
}
