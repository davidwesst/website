import { prepareResponsiveImages } from "../lib/responsive-images.js";

const manifest = await prepareResponsiveImages();
console.log(`Prepared responsive WebP sources for ${Object.keys(manifest.images).length} large authored images; originals remain intact.`);
