"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Flame } from "@/components/ui/Flame";

const EXAMPLE_RESULT = {
  url: "stripe.com",
  score: 8,
  headline_feedback:
    "Strong and direct. 'Financial infrastructure for the internet' is clear and memorable, though it might be too abstract for first-time visitors.",
  value_prop_feedback:
    "Value prop is solid but relies on brand recognition. New visitors may not immediately understand what Stripe actually does.",
  ux_issues: [
    "Pricing page requires too many clicks to find",
    "Developer docs feel hidden from non-technical buyers",
  ],
  trust_issues: [
    "Social proof logos are small and easy to miss",
    "No visible customer count or revenue processed on homepage",
  ],
  cta_feedback:
    "'Start now' is decent but generic. Adding specificity ('Start for free — no credit card') would improve click-through.",
  improvements: [
    "Add a concrete stat ('$1T+ processed annually') above the fold",
    "Show a live product demo or interactive preview",
    "Make pricing more discoverable in the top nav",
  ],
  rewritten_headline:
    "The payments layer every internet business runs on — start accepting money in minutes.",
};

function ExampleResult() {
  return (
    <div className="mt-20 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-sm text-gray-500 font-medium">
          Example roast for
        </span>
        <span className="text-sm font-semibold text-black">stripe.com</span>
        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          Preview
        </span>
      </div>
      <div className="p-6 md:p-8 grid gap-6 md:grid-cols-2">
        <div className="flex items-start gap-4">
          <ScoreRing score={EXAMPLE_RESULT.score} size="sm" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Conversion Score
            </p>
            <p className="text-2xl font-black">
              {EXAMPLE_RESULT.score}
              <span className="text-gray-400 text-lg font-normal">/10</span>
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
            Rewritten Headline
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm font-semibold text-orange-900 leading-snug">
            "{EXAMPLE_RESULT.rewritten_headline}"
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
            Top Improvements
          </p>
          <ul className="space-y-1.5">
            {EXAMPLE_RESULT.improvements.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-orange-500 font-bold shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
            CTA Feedback
          </p>
          <p className="text-sm text-gray-700">{EXAMPLE_RESULT.cta_feedback}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let normalized = url.trim();
    if (!normalized) {
      setError("Please enter a URL.");
      return;
    }
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }

    try {
      new URL(normalized);
    } catch {
      setError("That doesn't look like a valid URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/results?id=${data.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 font-black text-lg tracking-tight">
          <Flame className="w-5 h-5 text-orange-500" />
          Website Roaster
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Powered by Claude AI
        </span>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 animate-fade-in">
          <Flame className="w-3.5 h-3.5" />
          Free AI-powered conversion critique
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-balance mb-5 animate-slide-up">
          Get a brutally honest{" "}
          <span className="text-orange-500">conversion roast</span> of your
          website in seconds
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-10 animate-slide-up">
          Paste your URL. Get clarity, fixes, and higher conversions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl animate-slide-up"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              disabled={loading}
              className="flex-1 px-5 py-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
            >
              {loading ? "Roasting…" : "Roast My Website 🔥"}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500 text-left">{error}</p>
          )}
        </form>

        <button
          onClick={() => setUrl("https://stripe.com")}
          disabled={loading}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2 disabled:opacity-40"
        >
          Try with stripe.com →
        </button>

        {loading && (
          <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">
              Roasting your website… this might hurt 🔥
            </p>
          </div>
        )}
      </section>

      {/* Example preview */}
      {!loading && (
        <section className="max-w-3xl mx-auto w-full px-6 pb-20">
          <p className="text-center text-sm text-gray-400 mb-4 font-medium uppercase tracking-wider">
            Sample output
          </p>
          <ExampleResult />
        </section>
      )}

      <footer className="text-center py-6 text-xs text-gray-300 border-t border-gray-100">
        Built with Claude AI · No data stored · Free to use
      </footer>
    </main>
  );
}
