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

  // Clocks and the 24-hour hand-off timeline.
  const clocks = document.querySelectorAll("[data-clock]");
  const timeline = document.querySelector("[data-timeline]");
  if (clocks.length === 0 && !timeline) return;

  const DAY = 1440;
  const WORK_START = 9 * 60;
  const WORK_LENGTH = 9 * 60;
  const pad = (value) => String(value).padStart(2, "0");

  const partsIn = (timeZone, date) => {
    const parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    })
      .formatToParts(date)
      .forEach(({ type, value }) => {
        parts[type] = value;
      });
    parts.hour = Number(parts.hour) % 24;
    parts.minute = Number(parts.minute);
    return parts;
  };

  const offsetOf = (timeZone, date) => {
    const p = partsIn(timeZone, date);
    const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), p.hour, p.minute);
    const flooredNow = Math.floor(date.getTime() / 60000) * 60000;
    return Math.round((asUtc - flooredNow) / 60000);
  };

  const abbreviationOf = (timeZone, date) => {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(date)
      .find(({ type }) => type === "timeZoneName");
    return part && !part.value.startsWith("GMT") ? part.value : null;
  };

  const segment = (start, length) => {
    const node = document.createElement("span");
    node.className = "tl-seg";
    node.style.left = `${(start / DAY) * 100}%`;
    node.style.width = `${(length / DAY) * 100}%`;
    return node;
  };

  const render = () => {
    const now = new Date();

    clocks.forEach((card) => {
      const timeZone = card.dataset.clock;
      const p = partsIn(timeZone, now);
      const working =
        p.weekday !== "Sat" && p.weekday !== "Sun" && p.hour * 60 + p.minute >= WORK_START && p.hour * 60 + p.minute < WORK_START + WORK_LENGTH;

      card.querySelector("[data-time]").textContent = `${pad(p.hour)}:${pad(p.minute)}`;
      card.querySelector("[data-state]").textContent = working ? "In session" : "Agents on shift";
      card.classList.toggle("is-working", working);

      const abbr = card.querySelector("[data-abbr]");
      const name = abbreviationOf(timeZone, now);
      if (abbr && name) abbr.textContent = name;
    });

    if (timeline) {
      const viewerOffset = -now.getTimezoneOffset();

      timeline.querySelectorAll("[data-tz]").forEach((track) => {
        const start = (((WORK_START - offsetOf(track.dataset.tz, now) + viewerOffset) % DAY) + DAY) % DAY;
        const end = start + WORK_LENGTH;
        const segments = end <= DAY ? [segment(start, WORK_LENGTH)] : [segment(start, DAY - start), segment(0, end - DAY)];
        track.replaceChildren(...segments);
      });

      const minutes = now.getHours() * 60 + now.getMinutes();
      const position = `${(minutes / DAY) * 100}%`;
      timeline.style.setProperty("--now", position);

      const needle = timeline.querySelector("[data-needle]");
      if (needle) needle.style.left = position;

      const label = timeline.querySelector("[data-now]");
      if (label) label.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  };

  render();
  setInterval(render, 15000);
})();
