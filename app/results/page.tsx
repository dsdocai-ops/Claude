"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Flame } from "@/components/ui/Flame";
import { Paywall } from "@/components/Paywall";
import type { PublicRoastResult, RoastResult } from "@/lib/types";
import { isFullResult } from "@/lib/types";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-gray-700 text-sm leading-relaxed">
          <span className="text-orange-500 font-black shrink-0 mt-0.5">→</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-slide-up">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
        {emoji} {title}
      </h2>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-semibold text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function LockedSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

function ResultsContent() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const paidParam = params.get("paid") === "true";

  const [partial, setPartial] = useState<PublicRoastResult | null>(null);
  const [full, setFull] = useState<RoastResult | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPaid, setIsPaid] = useState(paidParam);
  const [fetchingFull, setFetchingFull] = useState(false);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial (partial) result
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const cached = sessionStorage.getItem(`roast:${id}`);
    if (cached) {
      try {
        const data = JSON.parse(cached) as {
          siteUrl: string;
          result: PublicRoastResult | RoastResult;
          paid?: boolean;
        };
        setSiteUrl(data.siteUrl ?? "");
        if (isFullResult(data.result)) {
          setFull(data.result);
          setPartial({ score: data.result.score, headline_feedback: data.result.headline_feedback });
          setIsPaid(true);
        } else {
          setPartial(data.result);
          if (data.paid) setIsPaid(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    fetch(`/api/result?id=${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setSiteUrl(data.siteUrl ?? "");
          setPartial(data.result);
          if (data.paid && isFullResult(data.result)) {
            setFull(data.result);
            setIsPaid(true);
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // When paid, poll /api/result until the webhook has marked the record paid and we get the full result
  useEffect(() => {
    if (!isPaid || !id || full) return;

    setFetchingFull(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 8;

    function tryFetch() {
      fetch(`/api/result?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.paid && isFullResult(data.result)) {
            setFull(data.result);
            setSiteUrl((prev) => data.siteUrl ?? prev);
            setFetchingFull(false);
            // Cache the full result so future visits skip the poll
            sessionStorage.setItem(
              `roast:${id}`,
              JSON.stringify({ siteUrl: data.siteUrl, result: data.result, paid: true })
            );
          } else if (attempts < MAX_ATTEMPTS) {
            attempts++;
            pollRef.current = setTimeout(tryFetch, 1500);
          } else {
            setFetchingFull(false);
          }
        })
        .catch(() => {
          if (attempts < MAX_ATTEMPTS) {
            attempts++;
            pollRef.current = setTimeout(tryFetch, 1500);
          } else {
            setFetchingFull(false);
          }
        });
    }

    tryFetch();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [isPaid, id, full]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !partial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-2xl font-bold">Roast not found</p>
        <p className="text-gray-500">This roast has expired or the link is invalid.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-all"
        >
          Start a new roast
        </button>
      </div>
    );
  }

  const scoreColor =
    partial.score >= 7
      ? "text-green-600"
      : partial.score >= 5
      ? "text-yellow-600"
      : "text-red-500";

  const displayUrl = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 font-black text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            Website Roaster
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-semibold text-gray-500 hover:text-black transition-colors"
          >
            Roast another →
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        {/* Score hero — always free */}
        <div className="bg-black text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
          <ScoreRing score={partial.score} size="lg" dark />
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">
              Roast complete for
            </p>
            <p className="text-white font-black text-xl mb-1 break-all">
              {displayUrl || "your website"}
            </p>
            <p className={`text-5xl font-black ${scoreColor}`}>
              {partial.score}
              <span className="text-2xl text-gray-500 font-normal">/10</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">Conversion Score</p>
          </div>
        </div>

        {/* Headline Feedback — free preview */}
        <Section title="Headline Feedback" emoji="📣">
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            {partial.headline_feedback}
          </p>
        </Section>

        {/* Divider */}
        {!isPaid && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Free preview ends here
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}

        {/* Locked / full content */}
        <div className="relative">
          {isPaid && fetchingFull ? (
            // Payment confirmed, waiting for webhook to propagate
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Unlocking your full roast…</p>
            </div>
          ) : isPaid && full ? (
            // Full result available
            <div className="space-y-5">
              <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-orange-700">
                    ✏️ Rewritten Headline
                  </h2>
                  <CopyButton text={full.rewritten_headline} />
                </div>
                <p className="text-orange-900 font-bold text-lg leading-snug">
                  "{full.rewritten_headline}"
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Section title="Value Proposition" emoji="💎">
                  <p className="text-gray-700 text-sm leading-relaxed mt-2">
                    {full.value_prop_feedback}
                  </p>
                </Section>
                <Section title="Call-to-Action" emoji="🎯">
                  <p className="text-gray-700 text-sm leading-relaxed mt-2">
                    {full.cta_feedback}
                  </p>
                </Section>
              </div>

              <Section title="UX Friction Points" emoji="⚡">
                <BulletList items={full.ux_issues} />
              </Section>

              <Section title="Trust Issues" emoji="🔒">
                <BulletList items={full.trust_issues} />
              </Section>

              <Section title="Top Improvements" emoji="🚀">
                <ol className="space-y-3 mt-3">
                  {full.improvements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </Section>
            </div>
          ) : (
            // Unpaid — show blurred skeletons + paywall overlay
            <>
              <div
                className="space-y-5"
                style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}
                aria-hidden="true"
              >
                <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-3">
                    ✏️ Rewritten Headline
                  </h2>
                  <LockedSkeleton />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Section title="Value Proposition" emoji="💎">
                    <div className="mt-2"><LockedSkeleton /></div>
                  </Section>
                  <Section title="Call-to-Action" emoji="🎯">
                    <div className="mt-2"><LockedSkeleton /></div>
                  </Section>
                </div>

                <Section title="UX Friction Points" emoji="⚡">
                  <div className="mt-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${75 - i * 8}%` }} />
                    ))}
                  </div>
                </Section>

                <Section title="Trust Issues" emoji="🔒">
                  <div className="mt-3 space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${70 - i * 5}%` }} />
                    ))}
                  </div>
                </Section>

                <Section title="Top Improvements" emoji="🚀">
                  <div className="mt-3 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${80 - i * 5}%` }} />
                    ))}
                  </div>
                </Section>
              </div>

              {id && (
                <div className="absolute inset-0 flex items-start justify-center pt-12">
                  <Paywall
                    id={id}
                    onUnlock={(data) => {
                      setIsPaid(true);
                      if (data) {
                        setFull(data.result);
                        setSiteUrl(data.siteUrl);
                        sessionStorage.setItem(
                          `roast:${id}`,
                          JSON.stringify({ siteUrl: data.siteUrl, result: data.result, paid: true })
                        );
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-center pt-4 pb-10">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 active:scale-95 transition-all shadow-sm"
          >
            Roast Another Website 🔥
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
