import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { createApplicationInsightsConfig, createTelemetryInitializer } from "../_lib/telemetry-policy.js";

const connectionString = __APPLICATION_INSIGHTS_CONNECTION_STRING__;
const applicationInsights = new ApplicationInsights({
  config: createApplicationInsightsConfig(connectionString),
});

applicationInsights.loadAppInsights();
applicationInsights.addTelemetryInitializer(createTelemetryInitializer(window.location.origin));
applicationInsights.trackPageView({
  name: window.location.pathname,
  uri: `${window.location.origin}${window.location.pathname}`,
});
