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
    title: "Custom Camos",
    path: "guides/camos/",
    keywords: "custom camo image png gif jpg jpeg properties animation images_reload",
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

// --- Image / Video Comparison Slider ---
function initSliders() {
  const containers = document.querySelectorAll('.cd-image-container');

  function updateLabelVisibility(optionEl, percentage, width) {
    const originalLabel = optionEl.querySelector('.cd-image-label[data-type="original"]');
    const modifiedLabel = optionEl.querySelector('.cd-image-label[data-type="modified"]');
    const resizeWidth = (percentage / 100) * width;

    if (originalLabel) {
      const offsetLeft = originalLabel.offsetLeft || 14;
      const labelRight = offsetLeft + originalLabel.offsetWidth;
      if (resizeWidth > labelRight) {
        originalLabel.classList.remove('is-hidden');
      } else {
        originalLabel.classList.add('is-hidden');
      }
    }

    if (modifiedLabel) {
      const offsetLeft = modifiedLabel.offsetLeft || (width - 14 - modifiedLabel.offsetWidth);
      if (resizeWidth < offsetLeft) {
        modifiedLabel.classList.remove('is-hidden');
      } else {
        modifiedLabel.classList.add('is-hidden');
      }
    }
  }

  containers.forEach(container => {
    const handle = container.querySelector('.cd-handle');
    if (!handle) return;

    let currentPercentage = 50;

    function updateMediaWidths(optionEl) {
      const w = container.offsetWidth;
      const resizeImg = optionEl.querySelector('.cd-resize-img');
      if (resizeImg) {
        const media = resizeImg.querySelector('img, video');
        if (media) {
          media.style.width = w + 'px';
        }
        resizeImg.style.width = currentPercentage + '%';
      }
      handle.style.left = currentPercentage + '%';
      updateLabelVisibility(optionEl, currentPercentage, w);
    }

    function initOption(optionEl) {
      const baseMedia = optionEl.querySelector('img, video');
      if (baseMedia) {
        if (baseMedia.tagName === 'IMG') {
          if (baseMedia.complete) {
            updateMediaWidths(optionEl);
          } else {
            baseMedia.addEventListener('load', () => updateMediaWidths(optionEl));
          }
        } else {
          baseMedia.addEventListener('loadedmetadata', () => updateMediaWidths(optionEl));
        }
      }

      const v1 = optionEl.querySelector('video:not(.cd-resize-img video)');
      const v2 = optionEl.querySelector('.cd-resize-img video');
      if (v1 && v2) {
        v1.addEventListener('play', () => {
          if (optionEl.classList.contains('active')) {
            v2.play().catch(() => { });
          }
        });
        v1.addEventListener('pause', () => v2.pause());
        v1.addEventListener('timeupdate', () => {
          if (Math.abs(v1.currentTime - v2.currentTime) > 0.15) {
            v2.currentTime = v1.currentTime;
          }
        });
      }
    }

    const options = container.querySelectorAll('.slider-option');
    options.forEach(opt => {
      initOption(opt);
    });

    window.addEventListener('resize', () => {
      const activeOpt = container.querySelector('.slider-option.active');
      if (activeOpt) {
        updateMediaWidths(activeOpt);
      }
    });

    let dragging = false;

    function startDrag(e) {
      container.classList.remove('initial-anim');
      container.classList.add('is-dragging');
      dragging = true;
      handle.classList.add('draggable');
      const activeOpt = container.querySelector('.slider-option.active');
      if (activeOpt) {
        const resizeImg = activeOpt.querySelector('.cd-resize-img');
        if (resizeImg) resizeImg.classList.add('resizable');
      }
      if (e.cancelable) e.preventDefault();
    }

    function stopDrag() {
      dragging = false;
      container.classList.remove('is-dragging');
      handle.classList.remove('draggable');
      const resizable = container.querySelector('.resizable');
      if (resizable) resizable.classList.remove('resizable');
    }

    function drag(e) {
      if (!dragging) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const xOffset = clientX - containerRect.left;

      currentPercentage = (xOffset / containerWidth) * 100;
      if (currentPercentage < 0) currentPercentage = 0;
      if (currentPercentage > 100) currentPercentage = 100;

      handle.style.left = currentPercentage + '%';

      const activeOpt = container.querySelector('.slider-option.active');
      if (activeOpt) {
        const resizeImg = activeOpt.querySelector('.cd-resize-img');
        if (resizeImg) {
          resizeImg.style.width = currentPercentage + '%';
        }
        updateLabelVisibility(activeOpt, currentPercentage, containerWidth);
      }
    }

    handle.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);

    handle.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', stopDrag);
  });

  const controlGroups = document.querySelectorAll('.slider-controls');
  controlGroups.forEach(controls => {
    const sliderId = controls.getAttribute('data-slider');
    const container = document.getElementById(sliderId);
    if (!container) return;

    const tabs = controls.querySelectorAll('.slider-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const optionName = tab.getAttribute('data-option');
        if (tab.classList.contains('active')) return;

        container.classList.remove('initial-anim');

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const options = container.querySelectorAll('.slider-option');
        options.forEach(opt => {
          const isTarget = opt.getAttribute('data-option') === optionName;

          if (isTarget) {
            opt.classList.add('active');

            const handle = container.querySelector('.cd-handle');
            if (handle) {
              const currentPercentage = parseFloat(handle.style.left) || 50;
              const resizeImg = opt.querySelector('.cd-resize-img');
              if (resizeImg) {
                resizeImg.style.width = currentPercentage + '%';
              }
              const w = container.offsetWidth;
              const media = resizeImg ? resizeImg.querySelector('img, video') : null;
              if (media) {
                media.style.width = w + 'px';
              }
              updateLabelVisibility(opt, currentPercentage, w);
            }

            const videos = opt.querySelectorAll('video');
            videos.forEach(v => {
              v.currentTime = 0;
              v.play().catch(() => { });
            });
          } else {
            opt.classList.remove('active');
            const videos = opt.querySelectorAll('video');
            videos.forEach(v => v.pause());
          }
        });
      });
    });
  });

  const propertiesSlider = document.getElementById('properties-slider');
  if (propertiesSlider) {
    const variants = ['N1', 'N2', 'N3'];
    let currentVariantIdx = 0;

    function cycleVariant() {
      const nextIdx = (currentVariantIdx + 1) % variants.length;
      const nextVariant = variants[nextIdx];

      const images = propertiesSlider.querySelectorAll('img:not(.camo-fade-overlay)');
      images.forEach(img => {
        const oldSrc = img.getAttribute('src');
        if (!oldSrc) return;
        const newSrc = oldSrc.replace(/_N\d\.png/g, `_${nextVariant}.png`);

        const overlay = document.createElement('img');
        overlay.src = newSrc;
        overlay.className = img.className + ' camo-fade-overlay';

        overlay.style.cssText = img.style.cssText;
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = img.offsetWidth + 'px';
        overlay.style.height = img.offsetHeight + 'px';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1';

        img.parentNode.insertBefore(overlay, img.nextSibling);

        overlay.offsetHeight;

        overlay.style.opacity = '1';

        setTimeout(() => {
          img.setAttribute('src', newSrc);
          overlay.remove();

          const activeOpt = propertiesSlider.querySelector('.slider-option.active');
          if (activeOpt) {
            const w = propertiesSlider.offsetWidth;
            const resizeImg = activeOpt.querySelector('.cd-resize-img');
            if (resizeImg) {
              const resizeMedia = resizeImg.querySelector('img');
              if (resizeMedia) {
                resizeMedia.style.width = w + 'px';
              }
            }
          }
        }, 400);
      });

      currentVariantIdx = nextIdx;
    }

    setInterval(cycleVariant, 4000);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.add('initial-anim');
        setTimeout(() => {
          entry.target.classList.remove('initial-anim');
        }, 800);

        const activeOpt = entry.target.querySelector('.slider-option.active');
        if (activeOpt) {
          const videos = activeOpt.querySelectorAll('video');
          videos.forEach(v => {
            v.play().catch(() => { });
          });
        }
      } else {
        const videos = entry.target.querySelectorAll('video');
        videos.forEach(v => {
          v.pause();
        });
      }
    });
  }, { threshold: 0.1 });

  containers.forEach(c => observer.observe(c));
}

initSidebarGroups();
createSearchUI();
initSliders();