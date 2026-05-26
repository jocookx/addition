"use client";

/**
 * MobileShell
 *
 * A client component rendered in the root layout that handles Capacitor
 * native lifecycle events when the app is running inside iOS or Android.
 * On web, this component renders nothing and has zero overhead.
 *
 * Responsibilities:
 *  1. Hide the splash screen once the web content is interactive.
 *  2. Set the native status bar style to match our dark theme.
 *  3. Register for push notifications (after the user is signed in).
 *  4. Handle the Android back button to navigate history rather than exit.
 *
 * Usage: add <MobileShell /> once inside the root <body> tag in layout.tsx
 */

import { useEffect } from "react";
import {
  isNative,
  hideSplash,
  setStatusBarStyle,
  addBackButtonListener,
} from "@/lib/capacitor";

export function MobileShell() {
  useEffect(() => {
    if (!isNative()) return;

    // 1. Hide splash after a brief tick so the page has painted
    const timer = setTimeout(() => {
      void hideSplash(200);
    }, 250);

    // 2. Set dark status bar style (white icons on black background)
    void setStatusBarStyle("Dark");

    // 3. Android back button — navigate back in history instead of exiting
    let removeBackButton: () => void = () => {};
    void addBackButtonListener(() => {
      if (window.history.length > 1) {
        window.history.back();
        return true; // handled — don't exit
      }
      return false; // let the OS handle (exit)
    }).then((remove) => {
      removeBackButton = remove;
    });

    return () => {
      clearTimeout(timer);
      removeBackButton();
    };
  }, []);

  // No visible output — purely a lifecycle hook
  return null;
}
