(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal on scroll. Anything already on screen is marked visible before the
  // hidden state is armed, so there is no flash on load.
  const targets = [...document.querySelectorAll(".reveal, [data-animate]")];

  if ("IntersectionObserver" in window && !reduceMotion) {
    targets.forEach((node) => {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
        node.classList.add("is-in");
      }
    });
    root.classList.add("js");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );

    targets.filter((node) => !node.classList.contains("is-in")).forEach((node) => observer.observe(node));
  } else {
    targets.forEach((node) => node.classList.add("is-in"));
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
