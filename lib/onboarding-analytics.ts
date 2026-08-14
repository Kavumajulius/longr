"use client";

import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

export function trackOnboardingEvent(
  name: string,
  details: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const payload = {
    ...details,
    device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    acquisition_source:
      new URLSearchParams(window.location.search).get("utm_source") ?? "direct",
    recorded_at: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent("longr:onboarding-event", { detail: { name, ...payload } }),
  );

  try {
    const stored = JSON.parse(
      window.localStorage.getItem("longrOnboardingEvents") ?? "[]",
    ) as unknown[];
    window.localStorage.setItem(
      "longrOnboardingEvents",
      JSON.stringify([...stored.slice(-99), { name, ...payload }]),
    );
  } catch {
    // Analytics persistence must never block onboarding.
  }

  if (analytics) {
    logEvent(analytics, name, payload);
  }
}
