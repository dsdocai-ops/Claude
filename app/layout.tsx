import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Roaster — AI Conversion Critique",
  description:
    "Get a brutally honest conversion roast of your website in seconds. Paste your URL, get clarity, fixes, and higher conversions.",
  openGraph: {
    title: "Website Roaster — AI Conversion Critique",
    description:
      "Paste your URL. Get a brutally honest AI critique of your website's conversion potential.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  );
}
