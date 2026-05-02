import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: true });

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default class Page {
  data() {
    return {
      pagination: {
        data: "collections.pages",
        size: 1,
        alias: "contentPage",
      },
      layout: "base.webc",
      eleventyComputed: {
        title(data) {
          return data.contentPage.title;
        },
      },
      permalink(data) {
        return data.contentPage.canonicalUrl;
      },
    };
  }

  render(data) {
    const page = data.contentPage;
    const summary = page.summary ? `<p class="lede">${escapeHtml(page.summary)}</p>` : "";

    return `
      <article class="page-detail">
        <header class="page-header">
          <p class="terminal-prompt">~/davidwesst ${escapeHtml(page.slug)}</p>
          <h1>${escapeHtml(page.title)}</h1>
          ${summary}
        </header>
        <div class="page-body">
          ${markdown.render(page.body.markdown)}
        </div>
      </article>
    `;
  }
}
