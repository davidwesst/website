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
    <section class="post-meta">
      ${play.startedOn ? `<p>Started: ${escapeHtml(play.startedOn)}</p>` : ""}
      ${play.completedOn ? `<p>Completed: ${escapeHtml(play.completedOn)}</p>` : ""}
      ${play.platform ? `<p>Platform: ${escapeHtml(play.platform)}</p>` : ""}
      ${
        Object.keys(rating).length
          ? `<ul>
              ${Object.entries(rating)
                .map(([key, value]) => `<li>${escapeHtml(key)}: ${escapeHtml(value)}</li>`)
                .join("")}
            </ul>`
          : ""
      }
    </section>
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
    ? `<p class="content-meta"><time datetime="${escapeHtml(post.dates.published)}">${escapeHtml(post.dates.published)}</time></p>`
    : "";
  const summary = post.summary ? `<p class="lede">${escapeHtml(post.summary)}</p>` : "";
    const image = post.media?.image
      ? `<img src="${escapeHtml(post.media.image)}" alt="${escapeHtml(post.media.imageAlt || "")}" class="post-image">`
      : "";

    return `
      <article class="post-detail">
        <p class="terminal-prompt">~/davidwesst ${escapeHtml(post.series || "post")}/view</p>
        <p class="post-series">${escapeHtml(post.series)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        ${published}
        ${image}
        ${summary}
        ${renderReview(post.review)}
        <div class="post-body">
          ${markdown.render(post.body.markdown)}
        </div>
      </article>
    `;
  }
}
