import { createDeployment } from "../lib/deployment-identity.js";

export default class Deployment {
  data() { return { permalink: "/deployment.json", eleventyExcludeFromCollections: true }; }
  render() { return `${JSON.stringify(createDeployment())}\n`; }
}
