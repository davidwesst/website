export default class {
  data() { return { permalink: ({ indexnow }) => `/${indexnow.key}.txt`, eleventyExcludeFromCollections: true }; }
  render({ indexnow }) { return `${indexnow.key}\n`; }
}
