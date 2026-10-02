import { preparePageMetadata } from "../_lib/page-metadata.js";
import { prepareContentNavigation } from "../_lib/content-navigation.js";
import { prepareDisplayBanner } from "../_lib/responsive-images.js";

export default {
  pageMetadata: (data) => preparePageMetadata(data),
  displayBanner: (data) => prepareDisplayBanner(data),
  contentNavigation: (data) => ["article", "gamelog", "dungeonlog", "talk"].includes(data.type) ? prepareContentNavigation([...(data.collections?.posts || []), ...(data.collections?.talks || [])], data.page.url, data.type, data.topics) : null,
};
