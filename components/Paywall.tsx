"use client";

import { useState } from "react";

export function Paywall({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function goToCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-md w-full">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-2xl font-black tracking-tight mb-2">
          Unlock Full Roast
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Get the complete breakdown — fixes, friction points, and a rewritten
          headline that actually converts.
        </p>

        <ul className="text-left space-y-2.5 mb-7">
          {[
            "✅ Rewritten headline you can use today",
            "✅ Full value proposition critique",
            "✅ UX friction points breakdown",
            "✅ Trust signal analysis",
            "✅ CTA feedback + copy fixes",
            "✅ Top 3 prioritised improvements",
          ].map((item) => (
            <li key={item} className="text-sm text-gray-700 font-medium">
              {item}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <button
          onClick={goToCheckout}
          disabled={loading}
          className="w-full py-4 bg-black text-white font-black text-lg rounded-xl hover:bg-gray-900 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting to Stripe…" : "Unlock for $5 🔥"}
        </button>
      </div>
    </div>
  );
}
