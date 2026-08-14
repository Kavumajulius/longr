export function publicAppUrl(requestOrigin?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (requestOrigin) {
    return requestOrigin.replace(/^http:/, "https:");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/^http:/, "https:");
  }
  return "https://localhost:3000";
}
