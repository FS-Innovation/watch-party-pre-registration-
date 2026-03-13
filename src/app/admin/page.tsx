"use client";

import { useState, useEffect, useCallback } from "react";

interface Registration {
  id: string;
  first_name: string;
  email: string;
  city: string;
  segment_choice: string;
  guest_question: string;
  ai_tags: Record<string, unknown> | null;
  ticket_number: string;
  commitment_confirmed: boolean;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("");

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setTotalCount(data.total || 0);
    } catch {
      console.error("Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filtered = registrations.filter((r) => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    return (
      r.first_name.toLowerCase().includes(search) ||
      r.email.toLowerCase().includes(search) ||
      r.city.toLowerCase().includes(search) ||
      r.segment_choice.toLowerCase().includes(search)
    );
  });

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "City",
      "Segment",
      "Question",
      "AI Tags",
      "Ticket #",
      "Committed",
      "Referral Code",
      "Referred By",
      "Registered At",
    ];
    const rows = registrations.map((r) => [
      r.first_name,
      r.email,
      r.city,
      r.segment_choice,
      `"${(r.guest_question || "").replace(/"/g, '""')}"`,
      JSON.stringify(r.ai_tags || {}),
      r.ticket_number,
      r.commitment_confirmed ? "Yes" : "No",
      r.referral_code,
      r.referred_by || "",
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl text-white mb-2">
            Registrations
          </h1>
          <p className="text-doac-gray">
            {totalCount} registered &middot;{" "}
            {registrations.filter((r) => r.commitment_confirmed).length}{" "}
            committed
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={fetchRegistrations}
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

      {/* Live counter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total" value={totalCount} />
        <StatCard
          label="Committed"
          value={registrations.filter((r) => r.commitment_confirmed).length}
        />
        <StatCard
          label="Questions"
          value={registrations.filter((r) => r.guest_question).length}
        />
        <StatCard
          label="Referrals"
          value={registrations.filter((r) => r.referred_by).length}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, city, or segment..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-underline max-w-md"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-doac-gray text-left">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">City</th>
              <th className="py-3 pr-4">Segment</th>
              <th className="py-3 pr-4">Question</th>
              <th className="py-3 pr-4">AI Tags</th>
              <th className="py-3 pr-4">Ticket</th>
              <th className="py-3 pr-4">Committed</th>
              <th className="py-3 pr-4">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 pr-4 text-white">{r.first_name}</td>
                <td className="py-3 pr-4 text-doac-gray">{r.email}</td>
                <td className="py-3 pr-4 text-doac-gray">{r.city}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs border border-white/20 px-2 py-1">
                    {r.segment_choice || "—"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-doac-gray max-w-[200px] truncate">
                  {r.guest_question || "—"}
                </td>
                <td className="py-3 pr-4 text-doac-gray text-xs">
                  {r.ai_tags
                    ? (r.ai_tags as { topic_tags?: string[] }).topic_tags?.join(", ") || "—"
                    : "—"}
                </td>
                <td className="py-3 pr-4 text-white font-mono">
                  #{r.ticket_number}
                </td>
                <td className="py-3 pr-4">
                  {r.commitment_confirmed ? (
                    <span className="text-green-500">Yes</span>
                  ) : (
                    <span className="text-doac-gray">No</span>
                  )}
                </td>
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
