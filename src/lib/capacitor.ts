/**
 * capacitor.ts
 *
 * Thin utility layer for Capacitor native APIs.
 * All imports are dynamic so the web bundle stays unchanged — Capacitor
 * plugins are tree-shaken and only bundled when building via `npx cap sync`.
 *
 * Use `isNative()` to gate any behaviour that must only run inside the
 * iOS / Android shell (e.g. SplashScreen.hide, StatusBar styling, push
 * notification registration).
 */

/** Returns true when running inside a Capacitor native WebView. */
export function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    // @ts-expect-error — Capacitor attaches this global at runtime
    typeof window.Capacitor !== "undefined" &&
    // @ts-expect-error
    window.Capacitor.isNative === true
  );
}

/** Returns the current Capacitor platform: 'web' | 'ios' | 'android' */
export function getPlatform(): "web" | "ios" | "android" {
  if (typeof window === "undefined") return "web";
  // @ts-expect-error
  return window.Capacitor?.getPlatform?.() ?? "web";
}

/**
 * Hides the native splash screen.
 * Safe to call on web — no-ops gracefully.
 */
export async function hideSplash(fadeOutDuration = 300): Promise<void> {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration });
  } catch {
    // Plugin not installed — ignore
  }
}

/**
 * Sets the native status bar style.
 * Style: 'DARK' (light icons on dark bg) | 'LIGHT' (dark icons on light bg)
 */
export async function setStatusBarStyle(
  style: "Dark" | "Light" = "Dark",
): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style[style] });
    await StatusBar.setBackgroundColor({ color: "#00000000" });
  } catch {
    // Ignore
  }
}

/**
 * Opens a URL in the native in-app browser (SFSafariViewController on iOS,
 * Chrome Custom Tab on Android).  Falls back to window.open on web.
 */
export async function openInAppBrowser(url: string): Promise<void> {
  if (!isNative()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({
      url,
      presentationStyle: "popover",
      toolbarColor: "#000000",
    });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Registers for push notifications and returns the device token.
 * Returns null if the user denies permission or the plugin is unavailable.
 */
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import(
      "@capacitor/push-notifications"
    );
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== "granted") return null;

    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener("registration", (token) => {
        resolve(token.value);
      });
      PushNotifications.addListener("registrationError", () => {
        resolve(null);
      });
      // Timeout after 10s
      setTimeout(() => resolve(null), 10_000);
    });
  } catch {
    return null;
  }
}

/**
 * Hook: add a listener for the native back button (Android).
 * Pass a handler that returns true to prevent default (app exit) behaviour.
 */
export async function addBackButtonListener(
  handler: () => boolean,
): Promise<() => void> {
  if (getPlatform() !== "android") return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const listener = await App.addListener("backButton", ({ canGoBack }) => {
      const handled = handler();
      if (!handled && !canGoBack) {
        App.exitApp();
      }
    });
    return () => listener.remove();
  } catch {
    return () => {};
  }
}
