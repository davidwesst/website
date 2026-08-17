const identifierTags = ["ai.user.id", "ai.user.authUserId", "ai.user.accountId", "ai.session.id"];
const pageViewTypes = new Set(["PageviewData", "PageviewPerformanceData"]);

function tagContainers(tags) {
  if (!tags) return [];
  return Array.isArray(tags) ? tags.filter((tag) => tag && typeof tag === "object") : [tags];
}

function removeIdentifiers(item) {
  for (const tags of tagContainers(item.tags)) {
    for (const tag of identifierTags) delete tags[tag];
  }

  if (!item.ext) return;
  delete item.ext.user;
  delete item.ext.session;
}

export function sanitizeTelemetryUrl(value, baseUrl = "https://localhost/") {
  if (typeof value !== "string" || !value.trim()) return value;

  try {
    const url = new URL(value, baseUrl);
    const sanitized = `${url.origin}${url.pathname}`;
    return /^[a-z][a-z\d+.-]*:/i.test(value) ? sanitized : url.pathname;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

export function sanitizeTelemetryText(value, baseUrl = "https://localhost/") {
  if (typeof value !== "string") return value;
  return value.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => sanitizeTelemetryUrl(url, baseUrl));
}

function isApplicationInsightsUrl(value, baseUrl) {
  if (typeof value !== "string" || !value) return false;

  try {
    const hostname = new URL(value, baseUrl).hostname.toLowerCase();
    return (
      hostname === "dc.services.visualstudio.com" ||
      hostname.endsWith(".applicationinsights.azure.com") ||
      hostname.endsWith(".monitor.azure.com")
    );
  } catch {
    return false;
  }
}

function sanitizePageView(baseData, baseUrl) {
  if (baseData.uri) baseData.uri = sanitizeTelemetryUrl(baseData.uri, baseUrl);
  if (baseData.refUri) baseData.refUri = sanitizeTelemetryUrl(baseData.refUri, baseUrl);

  const pageUrl = baseData.uri || baseUrl;
  try {
    baseData.name = new URL(pageUrl, baseUrl).pathname;
  } catch {
    baseData.name = sanitizeTelemetryText(baseData.name, baseUrl);
  }
}

function sanitizeException(baseData, baseUrl) {
  baseData.message = sanitizeTelemetryText(baseData.message, baseUrl);

  for (const exception of baseData.exceptions || []) {
    exception.message = sanitizeTelemetryText(exception.message, baseUrl);
    exception.stack = sanitizeTelemetryText(exception.stack, baseUrl);
    for (const frame of exception.parsedStack || []) {
      frame.fileName = sanitizeTelemetryUrl(frame.fileName, baseUrl);
      frame.assembly = sanitizeTelemetryText(frame.assembly, baseUrl);
    }
  }
}

function failedDependency(baseData) {
  const responseCode = Number(baseData.responseCode);
  return baseData.success === false || responseCode === 0 || responseCode >= 400;
}

function sanitizeDependency(baseData, baseUrl) {
  const requestUrl = baseData.data || baseData.target;
  if (isApplicationInsightsUrl(requestUrl, baseUrl) || !failedDependency(baseData)) return false;

  if (baseData.data) baseData.data = sanitizeTelemetryUrl(baseData.data, baseUrl);
  if (baseData.target) {
    baseData.target = /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(baseData.target)
      ? sanitizeTelemetryUrl(baseData.target, baseUrl)
      : sanitizeTelemetryText(baseData.target, baseUrl);
  }
  if (baseData.name) baseData.name = sanitizeTelemetryText(baseData.name, baseUrl);
  return true;
}

export function createApplicationInsightsConfig(connectionString) {
  return {
    connectionString,
    autoTrackPageVisitTime: false,
    cookieCfg: { enabled: false },
    disableAjaxTracking: false,
    disableCookiesUsage: true,
    disableCorrelationHeaders: true,
    disableExceptionTracking: false,
    disableFetchTracking: false,
    enableAjaxErrorStatusText: false,
    enableAutoRouteTracking: false,
    enableCorsCorrelation: false,
    enableRequestHeaderTracking: false,
    enableResponseHeaderTracking: false,
    enableSessionStorageBuffer: false,
    enableUnhandledPromiseRejectionTracking: true,
    isBrowserLinkTrackingEnabled: false,
    isStorageUseDisabled: true,
  };
}

export function createTelemetryInitializer(baseUrl) {
  return (item) => {
    removeIdentifiers(item);
    const baseData = item.baseData || {};

    if (pageViewTypes.has(item.baseType)) sanitizePageView(baseData, baseUrl);
    if (item.baseType === "ExceptionData") sanitizeException(baseData, baseUrl);
    if (item.baseType === "RemoteDependencyData") return sanitizeDependency(baseData, baseUrl);
    return true;
  };
}
