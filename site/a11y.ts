const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
const main = document.querySelector<HTMLElement>("main#main");
const routeFocusKey = "clipboard-lan-bridge:focus-route-heading";

skipLink?.addEventListener("click", () => {
  requestAnimationFrame(() => main?.focus());
});

// These are separate static documents, so preserve the orientation cue that a
// client-side router would normally provide. Do not do this for same-page
// anchors: their native target behavior is more useful.
document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach(link => {
  link.addEventListener("click", event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin === location.origin && destination.pathname !== location.pathname) {
      sessionStorage.setItem(routeFocusKey, "1");
    }
  });
});

addEventListener("pageshow", () => {
  if (sessionStorage.getItem(routeFocusKey) !== "1") return;
  // Keep the marker while traversing document history, so Back receives the
  // same orientation cue as the forward navigation.
  requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());
});
