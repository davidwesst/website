import { preparePageMetadata } from "../_lib/page-metadata.js";
import { prepareContentNavigation } from "../_lib/content-navigation.js";

export default {
  pageMetadata: (data) => preparePageMetadata(data),
  contentNavigation: (data) => ["article", "gamelog", "dungeonlog", "talk"].includes(data.type) ? prepareContentNavigation([...(data.collections?.posts || []), ...(data.collections?.talks || [])], data.page.url, data.type, data.topics) : null,
};
