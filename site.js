(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motion = window.WhyeungMotion;
  const running = new Map();

  // Motion is self-hosted. Content stays visible if JavaScript or the bundle fails.
  if (motion && typeof Element.prototype.animate === "function" && !reducedMotion.matches) {
    const ease = getComputedStyle(root).getPropertyValue("--ease-out").match(/[\d.]+/g).map(Number);
    const finish = (animation) => {
      if (!running.has(animation)) return;
      running.delete(animation);
      animation.complete();
      animation.cancel();
    };
    const reveal = (elements, delay = 0) => {
      if (reducedMotion.matches || !elements.length) return;
      const animation = motion.animate(
        elements,
        { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] },
        { duration: 0.5, delay, ease }
      );
      running.set(animation, elements);
      animation.finished.then(() => finish(animation));
    };

    // A short, one-off stagger on a fresh page load, never on an anchor jump.
    if (!window.location.hash && window.scrollY < 16) {
      reveal([...document.querySelectorAll(".hero-inner > *")], motion.stagger(0.06));
    }

    const cards = [...document.querySelectorAll(".pillar.reveal")];
    const stopObserving = motion.inView(
      ".reveal",
      (element) => {
        const anchor = document.getElementById(window.location.hash.slice(1));
        if (anchor?.contains(element) || element.contains(document.activeElement)) return;
        const index = cards.indexOf(element);
        reveal([element], index === -1 ? 0 : motion.stagger(0.06)(index, cards.length));
        // No leave callback: Motion unobserves this element after its first entrance.
      },
      { amount: 0.15, margin: "0px 0px -40px 0px" }
    );

    // Never make a focused control or anchor destination wait for decorative motion.
    document.addEventListener("focusin", (event) => {
      for (const [animation, elements] of running) {
        if (elements.some((element) => element.contains(event.target))) finish(animation);
      }
    });
    window.addEventListener("hashchange", () => {
      for (const animation of running.keys()) finish(animation);
    });
    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      stopObserving();
      for (const animation of running.keys()) finish(animation);
    });
  }

  // Header border once the page scrolls.
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
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
