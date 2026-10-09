const OPENAI = "https://developers.openai.com/api/docs/bots";
const ANTHROPIC = "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler";
const PERPLEXITY = "https://docs.perplexity.ai/docs/resources/perplexity-crawlers";
const GOOGLE = "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers";

// Policy is reviewed deliberately; no upstream blocklist or runtime dependency.
export const CRAWLER_POLICY = Object.freeze([
  { agent: "Googlebot", purpose: "search", allow: true, reference: GOOGLE },
  { agent: "bingbot", purpose: "search", allow: true, reference: "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0" },
  { agent: "DuckDuckBot", purpose: "search", allow: true, reference: "https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot" },
  { agent: "OAI-SearchBot", purpose: "retrieval", allow: true, reference: OPENAI },
  { agent: "ChatGPT-User", purpose: "user", allow: true, reference: OPENAI },
  { agent: "Claude-SearchBot", purpose: "retrieval", allow: true, reference: ANTHROPIC },
  { agent: "Claude-User", purpose: "user", allow: true, reference: ANTHROPIC },
  { agent: "PerplexityBot", purpose: "retrieval", allow: true, reference: PERPLEXITY },
  { agent: "Perplexity-User", purpose: "user", allow: true, reference: PERPLEXITY },
  { agent: "GPTBot", purpose: "training", allow: false, reference: OPENAI },
  { agent: "ClaudeBot", purpose: "training", allow: false, reference: ANTHROPIC },
  { agent: "Google-Extended", purpose: "training-and-grounding", allow: false, reference: GOOGLE },
]);

export function renderRobots(siteUrl) {
  const groups = CRAWLER_POLICY.map(({ agent, allow }) => `User-agent: ${agent}\n${allow ? "Allow" : "Disallow"}: /`);
  return `# Search and user-directed retrieval allowed; named training uses denied.\nUser-agent: *\nAllow: /\n\n${groups.join("\n\n")}\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

// Resolve the simple prefix directives emitted by this site's registry.
export function robotsAllows(text, agent, pathname = "/") {
  const groups = [];
  let group;
  for (const line of text.split(/\r?\n/)) {
    const match = line.replace(/#.*/, "").trim().match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (key === "user-agent") {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(match[2].toLowerCase());
    } else if (["allow", "disallow"].includes(key) && group && match[2]) group.rules.push({ allow: key === "allow", path: match[2] });
  }
  const specific = groups.filter((entry) => entry.agents.includes(agent.toLowerCase()));
  const applicable = specific.length ? specific : groups.filter((entry) => entry.agents.includes("*"));
  const rules = applicable.flatMap((entry) => entry.rules).filter((rule) => pathname.startsWith(rule.path))
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return rules[0]?.allow ?? true;
}
