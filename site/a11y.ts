const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
const main = document.querySelector<HTMLElement>("main#main");

skipLink?.addEventListener("click", () => {
  requestAnimationFrame(() => main?.focus());
});
