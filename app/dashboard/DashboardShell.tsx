"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  username: string;
  role: "admin" | "affiliate";
  must_change_password: boolean;
};

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.replace("/login");
        return;
      }
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, username, role, must_change_password")
        .eq("id", data.session.user.id)
        .single();
      if (error || !profileData) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }
      setProfile(profileData as Profile);
      if ((profileData as Profile).must_change_password) {
        setPasswordModal(true);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setProfile(null);
        router.replace("/login");
      }
    }
  );
  useEffect(() => () => authListener?.subscription?.unsubscribe(), [authListener]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Minimaal 8 tekens.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Wachtwoorden komen niet overeen.");
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError("Kon wachtwoord niet wijzigen.");
      setPasswordSaving(false);
      return;
    }
    if (profile) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", profile.id);
      setProfile({ ...profile, must_change_password: false });
    }
    setPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Laden...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <form
            onSubmit={handlePasswordUpdate}
            className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              Nieuw wachtwoord instellen
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Je gebruikt een tijdelijk wachtwoord. Kies een eigen wachtwoord.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nieuw wachtwoord"
                className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal wachtwoord"
                className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm"
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-4 h-11 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {passwordSaving ? "Opslaan..." : "Wachtwoord opslaan"}
            </button>
          </form>
        </div>
      )}

      <div className="flex">
        <aside className="hidden w-56 flex-col border-r border-neutral-200 bg-white lg:flex">
          <div className="border-b border-neutral-100 p-5">
            <Link href="/dashboard" className="text-sm font-semibold text-neutral-900">
              Scora
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5 p-3 text-sm">
            <Link
              href="/dashboard"
              className={`rounded-lg px-3 py-2 ${
                pathname === "/dashboard"
                  ? "bg-neutral-100 font-medium text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              Overzicht
            </Link>
            {profile.role === "admin" && (
              <Link
                href="/dashboard/admin"
                className={`rounded-lg px-3 py-2 ${
                  pathname === "/dashboard/admin"
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
            <h1 className="text-sm font-medium text-neutral-900">
              Welkom, {profile.username}
            </h1>
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                {profile.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Uitloggen
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
