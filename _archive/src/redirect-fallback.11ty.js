function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default class RedirectFallbackPage {
  data() {
    return {
      pagination: {
        data: "redirects",
        size: 1,
        alias: "redirect",
      },
      permalink(data) {
        if (data.redirect.from.includes("?") || data.redirect.from.endsWith("/index.html")) {
          return false;
        }

        return data.redirect.from;
      },
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const target = escapeHtml(data.redirect.to);

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${target}">
  <title>Redirecting</title>
</head>
<body>
  <p>Redirecting to <a href="${target}">${target}</a>.</p>
</body>
</html>`;
  }
}
