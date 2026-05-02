"use client";

import { useState } from "react";

export function Paywall({ id, onUnlock }: { id: string; onUnlock?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

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

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, id }),
      });
      const data = await res.json();
      if (data.valid) {
        onUnlock?.();
      } else {
        setCodeError("Invalid code.");
      }
    } catch {
      setCodeError("Could not validate code. Please try again.");
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

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Have a code?</p>
          <form onSubmit={handleCode} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
              placeholder="Enter code"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Apply
            </button>
          </form>
          {codeError && (
            <p className="text-xs text-red-500 mt-1.5 text-left">{codeError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
