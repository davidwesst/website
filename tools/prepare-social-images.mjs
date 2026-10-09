import { prepareSocialImages } from "../lib/social-images.js";
const images = await prepareSocialImages();
console.log(`Prepared ${Object.keys(images).length} social preview images (1200×630 JPEG).`);
