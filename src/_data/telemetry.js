import { telemetryBuildConfig } from "../../lib/telemetry-build.js";

export default function () {
  const { enabled } = telemetryBuildConfig();
  return {
    applicationInsights: { enabled },
    simpleAnalytics: { enabled },
  };
}
