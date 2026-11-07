// Applies the saved light/dark choice before the page paints (no flash). Loaded by src/app/layout.tsx.
// "system" (or nothing saved) leaves it to the device setting via prefers-color-scheme.
(function () {
  try {
    var t = localStorage.getItem("snakk.theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch {}
})();
