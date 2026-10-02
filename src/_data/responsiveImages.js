import { readResponsiveManifest } from "../../lib/responsive-images.js";

export default async function () {
  return (await readResponsiveManifest()).images;
}
