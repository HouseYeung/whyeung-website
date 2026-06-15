const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".site-header");
const yearNode = document.querySelector("#current-year");
const page = document.body.dataset.page;

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteHeader?.classList.toggle("is-open") ?? siteNav.classList.toggle("is-open");
    siteNav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader?.classList.remove("is-open");
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (siteNav && page) {
  const pageMap = {
    company: "./",
    product: "./product.html",
    contact: "./contact.html",
    privacy: "./privacy.html",
    terms: "./terms.html"
  };

  siteNav.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === pageMap[page]) {
      link.classList.add("is-active");
    }
  });
}

const revealTargets = document.querySelectorAll(".reveal-block");

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
    { threshold: 0.14 }
  );

  revealTargets.forEach((node) => observer.observe(node));
} else {
  revealTargets.forEach((node) => node.classList.add("is-visible"));
}
