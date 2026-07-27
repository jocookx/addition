This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Stripe billing setup

Addition uses Stripe Billing with Checkout Sessions for paid subscriptions and the Customer Portal for subscription management.

Plans:

- Addition Free: no Stripe checkout; users stay on the default `free` plan.
- Addition Pro: `GBP 20/month` or `GBP 192/year`.
- Addition Student: `GBP 10/month` or `GBP 96/year`; checkout is gated by approved student verification.

Create or update the Stripe products and recurring prices:

```bash
STRIPE_SECRET_KEY=sk_live_or_test_... npm run stripe:setup
```

The setup script is idempotent. It creates these lookup keys:

- `addition_pro_monthly`
- `addition_pro_yearly`
- `addition_student_monthly`
- `addition_student_yearly`

The app can resolve active prices by lookup key. You may also set explicit Price ID overrides in the deployment environment:

```bash
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_STUDENT_PRICE_ID=price_...
STRIPE_STUDENT_YEARLY_PRICE_ID=price_...
```

Required runtime Stripe variables:

```bash
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_EXPECTED_ACCOUNT_ID=acct_1ToWqPRo8AjbgbCl
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_FROM="Addition Academy <workshops@addition.academy>"
```

`STRIPE_EXPECTED_ACCOUNT_ID` guards setup against accidentally creating Addition products in the wrong Stripe account. The expected account is the INFLUX account.

Configure the webhook endpoint to send events to `/api/v1/webhooks/stripe`. At minimum, subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Video hardening

Cloudflare Stream uploads created by the CMS require signed URLs. To lock existing Stream videos before launch, run:

```bash
CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_STREAM_API_TOKEN=... npm run cloudflare:lock-videos
```

This makes Stream videos private; the app then serves short-lived playback tokens from `/api/v1/learning/video-token` after checking the user's lesson access.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
