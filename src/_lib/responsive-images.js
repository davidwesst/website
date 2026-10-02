import { load } from "cheerio";

export const imageSizes = {
  detail: "(min-width: 1024px) 976px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)",
  body: "(min-width: 1024px) 784px, (min-width: 768px) calc(100vw - 160px), (min-width: 640px) calc(100vw - 104px), calc(100vw - 88px)",
  featured: "(min-width: 1152px) 663px, (min-width: 768px) calc(60vw - 28.8px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)",
  card: "auto, (min-width: 1024px) 736px, (min-width: 768px) calc(50vw - 40px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)",
};

export function responsiveImage(src, baseUrl, images) {
  if (!src || !baseUrl || /^(?:https?:|data:|\/\/)/i.test(src)) return null;
  const route = decodeURIComponent(new URL(src, `https://images.invalid${baseUrl}`).pathname);
  const image = images?.[route];
  return image ? { width: image.width, height: image.height, srcset: image.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "), sizes: imageSizes } : null;
}

export function prepareDisplayBanner(data) {
  const banner = data.resolvedBanner || data.banner;
  return banner ? { ...banner, responsive: responsiveImage(banner.src, data.page.url, data.responsiveImages) } : null;
}

export function enhanceBodyImages(html, pageUrl, images) {
  const $ = load(html);
  let changed = false;
  for (const element of $(".prose-content img").toArray()) {
    const img = $(element);
    if (img.parent().is("picture")) continue;
    const image = responsiveImage(img.attr("src"), pageUrl, images);
    if (!image) continue;
    img.attr({ width: image.width, height: image.height });
    img.wrap("<picture></picture>");
    const source = $("<source>").attr({ type: "image/webp", srcset: image.srcset, sizes: imageSizes.body });
    img.before(source);
    changed = true;
  }
  return changed ? $.html() : html;
}
