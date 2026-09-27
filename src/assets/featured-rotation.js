for (const rotation of document.querySelectorAll("[data-featured-rotation]")) {
  const tabs = [...rotation.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  if (tabs.length < 2 || panels.some((panel) => !panel)) continue;

  let active = 0;
  let timer;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function select(index, focus = false) {
    active = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, position) => {
      const selected = position === active;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (focus) tabs[active].focus();
  }

  function restart() {
    window.clearInterval(timer);
    if (!reducedMotion.matches && !rotation.matches(":hover") && !rotation.contains(document.activeElement) && !document.hidden) {
      timer = window.setInterval(() => select(active + 1), 8000);
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => { select(index); restart(); });
    tab.addEventListener("keydown", (event) => {
      const direction = { ArrowRight: 1, ArrowLeft: -1, Home: -active, End: tabs.length - 1 - active }[event.key];
      if (direction === undefined) return;
      event.preventDefault();
      select(active + direction, true);
      restart();
    });
  });
  rotation.addEventListener("mouseenter", restart);
  rotation.addEventListener("mouseleave", restart);
  rotation.addEventListener("focusin", restart);
  rotation.addEventListener("focusout", () => window.setTimeout(restart, 0));
  document.addEventListener("visibilitychange", restart);
  reducedMotion.addEventListener("change", restart);
  restart();
}
