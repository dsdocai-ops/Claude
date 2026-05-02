"use client";

const PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "#";

export function Paywall({ currentUrl }: { currentUrl: string }) {
  function goToCheckout() {
    // Append success_url param so Stripe redirects back with ?paid=true
    // (only works if your Stripe Payment Link is configured to use a dynamic redirect)
    window.location.href = PAYMENT_LINK;
  }

  function alreadyPaid() {
    // Manually unlock — trusted on honour, acceptable for MVP
    const url = new URL(currentUrl);
    url.searchParams.set("paid", "true");
    window.location.href = url.toString();
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

        <button
          onClick={goToCheckout}
          className="w-full py-4 bg-black text-white font-black text-lg rounded-xl hover:bg-gray-900 active:scale-95 transition-all shadow-sm mb-3"
        >
          Unlock for $5 🔥
        </button>

        <button
          onClick={alreadyPaid}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Already paid? Click here to unlock
        </button>
      </div>
    </div>
  );
}
