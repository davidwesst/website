import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: true });

export function renderMarkdown(value = "") {
  return markdown.render(value);
}
