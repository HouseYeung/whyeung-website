const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const yearNode = document.querySelector("#current-year");
const page = document.body.dataset.page;

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
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
