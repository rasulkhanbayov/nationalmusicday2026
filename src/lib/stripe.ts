import Stripe from "stripe";
import { SITE } from "./constants";

// Lazily instantiate the Stripe client so importing this module (e.g. during
// Next.js build-time page-data collection) doesn't throw when the secret key
// isn't present. The client is created on first use at request time.
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Configure it in your environment to use Stripe.",
    );
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    appInfo: { name: SITE.name },
    typescript: true,
  });
  return _stripe;
}

// Proxy so existing `stripe.checkout.sessions.create(...)` call sites keep
// working while deferring construction until the first property access.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
