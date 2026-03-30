const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideSidebar && !clickedToggle && window.innerWidth <= 980) {
      sidebar.classList.remove("open");
    }
  });
}

// --- Collapsible sidebar ---
function initSidebarGroups() {
  const groups = document.querySelectorAll(".nav-group");
  if (!groups.length) return;

  groups.forEach((group) => {
    const toggle = group.querySelector(".nav-group-toggle");
    const activeLink = group.querySelector(".nav-link.active");

    if (!toggle) return;

    if (activeLink) {
      group.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    } else if (!group.classList.contains("is-open")) {
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
      const isOpen = group.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

// --- Docs search ---
const DOCS_INDEX = [
  {
    title: "Home",
    path: "",
    keywords: "iw8-mod docs homepage overview tutorials installation guides support",
    section: "Overview",
  },
  {
    title: "About",
    path: "about/",
    keywords: "about iw8-mod mw2019 modern warfare offline p2p lan developers credits supported versions",
    section: "Overview",
  },
  {
  title: "Features",
  path: "features/",
  keywords: "features lan p2p offline scripting gsc bots versions launcher support custom mods",
  section: "Overview",
  },
  {
    title: "Manual Installation",
    path: "installation/manual/",
    keywords: "manual install python _start_game_.py dll files game folder setup",
    section: "Installation",
  },
  {
    title: "Using ZeroLauncher",
    path: "installation/zerolauncher/",
    keywords: "zerolauncher launcher install download launch easy setup driver",
    section: "Installation",
  },
  {
    title: "Scripting",
    path: "guides/scripting/",
    keywords: "scripting gsc iw8 script loading hud menu debugging",
    section: "Guides",
  },
  {
    title: "Menus",
    path: "guides/menus/",
    keywords: "menus menu structure layout input styling",
    section: "Guides",
  },
  {
    title: "Troubleshooting",
    path: "guides/troubleshooting/",
    keywords: "troubleshooting common problems missing files launch issues support",
    section: "Guides",
  },
];

function getSiteRoot() {
  const stylesheet = document.querySelector('link[rel="stylesheet"][href*="assets/css/style.css"]');
  if (!stylesheet) return `${window.location.origin}/`;

  const absoluteStylesheetUrl = new URL(stylesheet.getAttribute("href"), window.location.href);
  return absoluteStylesheetUrl.href.split("assets/css/style.css")[0];
}

function scoreDoc(doc, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let score = 0;
  const title = doc.title.toLowerCase();
  const keywords = doc.keywords.toLowerCase();
  const section = doc.section.toLowerCase();

  if (title === q) score += 100;
  if (title.startsWith(q)) score += 60;
  if (title.includes(q)) score += 40;
  if (keywords.includes(q)) score += 20;
  if (section.includes(q)) score += 15;

  const parts = q.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (title.includes(part)) score += 12;
    if (keywords.includes(part)) score += 6;
    if (section.includes(part)) score += 4;
  }

  return score;
}

function createSearchUI() {
  const wrappers = document.querySelectorAll(".topbar-search");
  if (!wrappers.length) return;

  const siteRoot = getSiteRoot();

  wrappers.forEach((wrapper, index) => {
    const input = wrapper.querySelector("input");
    if (!input) return;

    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.id = `docsSearchInput-${index}`;

    let results = wrapper.querySelector(".search-results");
    if (!results) {
      results = document.createElement("div");
      results.className = "search-results";
      wrapper.appendChild(results);
    }

    function hideResults() {
      results.classList.remove("visible");
      results.innerHTML = "";
    }

    function initSidebarGroups() {
      const groups = document.querySelectorAll(".nav-group");
      if (!groups.length) return;

      groups.forEach((group) => {
        const toggle = group.querySelector(".nav-group-toggle");
        const links = group.querySelector(".nav-group-links");
        const activeLink = group.querySelector(".nav-link.active");

        if (!toggle || !links) return;

      function openGroup() {
        group.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        links.style.maxHeight = links.scrollHeight + "px";
        links.style.opacity = "1";
      }

      function closeGroup() {
        group.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        links.style.maxHeight = "0px";
        links.style.opacity = "0";
      }

      if (activeLink || group.classList.contains("is-open")) {
        openGroup();
      } else {
        closeGroup();
      }

      toggle.addEventListener("click", () => {
        if (group.classList.contains("is-open")) {
          closeGroup();
        } else {
          openGroup();
        }
      });
    });

    window.addEventListener("resize", () => {
      document.querySelectorAll(".nav-group.is-open .nav-group-links").forEach((links) => {
        links.style.maxHeight = links.scrollHeight + "px";
      });
    });
  }

    function showResults(matches, query) {
      if (!query.trim()) {
        hideResults();
        return;
      }

      if (!matches.length) {
        results.innerHTML = `
          <div class="search-result-empty">
            No results for "<strong>${query}</strong>"
          </div>
        `;
        results.classList.add("visible");
        return;
      }

      results.innerHTML = matches
        .slice(0, 8)
        .map((doc) => {
          const href = new URL(doc.path, siteRoot).href;
          return `
            <a class="search-result-item" href="${href}">
              <span class="search-result-section">${doc.section}</span>
              <strong>${doc.title}</strong>
            </a>
          `;
        })
        .join("");

      results.classList.add("visible");
    }

    input.addEventListener("input", () => {
      const query = input.value.trim();
      if (!query) {
        hideResults();
        return;
      }

      const matches = DOCS_INDEX
        .map((doc) => ({ doc, score: scoreDoc(doc, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.doc);

      showResults(matches, query);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideResults();
        input.blur();
        return;
      }

      if (event.key === "Enter") {
        const firstResult = results.querySelector(".search-result-item");
        if (firstResult) {
          window.location.href = firstResult.href;
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        hideResults();
      }
    });

    input.addEventListener("focus", () => {
      if (input.value.trim()) {
        input.dispatchEvent(new Event("input"));
      }
    });
  });
}

initSidebarGroups();
createSearchUI();