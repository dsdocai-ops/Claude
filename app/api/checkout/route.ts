import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { id } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing result id." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Website Roast — Full Report",
            description: "Full UX breakdown, conversion fixes, and rewritten headline.",
          },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    client_reference_id: id,                          // stored on Stripe payment for records
    success_url: `${BASE_URL}/results?paid=true&id=${id}`,
    cancel_url: `${BASE_URL}/results?id=${id}`,
  });

  return NextResponse.json({ url: session.url });
}
