"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

const COMMISSION_PER_REFERRAL = 5;

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

function getMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}T00:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

const REF_BASE_URL = process.env.NEXT_PUBLIC_REF_BASE_URL || "https://app.scora.nl";

export default function DashboardPage() {
  const [stats, setStats] = useState<AffiliateStat[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;
      const userId = session.session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      if (profile) setUsername((profile as { username: string }).username);
      const { data } = await supabase
        .from("affiliates")
        .select("month, referrals_count")
        .eq("user_id", userId);
      setStats((data as AffiliateStat[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const referralLink = username ? `${REF_BASE_URL}?ref=${encodeURIComponent(username)}` : "";

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chartData = useMemo(() => {
    const sorted = [...stats].sort((a, b) => (a.month > b.month ? 1 : -1));
    return sorted.map((item) => ({
      name: getMonthLabel(item.month),
      month: item.month,
      referrals: item.referrals_count ?? 0,
      earnings: (item.referrals_count ?? 0) * COMMISSION_PER_REFERRAL,
    }));
  }, [stats]);

  const totals = useMemo(() => {
    const totalReferrals = stats.reduce(
      (sum, item) => sum + (item.referrals_count ?? 0),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
        Data laden...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Overzicht</h2>
        <p className="text-sm text-neutral-500">
          Je referral-statistieken en inkomsten
        </p>
      </div>

      {username && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-700">Jouw referral link</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded bg-neutral-100 px-2 py-1.5 text-xs text-neutral-800">
              {referralLink}
            </code>
            <button
              type="button"
              onClick={copyReferralLink}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {copied ? "Gekopieerd" : "Kopiëren"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Totaal referrals
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {totals.totalReferrals}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Deze maand
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {totals.monthlyReferrals}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Inkomsten deze maand
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {formatCurrency(totals.monthlyEarnings)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Totaal verdiend
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {formatCurrency(totals.totalEarnings)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-semibold text-neutral-900">
            Referrals per maand
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            Aantal actieve referrals per maand
          </p>
          <div className="mt-6 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#737373" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e5e5",
                    }}
                    formatter={(value: number | undefined) => [value ?? 0, "Referrals"]}
                  />
                  <Bar dataKey="referrals" fill="#171717" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                Nog geen data
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-base font-semibold text-neutral-900">
            Inkomsten trend
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            €{COMMISSION_PER_REFERRAL} per actieve referral (MRR)
          </p>
          <div className="mt-6 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#737373" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e5e5",
                    }}
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Inkomsten"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ fill: "#059669" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                Nog geen data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-base font-semibold text-neutral-900">
          Maandoverzicht
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-neutral-500">
                <th className="pb-3 font-medium">Maand</th>
                <th className="pb-3 font-medium text-right">Referrals</th>
                <th className="pb-3 font-medium text-right">Inkomsten</th>
              </tr>
            </thead>
            <tbody>
              {[...stats]
                .sort((a, b) => (b.month > a.month ? 1 : -1))
                .map((item) => (
                  <tr
                    key={item.month}
                    className="border-b border-neutral-50 text-neutral-700"
                  >
                    <td className="py-3">{getMonthLabel(item.month)}</td>
                    <td className="py-3 text-right">
                      {item.referrals_count ?? 0}
                    </td>
                    <td className="py-3 text-right font-medium text-neutral-900">
                      {formatCurrency(
                        (item.referrals_count ?? 0) * COMMISSION_PER_REFERRAL
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {stats.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-400">
              Nog geen maandcijfers. Referral-data wordt hier getoond zodra die beschikbaar is.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
