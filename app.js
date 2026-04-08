const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const yearNode = document.querySelector("#current-year");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const revealTargets = document.querySelectorAll(
  ".section, .section-highlight, .hero-copy, .hero-panel, .cta-section"
);

if ("IntersectionObserver" in window && revealTargets.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16
    }
  );

  revealTargets.forEach((node) => {
    node.classList.add("reveal");
    observer.observe(node);
  });
}
