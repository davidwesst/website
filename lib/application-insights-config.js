export const APPLICATION_INSIGHTS_CONNECTION_STRING = "InstrumentationKey=02bb1e7e-9076-443c-ad13-258266606aa0;IngestionEndpoint=https://canadaeast-0.in.applicationinsights.azure.com/;LiveEndpoint=https://canadaeast.livediagnostics.monitor.azure.com/;ApplicationId=89588a3d-b868-4519-827b-819f5e8cf147";

export const APPLICATION_INSIGHTS_EXCLUDED_REQUESTS = [
  /(?:^|\.)simpleanalytics(?:cdn)?\.com(?:\/|$)/i,
  /(?:^|\.)applicationinsights\.azure\.com(?:\/|$)/i,
  /(?:^|\.)monitor\.azure\.com(?:\/|$)/i,
];

export function isDoNotTrackEnabled(values = {}) {
  return [values.navigator, values.window, values.microsoft]
    .some((value) => ["1", "yes"].includes(String(value || "").toLowerCase()));
}

export function applicationInsightsConfig(distributedTracingMode) {
  return {
    connectionString: APPLICATION_INSIGHTS_CONNECTION_STRING,
    distributedTracingMode,
    disableCorrelationHeaders: false,
    enableCorsCorrelation: false,
    disableExceptionTracking: false,
    enableUnhandledPromiseRejectionTracking: true,
    disableAjaxTracking: false,
    disableFetchTracking: false,
    enableAjaxPerfTracking: true,
    excludeRequestFromAutoTrackingPatterns: APPLICATION_INSIGHTS_EXCLUDED_REQUESTS,
    samplingPercentage: 100,
    autoTrackPageVisitTime: false,
    cookieCfg: { enabled: false },
    disableCookiesUsage: true,
    isStorageUseDisabled: true,
    enableSessionStorageBuffer: false,
    enableAutoRouteTracking: false,
    enableRequestHeaderTracking: false,
    enableResponseHeaderTracking: false,
    enableAjaxErrorStatusText: false,
  };
}
