import { ApplicationInsights, DistributedTracingModes } from "@microsoft/applicationinsights-web";
import {
  applicationInsightsConfig,
  isDoNotTrackEnabled,
} from "./application-insights-config.js";

function doNotTrackValues(browserWindow) {
  return {
    navigator: browserWindow.navigator?.doNotTrack,
    window: browserWindow.doNotTrack,
    microsoft: browserWindow.navigator?.msDoNotTrack,
  };
}

export function startApplicationInsights(browserWindow = window) {
  if (isDoNotTrackEnabled(doNotTrackValues(browserWindow))) return undefined;

  const applicationInsights = new ApplicationInsights({
    config: applicationInsightsConfig(DistributedTracingModes.W3C),
  });

  applicationInsights.loadAppInsights();
  applicationInsights.trackPageView();
  return applicationInsights;
}

startApplicationInsights();
