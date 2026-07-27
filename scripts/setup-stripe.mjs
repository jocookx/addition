import Stripe from "stripe";
import { existsSync, readFileSync } from "node:fs";

loadEnvFiles([".env", ".env.local"]);

const DEFAULTS = {
  currency: process.env.STRIPE_BILLING_CURRENCY || "gbp",
  proMonthly: readAmount("STRIPE_SETUP_PRO_MONTHLY_AMOUNT", 2000),
  proYearly: readAmount("STRIPE_SETUP_PRO_YEARLY_AMOUNT", 19200),
  studentMonthly: readAmount("STRIPE_SETUP_STUDENT_MONTHLY_AMOUNT", 1000),
  studentYearly: readAmount("STRIPE_SETUP_STUDENT_YEARLY_AMOUNT", 9600),
};

const PRODUCTS = [
  {
    key: "free",
    name: "Addition Free",
    description: "Free Addition access.",
    metadata: {
      app: "addition",
      plan: "free",
      tier: "free",
    },
  },
  {
    key: "pro",
    name: "Addition Pro",
    description: "Full Addition course, shortcut, learning path, practice, and replay access.",
    metadata: {
      app: "addition",
      plan: "pro",
      tier: "paid",
    },
  },
  {
    key: "student",
    name: "Addition Student",
    description: "Verified student access to Addition Pro at a discounted rate.",
    metadata: {
      app: "addition",
      plan: "student",
      tier: "paid",
    },
  },
];

const PRICES = [
  {
    productKey: "pro",
    lookupKey: "addition_pro_monthly",
    envName: "STRIPE_PRO_PRICE_ID",
    amount: DEFAULTS.proMonthly,
    interval: "month",
  },
  {
    productKey: "pro",
    lookupKey: "addition_pro_yearly",
    envName: "STRIPE_PRO_YEARLY_PRICE_ID",
    amount: DEFAULTS.proYearly,
    interval: "year",
  },
  {
    productKey: "student",
    lookupKey: "addition_student_monthly",
    envName: "STRIPE_STUDENT_PRICE_ID",
    amount: DEFAULTS.studentMonthly,
    interval: "month",
  },
  {
    productKey: "student",
    lookupKey: "addition_student_yearly",
    envName: "STRIPE_STUDENT_YEARLY_PRICE_ID",
    amount: DEFAULTS.studentYearly,
    interval: "year",
  },
];

function readAmount(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer in the smallest currency unit.`);
  }
  return value;
}

function loadEnvFiles(files) {
  for (const file of files) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index <= 0) continue;
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

async function findProduct(stripe, productConfig) {
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.metadata?.app === "addition" && product.metadata?.plan === productConfig.key) {
      return product;
    }
  }
  return null;
}

async function upsertProduct(stripe, productConfig) {
  const existing = await findProduct(stripe, productConfig);
  const params = {
    name: productConfig.name,
    description: productConfig.description,
    active: true,
    metadata: productConfig.metadata,
  };

  if (existing) {
    return stripe.products.update(existing.id, params);
  }

  return stripe.products.create(params, {
    idempotencyKey: `addition-product-${productConfig.key}`,
  });
}

function isMatchingPrice(price, priceConfig) {
  return (
    price.active === true &&
    price.currency === DEFAULTS.currency &&
    price.unit_amount === priceConfig.amount &&
    price.recurring?.interval === priceConfig.interval
  );
}

async function findPriceByLookupKey(stripe, lookupKey) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  return prices.data[0] || null;
}

async function upsertPrice(stripe, product, priceConfig) {
  const existing = await findPriceByLookupKey(stripe, priceConfig.lookupKey);
  if (existing && isMatchingPrice(existing, priceConfig)) {
    return existing;
  }

  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: DEFAULTS.currency,
      unit_amount: priceConfig.amount,
      recurring: { interval: priceConfig.interval },
      lookup_key: priceConfig.lookupKey,
      transfer_lookup_key: true,
      metadata: {
        app: "addition",
        plan: priceConfig.productKey,
        interval: priceConfig.interval === "year" ? "yearly" : "monthly",
      },
    },
    {
      idempotencyKey: `addition-price-${priceConfig.lookupKey}-${DEFAULTS.currency}-${priceConfig.amount}`,
    },
  );

  if (existing?.id && existing.active) {
    await stripe.prices.update(existing.id, { active: false });
  }

  return price;
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
  const account = await stripe.accounts.retrieve();
  const expectedAccountId = process.env.STRIPE_EXPECTED_ACCOUNT_ID;
  if (!expectedAccountId) {
    throw new Error(
      "STRIPE_EXPECTED_ACCOUNT_ID is required so products are never created in the wrong Stripe account. " +
      `The provided key belongs to ${account.id}.`,
    );
  }
  if (account.id !== expectedAccountId) {
    throw new Error(`Stripe key belongs to ${account.id}, expected ${expectedAccountId}.`);
  }
  console.log(`Stripe account: ${account.id}${account.business_profile?.name ? ` (${account.business_profile.name})` : ""}`);

  const products = new Map();
  for (const productConfig of PRODUCTS) {
    const product = await upsertProduct(stripe, productConfig);
    products.set(productConfig.key, product);
    console.log(`${productConfig.name}: ${product.id}`);
  }

  const envLines = [];
  for (const priceConfig of PRICES) {
    const product = products.get(priceConfig.productKey);
    const price = await upsertPrice(stripe, product, priceConfig);
    await stripe.products.update(product.id, { default_price: price.id });
    envLines.push(`${priceConfig.envName}=${price.id}`);
    console.log(`${priceConfig.lookupKey}: ${price.id} (${DEFAULTS.currency} ${priceConfig.amount})`);
  }

  console.log("");
  console.log("Add these optional Price ID overrides to your deployment environment:");
  for (const line of envLines) console.log(line);
  console.log("");
  console.log("The app can also resolve prices by lookup key if these override env vars are omitted.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
