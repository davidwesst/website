(() => {
  // Simple Analytics - 100% privacy-first analytics.
  const cdnScriptUrl = "https://scripts.simpleanalyticscdn.com/latest.js";
  const localScriptUrl = "/assets/vendor/simpleanalytics/latest.js";

  const loadScript = (src, onError) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;

    if (onError) {
      script.addEventListener("error", onError, { once: true });
    }

    document.head.appendChild(script);
  };

  loadScript(cdnScriptUrl, () => {
    loadScript(localScriptUrl);
  });
})();
