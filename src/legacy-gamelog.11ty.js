function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export default class LegacyGamelogDispatcher {
  data() {
    return {
      permalink: "/legacy/gamelog-entry.html",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const targets = Object.fromEntries(data.collections.gamelogs.map((item) => [item.fileSlug, item.url]));
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Redirecting to a gamelog</title>
</head>
<body>
  <main>
    <h1>Redirecting to a gamelog</h1>
    <p id="message">Finding the requested gamelog…</p>
    <p><a href="/blog/gamelogs/">Browse all gamelogs</a></p>
  </main>
  <script>
    const targets = ${escapeScriptJson(targets)};
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (slug && Object.hasOwn(targets, slug)) {
      window.location.replace(targets[slug]);
    } else {
      document.querySelector("#message").textContent = "That legacy gamelog address is not recognized.";
    }
  </script>
</body>
</html>`;
  }
}
