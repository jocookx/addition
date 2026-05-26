import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(1).optional(),
);

const RawEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalEnvString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalEnvString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: optionalEnvString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalEnvString,
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString,
});

export type AppEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = RawEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration. ${message}`);
  }

  const publicKey =
    parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!publicKey) {
    throw new Error(
      "Invalid environment configuration. Set NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  cachedEnv = {
    NEXT_PUBLIC_SUPABASE_URL: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: publicKey,
    SUPABASE_SERVICE_ROLE_KEY: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
  return cachedEnv;
}
