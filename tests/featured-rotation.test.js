import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const script = await readFile(new URL("../src/assets/featured-rotation.js", import.meta.url), "utf8");

function slideshow({ reduced = false, count = 2 } = {}) {
  function element(attributes = {}) {
    const listeners = {};
    return {
      hidden: false,
      getAttribute: (name) => attributes[name],
      setAttribute: (name, value) => { attributes[name] = value; },
      addEventListener: (name, callback) => { listeners[name] = callback; },
      emit: (name, event = {}) => listeners[name]?.(event),
      focus() { document.activeElement = this; rotation.emit("focusin"); },
    };
  }
  const tabs = Array.from({ length: count }, (_, index) => element({ "aria-controls": `panel-${index}` }));
  const panels = tabs.map((_, index) => ({ hidden: index !== 0 }));
  const toggle = element();
  toggle.parentElement = { hidden: true };
  const rotation = Object.assign(element(), {
    querySelectorAll: () => tabs,
    querySelector: () => toggle,
    contains: (target) => [...tabs, ...panels, toggle].includes(target),
    matches: () => true, // Pointer is over the gallery throughout these tests.
  });
  const document = Object.assign(element(), {
    hidden: false,
    activeElement: null,
    querySelectorAll: () => [rotation],
    getElementById: (id) => panels[Number(id.split("-")[1])],
  });
  const media = Object.assign(element(), { matches: reduced });
  const timers = new Map();
  let nextTimer = 0;
  const window = {
    matchMedia: () => media,
    clearInterval: (id) => timers.delete(id),
    setInterval: (callback, delay) => { assert.equal(delay, 8000); timers.set(++nextTimer, callback); return nextTimer; },
    setTimeout: (callback) => callback(),
  };
  runInNewContext(script, { document, window });
  return { tabs, panels, toggle, rotation, document, media, timers, tick: () => [...timers.values()].forEach((callback) => callback()) };
}

test("hero cycles while hovered, wraps, and supports pause and resume", () => {
  const s = slideshow();
  assert.equal(s.toggle.parentElement.hidden, false);
  s.tick();
  assert.deepEqual(s.panels.map((panel) => panel.hidden), [true, false]);
  assert.equal(s.tabs[1].getAttribute("aria-selected"), "true");
  s.tick();
  assert.deepEqual(s.panels.map((panel) => panel.hidden), [false, true]);
  s.toggle.focus();
  s.toggle.checked = !s.toggle.checked;
  s.toggle.emit("change");
  assert.equal(s.timers.size, 0);
  assert.equal(s.toggle.checked, true);
  s.toggle.checked = !s.toggle.checked;
  s.toggle.emit("change");
  assert.equal(s.timers.size, 1);
  s.tick();
  assert.equal(s.panels[1].hidden, false);
});

test("reduced motion starts paused and allows explicit play", () => {
  const s = slideshow({ reduced: true });
  assert.equal(s.timers.size, 0);
  assert.equal(s.toggle.checked, true);
  s.toggle.checked = !s.toggle.checked;
  s.toggle.emit("change");
  s.tick();
  assert.equal(s.panels[1].hidden, false);
  s.media.emit("change");
  assert.equal(s.timers.size, 0);
});

test("keyboard navigation and background visibility pause cycling", () => {
  const s = slideshow();
  s.tabs[0].focus();
  assert.equal(s.timers.size, 0);
  let prevented = false;
  s.tabs[0].emit("keydown", { key: "ArrowLeft", preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(s.document.activeElement, s.tabs[1]);
  assert.equal(s.panels[1].hidden, false);
  s.document.activeElement = null;
  s.rotation.emit("focusout");
  assert.equal(s.timers.size, 1);
  s.document.hidden = true;
  s.document.emit("visibilitychange");
  assert.equal(s.timers.size, 0);
  s.document.hidden = false;
  s.document.emit("visibilitychange");
  assert.equal(s.timers.size, 1);
});

test("a single featured post does not start cycling or expose playback controls", () => {
  const s = slideshow({ count: 1 });
  assert.equal(s.toggle.parentElement.hidden, true);
  assert.equal(s.timers.size, 0);
});

test("three featured tabs cycle through the talk and wrap back to the article", () => {
  const s = slideshow({ count: 3 });
  s.tick();
  s.tick();
  assert.deepEqual(s.panels.map((panel) => panel.hidden), [true, true, false]);
  assert.equal(s.tabs[2].getAttribute("aria-selected"), "true");
  s.tick();
  assert.deepEqual(s.panels.map((panel) => panel.hidden), [false, true, true]);
});
