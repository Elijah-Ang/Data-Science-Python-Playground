(() => {
  "use strict";

  const frame = document.querySelector("[data-scene]");
  const gate = frame?.querySelector(".gate-hitbox");
  if (!frame || !gate) return;

  gate.addEventListener("click", event => {
    // Preserve normal new-tab, download, and assistive-technology behaviour.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (frame.classList.contains("is-entering")) return;
    frame.classList.add("is-entering");
    gate.setAttribute("aria-busy", "true");
    window.setTimeout(() => { window.location.assign(gate.href); }, 220);
  });

  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    frame.classList.remove("is-entering");
    gate.removeAttribute("aria-busy");
    window.location.reload();
  });
})();
