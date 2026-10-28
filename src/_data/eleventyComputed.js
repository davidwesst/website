import { preparePageMetadata } from "../_lib/page-metadata.js";
import { prepareContentNavigation } from "../_lib/content-navigation.js";
import { prepareDisplayBanner } from "../_lib/responsive-images.js";
import { preparePageDiscovery } from "../_lib/page-discovery.js";

import { prepareVideo } from "../../lib/video.js";

export default {
  video: (data) => prepareVideo(data),
  pageMetadata: (data) => preparePageMetadata(data),
  displayBanner: (data) => prepareDisplayBanner(data),
  pageDiscovery: (data) => preparePageDiscovery(data),
  contentNavigation: (data) => ["article", "gamelog", "dungeonlog", "video", "talk"].includes(data.type) ? prepareContentNavigation([...(data.collections?.posts || []), ...(data.collections?.talks || [])], data.page.url, data.type, data.topics) : null,
};
