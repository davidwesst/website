---
pagination:
  data: collections.topicPages
  size: 1
  alias: topic
permalink: "/topics/{{ topic.slug }}/"
layout: topic.webc
eleventyComputed:
  title: "Topic: {{ topic.name }}"
eleventyExcludeFromCollections: true
---
