---
pagination:
  data: collections.topicPages
  size: 1
  alias: topic
permalink: "/categories/{{ topic.slug }}/"
layout: redirect.webc
eleventyComputed:
  title: "Topic moved: {{ topic.name }}"
  targetUrl: "/topics/{{ topic.slug }}/"
  canonicalUrl: "https://david.wes.st/topics/{{ topic.slug }}/"
robots: noindex
eleventyExcludeFromCollections: true
---
