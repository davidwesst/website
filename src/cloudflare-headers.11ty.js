export default class CloudflareHeaders {
  data() { return { permalink: "/_headers", eleventyExcludeFromCollections: true }; }
  render() {
    return `/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  Strict-Transport-Security: max-age=10886400; includeSubDomains; preload
https://:worker.:account.workers.dev/*
  X-Robots-Tag: noindex
/deployment.json
  ! Cache-Control
  Cache-Control: no-store
`;
  }
}
