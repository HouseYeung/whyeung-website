(() => {
  // Header border once the page scrolls.
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const hero = document.querySelector("[data-particle-hero]");
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      nav.classList.toggle("nav-dark", Boolean(hero && hero.getBoundingClientRect().bottom > nav.offsetHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  // Copy email.
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.querySelector("[data-copy-label]");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        if (label) label.textContent = "Copied";
        setTimeout(() => {
          if (label) label.textContent = "Copy";
        }, 1800);
      } catch {
        window.location.href = `mailto:${button.dataset.copy}`;
      }
    });
  });
})();
