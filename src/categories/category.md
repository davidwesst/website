---
pagination:
  data: collections.categoryPages
  size: 1
  alias: category
permalink: "/categories/{{ category.slug }}/"
layout: category.webc
eleventyComputed:
  title: "Category: {{ category.name }}"
eleventyExcludeFromCollections: true
---
