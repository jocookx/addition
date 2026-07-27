import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for Addition iOS & Android apps.
 *
 * PRODUCTION STRATEGY — Remote Shell:
 *   The native app is a thin WebView wrapper that loads the live
 *   Vercel deployment.  This keeps every server-side feature (Supabase
 *   auth, API routes, Stripe webhooks) working without any static-export
 *   constraints.  Apple classifies this as a "Remote App" and Stripe/
 *   Supabase process payments outside the binary, so no IAP 30% cut.
 *
 * Reader App Entitlement:
 *   Apply at https://developer.apple.com/contact/request/reader-app/
 *   after you have a live App Store build.  This lets you sell
 *   subscriptions via the Stripe web checkout entirely within the app.
 *
 * ENVIRONMENT SWITCHING:
 *   Build for development → CAPACITOR_ENV=dev  npx cap sync
 *   Build for production  → npx cap sync          (default)
 *
 * FIRST-TIME SETUP:
 *   1. npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
 *      npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
 *      npm install @capacitor/push-notifications @capacitor/browser
 *   2. npx cap add ios
 *   3. npx cap add android
 *   4. npx cap sync
 *   5. npx cap open ios    → Xcode
 *   6. npx cap open android → Android Studio
 */

const isDev = process.env.CAPACITOR_ENV === "dev";

const config: CapacitorConfig = {
  // ── Identity ─────────────────────────────────────────────────────────────
  appId: "com.additionacademy.app",
  appName: "Addition",

  // ── Web dir ───────────────────────────────────────────────────────────────
  // Used as fallback assets; the server.url below takes precedence at runtime.
  webDir: "out",

  // ── Remote server ─────────────────────────────────────────────────────────
  server: {
    url: isDev ? "http://localhost:3000" : "https://addition.academy",
    cleartext: isDev, // allow HTTP in dev, HTTPS-only in prod
    // Allow navigation to auth callback and external payment pages
    allowNavigation: [
      "addition.academy",
      "*.addition.academy",
      "checkout.stripe.com",
      "buy.stripe.com",
      "*.supabase.co",
    ],
  },

  // ── iOS ───────────────────────────────────────────────────────────────────
  ios: {
    // Allows the status bar area to be part of the web view (we draw our own
    // top-bar with safe-area-inset padding in CSS)
    contentInset: "always",
    // Needed for deep-linking (add universal links in Xcode too)
    scheme: "addition",
    // Prevents WKWebView from caching aggressively during dev
    limitsNavigationsToAppBoundDomains: false,
    // Scroll style — native feel with momentum
    scrollEnabled: true,
  },

  // ── Android ───────────────────────────────────────────────────────────────
  android: {
    // Allow mixed content in dev only
    allowMixedContent: isDev,
    // Capture volume keys (optional, for media playback)
    captureInput: false,
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      // Black splash matching the app's --void background
      backgroundColor: "#000000",
      // Show splash until web content is ready
      launchAutoHide: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#7c3aed",
    },

    StatusBar: {
      // Overlay status bar; we add safe-area-inset padding in CSS
      overlaysWebView: true,
      // Light content (white icons) for our dark background
      style: "DARK",
      backgroundColor: "#00000000",
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // App URL handler (deep links like addition://courses/123)
    App: {
      launchUrl: "addition://",
    },
  },
};

export default config;
