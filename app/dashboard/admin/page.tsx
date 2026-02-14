"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

type UserRow = {
  id: string;
  username: string;
  role: string;
  must_change_password: boolean;
  totalReferrals: number;
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [role, setRole] = useState<"affiliate" | "admin">("affiliate");
  const [createResult, setCreateResult] = useState<{
    email: string;
    tempPassword: string;
    refCode: string;
  } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const loadUsers = async () => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers().finally(() => setUsersLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateResult(null);
    setCreateLoading(true);
    const normalized = normalizeUsername(refCode);
    if (!normalized) {
      setCreateError("Vul een geldige gebruikersnaam/ref code in.");
      setCreateLoading(false);
      return;
    }
    if (!email.trim()) {
      setCreateError("Vul een e-mailadres in.");
      setCreateLoading(false);
      return;
    }
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        refCode: normalized,
        role,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? "Aanmaken mislukt.");
      setCreateLoading(false);
      return;
    }
    setCreateResult(data);
    setEmail("");
    setRefCode("");
    setCreateLoading(false);
    loadUsers();
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "";
  const loginUrl = `${baseUrl}/login`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Admin</h2>
        <p className="text-sm text-neutral-500">
          Beheer affiliates en maak nieuwe accounts aan
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-semibold text-neutral-900">
            Nieuwe gebruiker aanmaken
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Gebruikersnaam = affiliate code. Gebruiker krijgt een tijdelijk wachtwoord en moet bij eerste login een nieuw wachtwoord kiezen.
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                placeholder="gebruiker@voorbeeld.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Gebruikersnaam / affiliate code
              </label>
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                required
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                placeholder="jan-affiliate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "affiliate" | "admin")}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              >
                <option value="affiliate">Affiliate</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {createError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {createError}
              </p>
            )}
            {createResult && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium">Account aangemaakt</p>
                <p className="mt-1">E-mail: {createResult.email}</p>
                <p className="mt-1">Ref code: {createResult.refCode}</p>
                <p className="mt-2 font-medium">
                  Tijdelijk wachtwoord: {createResult.tempPassword}
                </p>
                <p className="mt-2 text-emerald-700">
                  Stuur de gebruiker naar {loginUrl} met dit wachtwoord. Bij eerste login moet hij/zij een nieuw wachtwoord instellen.
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={createLoading}
              className="h-11 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {createLoading ? "Bezig..." : "Account aanmaken"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-semibold text-neutral-900">
            Overzicht gebruikers
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Alle affiliates en admins. Totaal: {users.length}
          </p>
          {usersLoading ? (
            <p className="mt-4 text-sm text-neutral-500">Laden...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="pb-2 font-medium">Gebruiker</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium text-right">Referrals</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-neutral-100 text-neutral-700"
                    >
                      <td className="py-2.5 font-medium text-neutral-900">
                        {u.username}
                      </td>
                      <td className="py-2.5">{u.role}</td>
                      <td className="py-2.5 text-right">{u.totalReferrals}</td>
                      <td className="py-2.5">
                        {u.must_change_password ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            Moet wachtwoord wijzigen
                          </span>
                        ) : (
                          <span className="text-neutral-400">Actief</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="py-6 text-center text-sm text-neutral-400">
                  Nog geen gebruikers
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
