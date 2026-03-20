"use client";

import { useState, useEffect, useCallback } from "react";

interface Registration {
  id: string;
  first_name: string;
  display_name: string;
  email: string;
  city: string;
  ai_segment: string;
  motivation_text: string;
  guest_question: string;
  ab_variant: string;
  ai_tags: Record<string, unknown> | null;
  ticket_number: string;
  commitment_confirmed: boolean;
  created_at: string;
}

type Tab = "registrations" | "ab-test";

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("registrations");

  const fetchData = useCallback(async () => {
    try {
      const regRes = await fetch("/api/admin/registrations");
      const regData = await regRes.json();
      setRegistrations(regData.registrations || []);
      setTotalCount(regData.total || 0);
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = registrations.filter((r) => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    const name = (r.display_name || r.first_name || "").toLowerCase();
    return (
      name.includes(search) ||
      (r.email || "").toLowerCase().includes(search) ||
      (r.city || "").toLowerCase().includes(search) ||
      (r.ai_segment || "").toLowerCase().includes(search)
    );
  });

  // A/B test stats
  const variantA = registrations.filter((r) => r.ab_variant === "A");
  const variantB = registrations.filter((r) => r.ab_variant === "B");
  const avgWordCount = (regs: Registration[]) => {
    const withQ = regs.filter((r) => r.guest_question);
    if (withQ.length === 0) return 0;
    return Math.round(
      withQ.reduce((sum, r) => sum + r.guest_question.split(/\s+/).length, 0) / withQ.length
    );
  };

  const exportCSV = () => {
    const headers = [
      "Name", "Email", "City", "Segment", "Motivation", "Question",
      "A/B Variant", "AI Tags", "Committed", "Registered At",
    ];
    const rows = registrations.map((r) => [
      r.display_name || r.first_name,
      r.email,
      r.city,
      r.ai_segment || "",
      `"${(r.motivation_text || "").replace(/"/g, '""')}"`,
      `"${(r.guest_question || "").replace(/"/g, '""')}"`,
      r.ab_variant || "",
      JSON.stringify(r.ai_tags || {}),
      r.commitment_confirmed ? "Yes" : "No",
      r.created_at,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-doac-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <p className="text-doac-gray text-xs tracking-[0.3em] mb-2">BEHIND THE DIARY</p>
          <h1 className="font-serif text-3xl text-white mb-2">Admin Dashboard</h1>
          <p className="text-doac-gray">{totalCount} registered</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={fetchData}
            className="text-doac-gray text-sm border border-white/20 px-4 py-2 hover:border-white/50 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="text-white text-sm bg-doac-red px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={totalCount} />
        <StatCard label="Committed" value={registrations.filter((r) => r.commitment_confirmed).length} />
        <StatCard label="Questions" value={registrations.filter((r) => r.guest_question).length} />
        <StatCard label="With Motivation" value={registrations.filter((r) => r.motivation_text).length} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-white/10">
        {(["registrations", "ab-test"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-doac-red"
                : "text-doac-gray hover:text-white"
            }`}
          >
            {tab === "ab-test" ? "A/B Test" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "registrations" && (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name, email, city, or segment..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-underline max-w-md"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-doac-gray text-left">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">City</th>
                  <th className="py-3 pr-4">Segment</th>
                  <th className="py-3 pr-4">Motivation</th>
                  <th className="py-3 pr-4">Question</th>
                  <th className="py-3 pr-4">A/B</th>
                  <th className="py-3 pr-4">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-white">{r.display_name || r.first_name}</td>
                    <td className="py-3 pr-4 text-doac-gray">{r.email}</td>
                    <td className="py-3 pr-4 text-doac-gray">{r.city}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs border border-white/20 px-2 py-1">
                        {r.ai_segment || "\u2014"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-doac-gray max-w-[180px] truncate">
                      {r.motivation_text || "\u2014"}
                    </td>
                    <td className="py-3 pr-4 text-doac-gray max-w-[180px] truncate">
                      {r.guest_question || "\u2014"}
                    </td>
                    <td className="py-3 pr-4 text-doac-gray text-xs">{r.ab_variant || "\u2014"}</td>
                    <td className="py-3 pr-4 text-doac-gray text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-doac-gray text-center py-10">
                {filter ? "No matching registrations." : "No registrations yet."}
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === "ab-test" && (
        <div>
          <h2 className="font-serif text-xl text-white mb-6">A/B Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-white/10 p-6">
              <h3 className="text-white font-medium mb-1">Variant A — Segment-contextual</h3>
              <p className="text-doac-gray/50 text-xs mb-6">
                Question framed around their detected segment
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Responses</span>
                  <span className="text-white">{variantA.filter((r) => r.guest_question).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Skip rate</span>
                  <span className="text-white">
                    {variantA.length > 0
                      ? Math.round(
                          (variantA.filter((r) => !r.guest_question).length / variantA.length) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Avg word count</span>
                  <span className="text-white">{avgWordCount(variantA)}</span>
                </div>
              </div>
            </div>

            <div className="border border-white/10 p-6">
              <h3 className="text-white font-medium mb-1">Variant B — Open question</h3>
              <p className="text-doac-gray/50 text-xs mb-6">
                &ldquo;If you could ask Steven anything...&rdquo;
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Responses</span>
                  <span className="text-white">{variantB.filter((r) => r.guest_question).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Skip rate</span>
                  <span className="text-white">
                    {variantB.length > 0
                      ? Math.round(
                          (variantB.filter((r) => !r.guest_question).length / variantB.length) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-doac-gray text-sm">Avg word count</span>
                  <span className="text-white">{avgWordCount(variantB)}</span>
                </div>
              </div>
            </div>
          </div>
          {variantA.length === 0 && variantB.length === 0 && (
            <p className="text-doac-gray text-center py-10 mt-6">
              No A/B test data yet. Results appear as registrations come in.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 p-5">
      <p className="text-doac-gray text-xs tracking-widest mb-2">{label}</p>
      <p className="font-serif text-3xl text-white">{value}</p>
    </div>
  );
}
