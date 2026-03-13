type EventProperties = Record<string, unknown>;

interface AnalyticsClient {
  track: (event: string, properties?: EventProperties) => void;
  page: (name?: string, properties?: EventProperties) => void;
}

let analyticsClient: AnalyticsClient | null = null;

export function initAnalytics() {
  if (typeof window === "undefined") return;

  const writeKey = process.env.NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY;
  const dataPlaneUrl = process.env.NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL;

  if (writeKey && dataPlaneUrl) {
    // Load RudderStack via script tag (avoids webpack bundling issues)
    const script = document.createElement("script");
    script.src = "https://cdn.rudderlabs.com/v1.1/rudder-analytics.min.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rudder = (window as any).rudderanalytics as AnalyticsClient & { load: (key: string, url: string, opts: Record<string, unknown>) => void } | undefined;
      if (rudder) {
        rudder.load(writeKey, dataPlaneUrl, { logLevel: "ERROR" });
        analyticsClient = rudder;
      }
    };
    document.head.appendChild(script);
  } else {
    // Fallback: log events in development
    analyticsClient = {
      track: (event: string, properties?: EventProperties) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Analytics]", event, properties);
        }
      },
      page: (name?: string, properties?: EventProperties) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Analytics Page]", name, properties);
        }
      },
    };
  }
}

export function trackEvent(event: string, properties?: EventProperties) {
  analyticsClient?.track(event, {
    ...properties,
    timestamp: new Date().toISOString(),
    device_type: getDeviceType(),
  });
}

export function trackPage(name?: string, properties?: EventProperties) {
  analyticsClient?.page(name, properties);
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"];
  const result: Record<string, string> = {};
  utmKeys.forEach((key) => {
    const value = params.get(key);
    if (value) result[key] = value;
  });
  return result;
}
