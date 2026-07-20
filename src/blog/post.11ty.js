import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: true });

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderReview(review) {
  if (!review) {
    return "";
  }

  const play = review.play || {};
  const rating = review.rating || {};

  return `
    <dl>
      ${play.startedOn ? `<dt>Started</dt><dd>${escapeHtml(play.startedOn)}</dd>` : ""}
      ${play.completedOn ? `<dt>Completed</dt><dd>${escapeHtml(play.completedOn)}</dd>` : ""}
      ${play.platform ? `<dt>Platform</dt><dd>${escapeHtml(play.platform)}</dd>` : ""}
      ${
        Object.keys(rating).length
          ? Object.entries(rating)
              .map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`)
              .join("")
          : ""
      }
    </dl>
  `;
}

export default class PostPage {
  data() {
    return {
      pagination: {
        data: "collections.posts",
        size: 1,
        alias: "post",
      },
      layout: "base.webc",
      eleventyExcludeFromSiteIndex: true,
      eleventyComputed: {
        title(data) {
          return data.post.title;
        },
      },
      permalink(data) {
        return data.post.canonicalUrl;
      },
    };
  }

  render(data) {
    const post = data.post;
  const published = post.dates?.published
    ? `<p><time datetime="${escapeHtml(post.dates.published)}">${escapeHtml(post.dates.published)}</time></p>`
    : "";
  const summary = post.summary ? `<p>${escapeHtml(post.summary)}</p>` : "";
    const image = post.media?.image
      ? `<img src="${escapeHtml(post.media.image)}" alt="${escapeHtml(post.media.imageAlt || "")}">`
      : "";

    return `
      <article>
        <p>${escapeHtml(post.series)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        ${published}
        ${image}
        ${summary}
        ${renderReview(post.review)}
        ${markdown.render(post.body.markdown)}
      </article>
    `;
  }
}
