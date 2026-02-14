"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const products = [
  {
    title: "Premium VPN Service",
    description:
      "Secure your internet connection with our premium VPN service.",
    payout: "$12",
    commission: "24%",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Web Design Masterclass",
    description: "Complete course on modern web design and development.",
    payout: "$12",
    commission: "32%",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Fitness Equipment Bundle",
    description: "Complete home gym equipment for fitness enthusiasts.",
    payout: "$12",
    commission: "24%",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "AI-Powered Content Creator",
    description: "Generate high-quality marketing copy and blog posts fast.",
    payout: "$12",
    commission: "24%",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Ergonomic Office Chair",
    description: "Improve posture and comfort for long hours of work.",
    payout: "$12",
    commission: "32%",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Gourmet Coffee Subscription",
    description: "Deliver artisanal coffee beans to your audience monthly.",
    payout: "$12",
    commission: "24%",
    image: "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=600&q=80",
  },
];

const EMAIL_DOMAIN = "affiliate.getscora.app";

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

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default function Home() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AffiliateStat[]>([]);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminRole, setAdminRole] = useState("affiliate");
  const [adminResult, setAdminResult] = useState<{
    email: string;
    tempPassword: string;
    username: string;
  } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const monthlyRefPrice = 5;

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return monthStart.toISOString().slice(0, 10);
  }, []);

  const totals = useMemo(() => {
    const totalReferrals = stats.reduce(
      (sum, item) => sum + (item.referrals_count || 0),
      0
    );
    const current = stats.find((item) => item.month === currentMonthKey);
    const monthlyReferrals = current?.referrals_count ?? 0;
    return {
      totalReferrals,
      monthlyReferrals,
      monthlyEarnings: monthlyReferrals * monthlyRefPrice,
      totalEarnings: totalReferrals * monthlyRefPrice,
    };
  }, [stats, currentMonthKey]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const ok = await loadProfile(data.session.user.id);
        if (!ok) {
          await supabase.auth.signOut();
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
      .from("affiliate_stats")
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

    const normalized = normalizeUsername(loginUsername);
    if (!normalized) {
      setLoginError("Vul een geldige gebruikersnaam in.");
      return;
    }

    const email = `${normalized}@${EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
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

    const normalized = normalizeUsername(adminUsername);
    if (!normalized) {
      setAdminError("Vul een geldige gebruikersnaam in.");
      setAdminLoading(false);
      return;
    }

    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalized, role: adminRole }),
    });

    const result = await response.json();
    if (!response.ok) {
      setAdminError(result.error ?? "Account aanmaken mislukt.");
      setAdminLoading(false);
      return;
    }

    setAdminResult(result);
    setAdminUsername("");
    setAdminLoading(false);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          Laden...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="grid min-h-screen lg:grid-cols-[1fr_2fr]">
          <div className="relative hidden min-h-screen lg:block">
            <Image
              src="/image12.png"
              alt="Scora affiliate preview"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
            <div className="absolute left-8 top-8 flex items-center gap-3">
              <Image src="/logo-7.png" alt="Scora" width={150} height={150} />
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-16">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Welkom terug</p>
                  <h1 className="text-xl font-semibold text-zinc-900">
                    Login bij je affiliate dashboard
                  </h1>
                </div>
                <form className="grid gap-4" onSubmit={handleLogin}>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-zinc-700" htmlFor="username">
                      Gebruikersnaam
                    </label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(event) => setLoginUsername(event.target.value)}
                      placeholder="gebruikersnaam"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,162,255,0.35),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(255,175,221,0.35),_transparent_45%)] px-6 py-16">
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

      <div className="mx-auto w-full max-w-6xl rounded-[36px] border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-zinc-900">
                  Affiliate dashboard
                </h1>
                <p className="text-sm text-zinc-500">
                  Overzicht van je referrals en inkomsten.
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    Referrals (totaal)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {totals.totalReferrals}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    Inkomsten deze maand
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">
                    € {totals.monthlyEarnings}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    Totaal verdiend
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    € {totals.totalEarnings}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-500">
                  <span className="text-zinc-400">🔍</span>
                  <span>Search...</span>
                </div>
                <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-600">
                  <span>Category</span>
                  <span>▾</span>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <article
                    key={product.title}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
                  >
                    <div className="relative h-36 w-full overflow-hidden rounded-2xl">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        {product.title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {product.description}
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {product.payout}
                        </p>
                        <p className="text-xs text-zinc-500">Average payout</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-600">
                          {product.commission}
                        </p>
                        <p className="text-xs text-zinc-500">Commission</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {profile.role === "admin" ? (
                <div className="mt-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Admin: account aanmaken
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Maak een nieuw affiliate account aan. De gebruiker krijgt een
                    tijdelijk wachtwoord.
                  </p>
                  <form className="mt-4 grid gap-3" onSubmit={handleAdminCreate}>
                    <input
                      value={adminUsername}
                      onChange={(event) => setAdminUsername(event.target.value)}
                      placeholder="Gebruikersnaam (ref code)"
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
                        <p>Account aangemaakt voor {adminResult.username}</p>
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
            </div>
          </section>

          <aside className="flex h-full flex-col gap-6 rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {profile.username}
                  </p>
                  <p className="text-xs text-zinc-500">{profile.role}</p>
                </div>
              </div>
              <button className="h-9 w-9 rounded-full border border-zinc-200 text-sm text-zinc-500">
                ▾
              </button>
            </div>

            <div className="grid gap-3">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-500">
                <span>🔍</span>
                <span>Search...</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Dashboard
                </p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                  <button className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900">
                    <span>🏠</span>
                    Overview
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100">
                    <span>📈</span>
                    Analytics
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Business
                </p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                  <button className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900">
                    <span>🔎</span>
                    Search for products
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100">
                    <span>💵</span>
                    Earnings and payouts
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100">
                    <span>🤝</span>
                    Referrals
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Account & settings
                </p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100">
                    <span>💬</span>
                    Support
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100">
                    <span>⚙️</span>
                    Settings
                  </button>
                </div>
              </div>
            </div>

            <button
              className="mt-auto flex items-center gap-2 text-sm text-red-500"
              onClick={handleLogout}
            >
              <span>⟲</span>
              Log out
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
