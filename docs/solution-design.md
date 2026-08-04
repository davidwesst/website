# Solution Design

## Purpose

This repository is a deliberately minimal foundation for David Wesst's website. The former merged-site implementation is retained in `_archive` for historical reference but is not part of the active application.

## Current Scope

The active site contains one home page. Future content will focus on:

- blog posts and their subtypes
- talks
- projects

Those content types are intentionally not implemented until their requirements are revisited from this clean baseline.

## Technology

- Node.js 24 LTS and Node.js 26 (LTS + 1)
- pnpm 11
- Eleventy 3
- Markdown for content pages
- WebC for layouts and reusable web components
- Tailwind CSS 4 as the only styling dependency

## Architecture

- `src/**/*.md` contains content pages.
- `src/_includes/**/*.webc` contains WebC layouts and components.
- `src/styles/main.css` is the Tailwind entry point.
- `_site` is generated output.
- `_archive` contains the prior implementation and content and must remain excluded from builds, tests, and deployment inputs.

The active implementation should remain data-driven as content types return. Source-specific normalization, redirects, feeds, analytics, and browser tests should only be reintroduced when a concrete requirement justifies them.

## Validation

The test suite performs one production build and uses Node's built-in test runner to verify that:

- `index.html` is the only generated HTML page
- the home page contains its expected heading
- the generated page references the Tailwind stylesheet

This output-level check is intentionally browser-free to keep CI fast.

CI runs the complete build and test suite on both supported Node.js release lines. Node.js 24 produces the deployment artifact after both matrix jobs succeed.

The build removes only the generated `_site` directory before rendering so files from an older build cannot survive into a deployment.
