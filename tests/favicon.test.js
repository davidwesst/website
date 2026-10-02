import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the root favicon publishes the repository-owned multi-resolution ICO intact", async () => {
  const icon = await readFile("_site/favicon.ico");
  assert.deepEqual(icon, await readFile("src/assets/favicon.ico"));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    assert.equal(icon[entry], size);
    assert.equal(icon[entry + 1], size);
    assert.equal(icon.readUInt16LE(entry + 4), 1);
    assert.equal(icon.readUInt16LE(entry + 6), 32);
    const bytes = icon.readUInt32LE(entry + 8);
    const offset = icon.readUInt32LE(entry + 12);
    assert.ok(offset >= 54 && offset + bytes <= icon.length);
    assert.equal(icon.readUInt32LE(offset), 40, "ICO contains a bitmap header");
    assert.equal(icon.readInt32LE(offset + 4), size);
    assert.equal(icon.readInt32LE(offset + 8), size * 2, "ICO includes the transparency mask");
    assert.equal(icon[offset + 43], 0, "Circular logo retains transparent corners");
    assert.equal(bytes, 40 + size * size * 4 + Math.ceil(size / 32) * 4 * size);
  }
});
