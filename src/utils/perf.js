// src/utils/perf.js
export function setupPerfFlags() {
  try {
    const d = document.documentElement;
    const nav = navigator || {};
    const perfLow =
      (nav.deviceMemory && nav.deviceMemory <= 4) ||
      (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
      (nav.connection && (nav.connection.saveData || /2g/i.test(nav.connection.effectiveType || ""))) ||
      (matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

    if (perfLow) d.classList.add("perf-low");
    else d.classList.remove("perf-low");
  } catch (e) {
    // no-op
  }
}
