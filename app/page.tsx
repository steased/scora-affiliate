"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const COMMISSION_PER_REFERRAL = 5;

type Profile = {
  id: string;
  username: string;
  role: "admin" | "affiliate";
  must_change_password: boolean;
};

type AffiliateStat = {
  month: string;
  referrals_count: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function getMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}T00:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function Home() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AffiliateStat[]>([]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminRefCode, setAdminRefCode] = useState("");
  const [adminRole, setAdminRole] = useState("affiliate");
  const [adminResult, setAdminResult] = useState<{
    email: string;
    tempPassword: string;
    refCode: string;
  } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const chartPoints = useMemo(() => {
    const sorted = [...stats].sort((a, b) => (a.month > b.month ? 1 : -1));
    if (sorted.length === 0) {
      return "";
    }
    const maxValue = Math.max(...sorted.map((item) => item.referrals_count || 0), 1);
    return sorted
      .map((item, index) => {
        const x = (index / Math.max(sorted.length - 1, 1)) * 280;
        const y = 100 - (item.referrals_count / maxValue) * 80;
        return `${x},${y}`;
      })
      .join(" ");
  }, [stats]);

  const totals = useMemo(() => {
    const totalReferrals = stats.reduce(
      (sum, item) => sum + (item.referrals_count || 0),
      0
    );

    const currentMonth = new Date();
    const currentKey = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    )
      .toISOString()
      .slice(0, 10);

    const current = stats.find((item) => item.month === currentKey);
    const monthlyReferrals = current?.referrals_count ?? 0;

    return {
      totalReferrals,
      monthlyReferrals,
      monthlyEarnings: monthlyReferrals * COMMISSION_PER_REFERRAL,
      totalEarnings: totalReferrals * COMMISSION_PER_REFERRAL,
    };
  }, [stats]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const ok = await loadProfile(data.session.user.id);
        if (!ok) {
          await supabase.auth.signOut();
          setLoginError("Account niet gevonden. Neem contact op met support.");
        }
      }
      setSessionLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const ok = await loadProfile(session.user.id);
          if (!ok) {
            await supabase.auth.signOut();
            setLoginError("Account niet gevonden. Neem contact op met support.");
          }
        } else {
          setProfile(null);
          setStats([]);
        }
      }
    );

    init();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("id, username, role, must_change_password")
      .eq("id", userId)
      .single();

    if (error) {
      setProfile(null);
      return false;
    }

    setProfile(profileData as Profile);

    const { data: statsData } = await supabase
      .from("affiliates")
      .select("month, referrals_count")
      .eq("user_id", userId);

    if (statsData) {
      setStats(statsData as AffiliateStat[]);
    } else {
      setStats([]);
    }

    return true;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setLoginError("Inloggen mislukt. Controleer je gegevens.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (userId) {
      const ok = await loadProfile(userId);
      if (!ok) {
        await supabase.auth.signOut();
        setLoginError("Account niet gevonden. Neem contact op met support.");
      }
    }
  };

  const handlePasswordUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Wachtwoord moet minimaal 8 tekens zijn.");
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

    setPasswordSaving(false);
    setPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const handleAdminCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);
    setAdminResult(null);
    setAdminLoading(true);

    const normalizedRef = normalizeUsername(adminRefCode);
    if (!normalizedRef) {
      setAdminError("Vul een geldige ref code in.");
      setAdminLoading(false);
      return;
    }

    if (!adminEmail.trim()) {
      setAdminError("Vul een geldig e-mailadres in.");
      setAdminLoading(false);
      return;
    }

    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail.trim(),
        refCode: normalizedRef,
        role: adminRole,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setAdminError(result.error ?? "Account aanmaken mislukt.");
      setAdminLoading(false);
      return;
    }

    setAdminResult(result);
    setAdminEmail("");
    setAdminRefCode("");
    setAdminLoading(false);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-500">
        <div className="flex min-h-screen items-center justify-center text-sm">
          Laden...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f4f3ef]">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
          <div className="grid w-full gap-10 rounded-[32px] border border-zinc-200 bg-white p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col justify-center gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
                  Scora affiliate
                </p>
                <h1 className="mt-4 text-3xl font-semibold text-zinc-900">
                  Welkom terug
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Log in om je referrals, omzet en groei te beheren.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
                <p className="font-medium text-zinc-900">Affiliate voordeel</p>
                <p className="mt-2">
                  Je verdient €5 MRR per actieve referral. Alle cijfers worden realtime
                  bijgewerkt in je dashboard.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-zinc-400">Gemiddelde groei</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-900">+24%</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-zinc-400">Actieve affiliates</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-900">128</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <form className="grid gap-4" onSubmit={handleLogin}>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Inloggen</h2>
                  <p className="text-sm text-zinc-500">
                    Gebruik je e-mailadres en wachtwoord.
                  </p>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-700" htmlFor="email">
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="jij@scora.app"
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium text-zinc-700"
                    htmlFor="password"
                  >
                    Wachtwoord
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400"
                  />
                </div>
                {loginError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {loginError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Inloggen
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-zinc-900">
      {profile.must_change_password && passwordModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <form
            onSubmit={handlePasswordUpdate}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Wijzig je wachtwoord
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Je gebruikt een tijdelijk wachtwoord. Kies nu een eigen wachtwoord.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nieuw wachtwoord"
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Herhaal wachtwoord"
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm"
              />
              {passwordError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {passwordError}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-4 h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {passwordSaving ? "Opslaan..." : "Wachtwoord opslaan"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-zinc-200 bg-white px-6 py-8 lg:flex">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-700">
            Scora
          </div>
          <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-500">
            <p className="text-zinc-900">Affiliate center</p>
            <p className="mt-2">
              Verdien €5 per actieve referral. Volg je groei in realtime.
            </p>
          </div>
          <nav className="mt-8 grid gap-2 text-sm text-zinc-600">
            <button className="rounded-xl bg-zinc-100 px-3 py-2 text-left text-zinc-900">
              Dashboard
            </button>
            <button className="rounded-xl px-3 py-2 text-left hover:bg-zinc-100">
              Referrals
            </button>
            <button className="rounded-xl px-3 py-2 text-left hover:bg-zinc-100">
              Earnings
            </button>
            <button className="rounded-xl px-3 py-2 text-left hover:bg-zinc-100">
              Analytics
            </button>
            <button className="rounded-xl px-3 py-2 text-left hover:bg-zinc-100">
              Settings
            </button>
          </nav>
          <div className="mt-auto rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
            <p className="text-zinc-900">Logged in</p>
            <p className="mt-1">{profile.username}</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                <span className="text-zinc-400">🔍</span>
                Zoeken...
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-3 py-1">
                {profile.role}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-200 px-3 py-1 hover:bg-zinc-50"
              >
                Log out
              </button>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <section className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      Referrals (totaal)
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">
                      {totals.totalReferrals}
                    </p>
                    <p className="mt-2 text-xs text-emerald-600">+12% deze maand</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      Inkomsten deze maand
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">
                      {formatCurrency(totals.monthlyEarnings)}
                    </p>
                    <p className="mt-2 text-xs text-emerald-600">+8% vs vorige maand</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      Totaal verdiend
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-900">
                      {formatCurrency(totals.totalEarnings)}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">Sinds start</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        Referral groei
                      </h2>
                      <p className="text-sm text-zinc-500">
                        Laatste 6 maanden overzicht.
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
                      MRR: €{COMMISSION_PER_REFERRAL}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <svg viewBox="0 0 280 100" className="h-40 w-full">
                        <polyline
                          fill="none"
                          stroke="#111827"
                          strokeWidth="2"
                          points={chartPoints}
                        />
                      </svg>
                    </div>
                    <div className="grid gap-3">
                      {stats.slice(0, 4).map((item) => (
                        <div
                          key={item.month}
                          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                        >
                          <p className="text-xs text-zinc-500">
                            {getMonthLabel(item.month)}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-zinc-900">
                            {item.referrals_count} referrals
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      Maandrapport
                    </h2>
                    <button className="text-sm text-zinc-500">Export</button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {stats.map((item) => (
                      <div
                        key={item.month}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 text-sm text-zinc-600"
                      >
                        <span>{getMonthLabel(item.month)}</span>
                        <span>{item.referrals_count} referrals</span>
                        <span className="font-semibold text-zinc-900">
                          {formatCurrency(item.referrals_count * COMMISSION_PER_REFERRAL)}
                        </span>
                      </div>
                    ))}
                    {stats.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Voeg stats toe in Supabase om data te zien.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="grid gap-6">
                {profile.role === "admin" ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      Admin panel
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Maak een nieuw account aan met email + ref code.
                    </p>
                    <form className="mt-4 grid gap-3" onSubmit={handleAdminCreate}>
                      <input
                        value={adminEmail}
                        onChange={(event) => setAdminEmail(event.target.value)}
                        placeholder="E-mailadres"
                        className="h-11 rounded-xl border border-zinc-200 px-4 text-sm"
                        required
                        type="email"
                      />
                      <input
                        value={adminRefCode}
                        onChange={(event) => setAdminRefCode(event.target.value)}
                        placeholder="Gebruikersnaam / ref code"
                        className="h-11 rounded-xl border border-zinc-200 px-4 text-sm"
                        required
                      />
                      <select
                        value={adminRole}
                        onChange={(event) => setAdminRole(event.target.value)}
                        className="h-11 rounded-xl border border-zinc-200 px-4 text-sm"
                      >
                        <option value="affiliate">Affiliate</option>
                        <option value="admin">Admin</option>
                      </select>
                      {adminError ? (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                          {adminError}
                        </p>
                      ) : null}
                      {adminResult ? (
                        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          <p>Account aangemaakt voor {adminResult.refCode}</p>
                          <p>Email: {adminResult.email}</p>
                          <p>Tijdelijk wachtwoord: {adminResult.tempPassword}</p>
                        </div>
                      ) : null}
                      <button
                        type="submit"
                        disabled={adminLoading}
                        className="h-11 rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                      >
                        {adminLoading ? "Bezig..." : "Account aanmaken"}
                      </button>
                    </form>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Snelle acties
                  </h2>
                  <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                    <button className="rounded-xl border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50">
                      Referral link kopieren
                    </button>
                    <button className="rounded-xl border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50">
                      Payout instellingen
                    </button>
                    <button className="rounded-xl border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50">
                      Support aanvragen
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
