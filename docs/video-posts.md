# Authoring video posts

Create a post offline:

```sh
pnpm new video "My video title" --youtube "https://youtu.be/EAB4uFQN6LE" --date 2026-10-21
```

The date defaults to today in UTC. Posts live in `src/content/posts/videos/<slug>/index.md` and publish at `/blog/<slug>/`. Titles keep their supplied capitalization. Slugs must be unique across all blog families.

To prefill metadata, enable the YouTube Data API in your Google Cloud project, provide `YOUTUBE_API_KEY` in your local environment, and run:

```sh
pnpm new video --youtube "https://youtu.be/EAB4uFQN6LE" --fetch-youtube
```

An explicit title or `--date` overrides the API value. The first description paragraph becomes a draft summary, and an available thumbnail is saved locally. Review the summary, date, and thumbnail alt text. Topics and supplementary links are authored manually. Missing credentials or unavailable metadata fail before creating a post; thumbnail failure warns and leaves the banner optional. Neither the API key nor raw API responses are saved. Builds do not fetch YouTube metadata.

Required front matter is `title`, an unquoted YAML `date`, and `youtube`. Watch, youtu.be, Shorts, and single-video embed URLs are accepted; playlist-only URLs are rejected. Optional shared fields include `summary`, `topics`, `updated`, `redirectFrom`, and `banner`.

```yaml
banner:
  src: ./thumbnail.png
  alt: "Describe the thumbnail"
links:
  - label: "Read the companion article"
    url: /blog/my-article/
  - label: "Discuss on LinkedIn"
    url: https://www.linkedin.com/posts/example
```

The banner appears in cards and social previews. The detail page displays the player and a watch link instead. Without a banner, cards use a video placeholder. Links appear under “Related links” in authored order. Markdown below the front matter is optional. Do not paste the primary player iframe into the body.

Run `pnpm test` before reviewing and publishing through the normal website workflow. Creating a file does not deploy it or publish to another service.
