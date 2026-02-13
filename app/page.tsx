"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function Home() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("scoraAffiliateAuthed");
    if (saved === "true") {
      setIsAuthed(true);
    }
  }, []);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem("scoraAffiliateAuthed", "true");
    setIsAuthed(true);
  };

  if (!isAuthed) {
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
                      placeholder="••••••••"
                      className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400"
                    />
                  </div>
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
      <div className="mx-auto w-full max-w-6xl rounded-[36px] border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-zinc-900">
                  Product catalog
                </h1>
                <p className="text-sm text-zinc-500">
                  Discover and promote high-converting affiliate products.
                </p>
              </header>
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
            </div>
          </section>

          <aside className="flex h-full flex-col gap-6 rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Emily Connor</p>
                  <p className="text-xs text-zinc-500">emily.connor@gmail.com</p>
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
              onClick={() => {
                window.localStorage.removeItem("scoraAffiliateAuthed");
                setIsAuthed(false);
              }}
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
