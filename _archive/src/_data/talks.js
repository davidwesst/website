import { getDocuments } from "../_lib/content/index.js";

export default function talks() {
  return getDocuments().filter((document) => document.docType === "talk");
}
