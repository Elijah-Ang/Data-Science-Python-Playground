(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const chapters = [
    {
      label: "Choose",
      title: "Start with a question.",
      mobile: "Choose a dataset at the top. Start with bike rentals and explore how demand changes through the day.",
      wide: "Choose a dataset in the top strip. The inspector, notebook and results all belong to the same working session.",
      focus: "selector",
      context: "One dataset. Plenty of questions."
    },
    {
      label: "Inspect",
      title: "Meet your data.",
      mobile: "Scroll into the inspector to see the size, columns and preview before you write any Python.",
      wide: "Look left for the inspector. Keep the dataset facts in view while you work in the notebook.",
      focus: "inspector",
      context: "Your original data stays available."
    },
    {
      label: "Follow",
      title: "A first step, ready for you.",
      mobile: "Find the suggested route below your cells and outputs. Tap a task such as Preview or Summary to keep going, or open More tasks for another question.",
      wide: "Find the suggested route above the notebook. Start with Preview or Summary, then use More tasks to explore another question.",
      focus: "route",
      context: "A starting point, not a fixed script."
    },
    {
      label: "Run",
      title: "A little Python. A new insight.",
      mobile: "Tap Run on a cell. Read its result directly underneath, then change the code and try again.",
      wide: "Run a cell in the notebook. Its table or chart appears in the output panel beside your code.",
      focus: "cell",
      context: "Edit → Run → Read → Repeat."
    },
    {
      label: "Guide",
      title: "A nudge when you need one.",
      mobile: "Tap the book button beside the switcher for Challenges. In the ML lab, the same button opens Workflow.",
      wide: "Use the book button beside the switcher for Challenges. In the ML lab, it opens the Workflow reference.",
      focus: "guide-sheet",
      context: "Help is there when you want it."
    },
    {
      label: "Evidence",
      title: "Make the result mean something.",
      mobile: "Follow the output below your cell. Read a table, inspect a chart, and explain the pattern you see.",
      wide: "Read the output beside the notebook. Compare the evidence with your question before you decide what to try next.",
      focus: "output",
      context: "For ML: validate first, final test last."
    },
    {
      label: "Explore",
      title: "Take your next question further.",
      mobile: "Tap ML in the HOME / DATA / ML switcher at the top. Choose your features and model, then follow the modelling workflow.",
      wide: "Select ML in the HOME / DATA / ML switcher. Move from exploring patterns to training and evaluating a model.",
      focus: "ml-sheet",
      context: "You’re ready to explore."
    }
  ];

  const captures = {
    mobile: {
      width: 390,
      height: 2161,
      compact: true,
      targets: [
        { x: 11, y: 97, w: 368, h: 53.484375 },
        { x: 11, y: 250.25, w: 368, h: 340 },
        { x: 10, y: 1863.90625, w: 370, h: 116.28125 },
        { x: 10, y: 1121.25, w: 370, h: 126.65625 },
        { x: 287, y: 40, w: 34, h: 34 },
        { x: 10, y: 1247.90625, w: 370, h: 380 },
        { x: 11, y: 37, w: 213, h: 40 }
      ],
      guide: { x: 16, y: 72, w: 358, h: 420 },
      ml: { x: 11, y: 37, w: 213, h: 40 }
    },
    tablet: {
      width: 1024,
      height: 1643,
      compact: true,
      targets: [
        { x: 11, y: 69, w: 1002, h: 37.25 },
        { x: 11, y: 206.015625, w: 1002, h: 340 },
        { x: 14, y: 1469.828125, w: 996, h: 93 },
        { x: 14, y: 889.171875, w: 996, h: 106.65625 },
        { x: 937, y: 12, w: 34, h: 34 },
        { x: 14, y: 995.828125, w: 996, h: 353 },
        { x: 716, y: 9, w: 213, h: 40 }
      ],
      guide: { x: 16, y: 72, w: 720, h: 420 },
      ml: { x: 716, y: 9, w: 213, h: 40 }
    },
    wide: {
      width: 1440,
      height: 1252,
      compact: false,
      targets: [
        { x: 18, y: 67, w: 361.203125, h: 37.25 },
        { x: 13, y: 209.015625, w: 230, h: 340 },
        { x: 278, y: 124.25, w: 1142, h: 81 },
        { x: 278, y: 322.25, w: 672.390625, h: 106.65625 },
        { x: 1348, y: 11, w: 34, h: 34 },
        { x: 968.390625, y: 320.25, w: 451.609375, h: 380 },
        { x: 1127, y: 8, w: 213, h: 40 }
      ],
      guide: { x: 16, y: 72, w: 760, h: 420 },
      ml: { x: 1127, y: 8, w: 213, h: 40 }
    },
    portrait: {
      width: 834,
      height: 1862,
      compact: true,
      targets: [
        { x: 11, y: 69, w: 812, h: 37.25 },
        { x: 11, y: 206.015625, w: 812, h: 340 },
        { x: 14, y: 1490.828125, w: 806, h: 93 },
        { x: 14, y: 889.171875, w: 806, h: 106.65625 },
        { x: 747, y: 12, w: 34, h: 34 },
        { x: 14, y: 995.828125, w: 806, h: 374 },
        { x: 526, y: 9, w: 213, h: 40 }
      ],
      guide: { x: 16, y: 72, w: 720, h: 420 },
      ml: { x: 526, y: 9, w: 213, h: 40 }
    }
  };

  const captureDirectory = "assets/tour-captures";
  const mode = new URLSearchParams(location.search).get("view") || "auto";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let key = "wide";
  let mobile = false;
  let index = -1;
  let pending = false;

  const nodes = chapters.map((chapter, chapterIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(chapterIndex + 1).padStart(2, "0");
    button.ariaLabel = `Feature ${chapterIndex + 1}: ${chapter.label}`;
    button.addEventListener("click", () => go(chapterIndex));
    $(".steps").append(button);
    return button;
  });

  function scrollHeight() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function go(chapterIndex) {
    const nextIndex = Math.max(0, Math.min(6, chapterIndex));
    window.scrollTo({
      top: nextIndex / 6 * scrollHeight(),
      behavior: reduced.matches ? "instant" : "smooth"
    });
  }

  $("#back").addEventListener("click", () => go(index - 1));
  $("#next").addEventListener("click", () => go(index === 6 ? 0 : index + 1));

  function chapterAt(chapterIndex) {
    return captures[key].compact ? [0, 1, 3, 5, 2, 4, 6][chapterIndex] : chapterIndex;
  }

  function target(chapterIndex) {
    const profile = captures[key];
    const mappedIndex = chapterAt(chapterIndex);
    return mappedIndex === 4 ? profile.guide : mappedIndex === 6 ? profile.ml : profile.targets[mappedIndex];
  }

  function captureName(chapterIndex) {
    const mappedIndex = chapterAt(chapterIndex);
    return mappedIndex === 4 ? "guide" : mappedIndex === 6 ? "ml" : "data";
  }

  function layout() {
    mobile = mode === "mobile" || (mode === "auto" && (
      window.innerWidth < 760 ||
      (window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth)
    ));
    key = mobile ? (window.innerWidth >= 700 ? "portrait" : "mobile") : (window.innerWidth <= 1120 ? "tablet" : "wide");
    document.body.dataset.layout = mobile ? "mobile" : "wide";
    $("#siteCapture").style.width = `${captures[key].width}px`;
    index = -1;
    render();
  }

  function pose(focus) {
    const viewport = $(".viewport");
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const scale = Math.min(mobile ? 1.12 : 1.4, (width - 32) / (focus.w + 12), (height - 40) / (focus.h + 12));
    return {
      scale,
      x: Math.min(12, (width - focus.w * scale) / 2 - focus.x * scale),
      y: Math.min(12, (height - focus.h * scale) / 2 - focus.y * scale)
    };
  }

  function render() {
    pending = false;
    const progress = Math.max(0, Math.min(6, window.scrollY / scrollHeight() * 6));
    const chapterIndex = Math.min(6, Math.round(progress));

    if (index !== chapterIndex) {
      index = chapterIndex;
      const mappedIndex = chapterAt(chapterIndex);
      const chapter = chapters[mappedIndex];
      const profile = captures[key];
      const capture = captureName(chapterIndex);
      $("#count").textContent = `FEATURE ${String(chapterIndex + 1).padStart(2, "0")} / 07 · ${chapter.label.toUpperCase()}`;
      $("#headline").textContent = chapter.title;
      let description = chapter[mobile ? "mobile" : "wide"];
      if (profile.compact) {
        if (mappedIndex === 1) description = "Read the inspector above your notebook. Check the dataset facts and columns before writing Python.";
        if (mappedIndex === 2) description = chapter.mobile;
        if (mappedIndex === 3) description = chapter.mobile;
        if (mappedIndex === 5) description = chapter.mobile;
      }
      $("#description").textContent = description;
      $("#context").textContent = chapter.context;
      $("#focusLabel").textContent = chapter.label.toUpperCase();
      $("#pageCount").textContent = `${chapterIndex + 1} / 7`;
      $("#pin").textContent = chapterIndex + 1;
      $("#back").disabled = chapterIndex === 0;
      $("#next").textContent = chapterIndex === 6 ? "Replay ↺" : "Next →";
      nodes.forEach((button, nodeIndex) => {
        const nodeChapter = chapters[chapterAt(nodeIndex)];
        button.ariaLabel = `Feature ${nodeIndex + 1}: ${nodeChapter.label}`;
        button.classList.toggle("active", nodeIndex === chapterIndex);
        if (nodeIndex === chapterIndex) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      const image = $("#siteCapture");
      image.src = `${captureDirectory}/${key}-${capture}.png?v=tour4`;
      image.alt = mappedIndex === 6 ? "Current Machine Learning setup" : `Current Data Playground${mappedIndex === 4 ? " with Challenges open" : ""}`;
    }

    let focus = target(chapterIndex);
    let position = pose(focus);
    if (!reduced.matches) {
      const lower = Math.floor(progress);
      const upper = Math.min(6, lower + 1);
      const blendAmount = progress - lower;
      const blend = blendAmount ** 2 * (3 - 2 * blendAmount);
      const lowerFocus = target(lower);
      const upperFocus = target(upper);
      const lowerPosition = pose(lowerFocus);
      const upperPosition = pose(upperFocus);
      position = {
        scale: lowerPosition.scale + (upperPosition.scale - lowerPosition.scale) * blend,
        x: lowerPosition.x + (upperPosition.x - lowerPosition.x) * blend,
        y: lowerPosition.y + (upperPosition.y - lowerPosition.y) * blend
      };
      focus = {
        x: lowerFocus.x + (upperFocus.x - lowerFocus.x) * blend,
        y: lowerFocus.y + (upperFocus.y - lowerFocus.y) * blend,
        w: lowerFocus.w + (upperFocus.w - lowerFocus.w) * blend,
        h: lowerFocus.h + (upperFocus.h - lowerFocus.h) * blend
      };
    }

    $("#camera").style.transform = `translate(${position.x}px, ${position.y}px) scale(${position.scale})`;
    Object.assign($("#spotlight").style, {
      left: `${position.x + focus.x * position.scale - 6}px`,
      top: `${position.y + focus.y * position.scale - 6}px`,
      width: `${focus.w * position.scale + 12}px`,
      height: `${focus.h * position.scale + 12}px`
    });
    $("#progress").style.width = `${(progress + 1) / 7 * 100}%`;
  }

  window.addEventListener("scroll", () => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(render);
  }, { passive: true });
  window.addEventListener("resize", layout);
  reduced.addEventListener("change", render);
  layout();
})();
