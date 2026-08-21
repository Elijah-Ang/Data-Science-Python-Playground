/* Guided Learning runtime.
 *
 * The page intentionally keeps its curriculum in data rather than in the
 * renderer.  This file is the small application shell that turns that data
 * into a routed, checkpoint-based learning experience.  It is safe to load
 * before or after the curriculum script: the first render will show a useful
 * missing-curriculum state and a later `learningcurriculumready` event will
 * hydrate it.
 */
(() => {
  "use strict";

  const root = document.getElementById("learningApp");
  if (!root) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const PROGRESS_KEY = "dspy-guided-progress-v1";
  const THEME_KEY = "pythonds-theme";
  const PROGRESS_VERSION = 1;
  const TOPIC_ORDER = [
    "data-cleaning", "cleaning", "data_cleaning",
    "data-wrangling", "wrangling", "data_wrangling", "preprocessing",
    "data-visualization", "visualization", "visualisation", "viz",
    "machine-learning", "machine_learning", "ml"
  ];
  const PLANET_PALETTE = ["#f7a91b", "#46d5ff", "#b78cff", "#5de2b5"];
  const reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  const state = {
    progress: loadProgress(),
    route: null,
    datasetCache: new Map(),
    previewCache: new Map(),
    codes: new Map(),
    arrangements: new Map(),
    lastResults: new Map(),
    sessions: new Map(),
    selectedNodes: new Map(),
    currentResult: null,
    running: false,
    worker: null,
    workerPending: new Map(),
    workerSequence: 0,
    toastTimer: null,
    celebrationTimer: null,
    renderToken: 0,
    dragBlockId: null,
    runtimeError: null
  };

  function localGet(key) {
    try { return window.localStorage ? window.localStorage.getItem(key) : null; }
    catch (_) { return null; }
  }

  function localSet(key, value) {
    try { if (window.localStorage) window.localStorage.setItem(key, value); }
    catch (_) { /* Private browsing and file:// may not permit storage. */ }
  }

  function localRemove(key) {
    try { if (window.localStorage) window.localStorage.removeItem(key); }
    catch (_) { /* Storage is optional for this runtime. */ }
  }

  function freshProgress() {
    return { version: PROGRESS_VERSION, completed: {}, xp: 0 };
  }

  function loadProgress() {
    const fallback = freshProgress();
    const raw = localGet(PROGRESS_KEY);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      // Keep the original v1 storage shape readable.  Newer runtimes only
      // add transient lesson-session state, so an older progress record can
      // safely continue without a migration prompt.
      if (!parsed || typeof parsed.completed !== "object") return fallback;
      const completed = {};
      Object.entries(parsed.completed).forEach(([topicId, values]) => {
        if (Array.isArray(values)) completed[String(topicId)] = [...new Set(values.map(String))];
      });
      return { version: PROGRESS_VERSION, completed, xp: Number.isFinite(Number(parsed.xp)) ? Math.max(0, Number(parsed.xp)) : 0 };
    } catch (_) {
      return fallback;
    }
  }

  function saveProgress() {
    localSet(PROGRESS_KEY, JSON.stringify({
      version: PROGRESS_VERSION,
      completed: state.progress.completed,
      xp: state.progress.xp
    }));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    const url = String(value || "");
    if (!url) return "#";
    if (/^(?:https?:|\.\.?\/|\/|data:)/i.test(url)) return url;
    if (/^[a-z0-9][a-z0-9._/-]*(?:[?#][^\s]*)?$/i.test(url)) return url;
    return "#";
  }

  function slug(value) {
    return String(value || "")
      .trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function titleOf(item, fallback = "Untitled") {
    return String(item?.title || item?.name || item?.label || fallback);
  }

  function getCurriculum() {
    const value = window.LEARNING_CURRICULUM;
    if (!value || typeof value !== "object") return null;
    return value;
  }

  function rawTopics() {
    const curriculum = getCurriculum();
    if (!curriculum) return [];
    const values = Array.isArray(curriculum.topics) ? curriculum.topics : Object.values(curriculum.topics || {});
    return values.filter(Boolean).map((topic, index) => ({
      ...topic,
      id: String(topic.id || topic.slug || slug(topic.title || topic.name) || `topic-${index + 1}`)
    }));
  }

  function isStatisticalTopic(topic) {
    return /statistical|statistics/i.test(`${topic?.id || ""} ${titleOf(topic, "")}`);
  }

  function topicsForHub() {
    const topics = rawTopics().filter(topic => !isStatisticalTopic(topic));
    const ordered = [];
    TOPIC_ORDER.forEach(candidate => {
      const found = topics.find(topic => topic.id.toLowerCase() === candidate || slug(titleOf(topic, "")) === candidate);
      if (found && !ordered.includes(found)) ordered.push(found);
    });
    topics.forEach(topic => { if (!ordered.includes(topic)) ordered.push(topic); });
    return ordered.slice(0, 4);
  }

  function topicById(id) {
    const value = String(id || "");
    return rawTopics().find(topic => topic.id === value || slug(titleOf(topic, "")) === value) || null;
  }

  function lessonsOf(topic) {
    const lessons = Array.isArray(topic?.lessons) ? topic.lessons : Object.values(topic?.lessons || {});
    return lessons.filter(Boolean).map((lesson, index) => ({
      ...lesson,
      id: String(lesson.id || lesson.slug || slug(lesson.title || lesson.name) || `${topic.id}-lesson-${index + 1}`),
      stage: normalizeStage(lesson.stage, index, lessons.length)
    }));
  }

  function normalizeStage(stage, index, total) {
    const raw = String(stage || "").trim().toLowerCase();
    if (raw.includes("integrated") || raw.includes("final") || raw.includes("challenge")) return "Integrated Final Challenge";
    if (raw.includes("advanced")) return "Advanced";
    if (raw.includes("intermediate")) return "Intermediate";
    if (raw.includes("basic") || raw.includes("beginner")) return "Basic";
    if (total > 0 && index >= total - 1) return "Integrated Final Challenge";
    if (total > 3 && index >= Math.ceil(total * 0.65)) return "Advanced";
    if (total > 2 && index >= Math.ceil(total * 0.35)) return "Intermediate";
    return "Basic";
  }

  function progressFor(topicId) {
    const values = state.progress.completed?.[String(topicId)];
    return new Set(Array.isArray(values) ? values.map(String) : []);
  }

  function lessonState(topic, lesson, index) {
    const completed = progressFor(topic.id);
    if (completed.has(lesson.id)) return "completed";
    const lessons = lessonsOf(topic);
    const prior = lessons.slice(0, index);
    if (prior.every(item => completed.has(item.id))) return "current";
    return "locked";
  }

  function lockReason(topic, index) {
    const lessons = lessonsOf(topic);
    if (index <= 0) return "Complete the previous checkpoint to unlock this lesson.";
    const completed = progressFor(topic.id);
    const previous = lessons[index - 1];
    return `Complete “${titleOf(previous, "the previous checkpoint")}” to unlock this lesson.`;
  }

  function destinationFor(topic) {
    const source = topic?.destination || {};
    const value = typeof source === "string" ? { kind: source } : source;
    const rawKind = String(value.kind || value.type || topic?.planet?.destination || "star").toLowerCase();
    const kind = rawKind === "solar-system" ? "solar" : rawKind;
    const names = { star: "The Knowledge Star", planet: "The New World", galaxy: "The Data Galaxy", solar: "The Learning System", system: "The Learning System", nebula: "The Insight Nebula" };
    return {
      kind,
      title: String(value.title || value.label || names[kind] || "The Final Destination"),
      description: String(value.description || value.copy || "A final challenge awaits at the edge of the route.")
    };
  }

  function planetMeta(topic, index) {
    const source = typeof topic?.planet === "string" ? { kind: topic.planet } : (topic?.planet || {});
    const kind = String(source.kind || source.type || slug(titleOf(topic, "planet")) || "planet");
    const color = String(source.accent || source.color || PLANET_PALETTE[index % PLANET_PALETTE.length]);
    return { kind, color: /^#[0-9a-f]{3,8}$/i.test(color) ? color : PLANET_PALETTE[index % PLANET_PALETTE.length], texture: String(source.texture || "grid") };
  }

  function topicProgress(topic) {
    const lessons = lessonsOf(topic);
    const completed = progressFor(topic.id);
    const count = lessons.filter(item => completed.has(item.id)).length;
    return { count, total: lessons.length, percent: lessons.length ? Math.round(count / lessons.length * 100) : 0 };
  }

  function planetArtKind(topic, index = 0) {
    const id = slug(topic?.id || titleOf(topic, ""));
    if (/clean/.test(id)) return "cleaning";
    if (/wrang|preprocess/.test(id)) return "wrangling";
    if (/visual|viz/.test(id)) return "visualization";
    if (/machine|learn|^ml/.test(id)) return "machine-learning";
    return ["cleaning", "wrangling", "visualization", "machine-learning"][index % 4];
  }

  function planetArt(topic, index) {
    const kind = planetArtKind(topic, index);
    const arts = {
      cleaning: `<span class="planet-art planet-art--cleaning" aria-hidden="true"><span class="planet-body"><i class="planet-surface"></i><i class="planet-crater planet-crater--one"></i><i class="planet-crater planet-crater--two"></i><i class="planet-crater planet-crater--three"></i><i class="planet-ridge"></i></span><i class="planet-fragment planet-fragment--one"></i><i class="planet-fragment planet-fragment--two"></i><i class="planet-atmosphere"></i></span>`,
      wrangling: `<span class="planet-art planet-art--wrangling" aria-hidden="true"><i class="planet-ring planet-ring--back"></i><span class="planet-body"><i class="planet-band planet-band--one"></i><i class="planet-band planet-band--two"></i><i class="planet-band planet-band--three"></i><i class="planet-storm"></i></span><i class="planet-ring planet-ring--front"></i><i class="planet-atmosphere"></i></span>`,
      visualization: `<span class="planet-art planet-art--visualization" aria-hidden="true"><span class="planet-body"><i class="planet-swirl planet-swirl--one"></i><i class="planet-swirl planet-swirl--two"></i><i class="planet-swirl planet-swirl--three"></i><i class="planet-aurora"></i></span><i class="planet-constellation planet-constellation--one"></i><i class="planet-constellation planet-constellation--two"></i><i class="planet-atmosphere"></i></span>`,
      "machine-learning": `<span class="planet-art planet-art--machine-learning" aria-hidden="true"><i class="planet-orbit planet-orbit--one" style="min-height:0;animation:none"></i><i class="planet-orbit planet-orbit--two" style="min-height:0;animation:none"></i><span class="planet-body"><i class="planet-circuit planet-circuit--one"></i><i class="planet-circuit planet-circuit--two"></i><i class="planet-node planet-node--one"></i><i class="planet-node planet-node--two"></i><i class="planet-node planet-node--three"></i></span><i class="planet-moon"></i><i class="planet-atmosphere"></i></span>`
    };
    return arts[kind] || arts.cleaning;
  }

  function parseRoute() {
    const raw = String(window.location.hash || "").replace(/^#/, "");
    if (!raw || raw === "hub") return { type: "hub" };
    const parts = raw.split("/").filter(Boolean).map(part => {
      try { return decodeURIComponent(part); } catch (_) { return part; }
    });
    if (parts[0] === "journey" && parts[1]) {
      return { type: "journey", topicId: parts[1] };
    }
    if (parts[0] === "lesson" && parts[1] && parts[2]) {
      return { type: "lesson", topicId: parts[1], lessonId: parts.slice(2).join("/") };
    }
    return { type: "hub" };
  }

  function routeHash(type, topicId = "", lessonId = "") {
    if (type === "journey") return `#journey/${encodeURIComponent(topicId)}`;
    if (type === "lesson") return `#lesson/${encodeURIComponent(topicId)}/${encodeURIComponent(lessonId)}`;
    return "#hub";
  }

  function navigate(type, topicId = "", lessonId = "") {
    const next = routeHash(type, topicId, lessonId);
    if (window.location.hash === next) render();
    else window.location.hash = next;
  }

  function focusAfterRender() {
    window.requestAnimationFrame(() => {
      // A hash route can be opened from a deeply scrolled planet or checkpoint.
      // Reset the viewport before focusing the new view so mobile navigation
      // never inherits the previous screen's scroll position.
      if (typeof window.scrollTo === "function") {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: reducedMotionQuery?.matches ? "auto" : "instant" });
        } catch (_) {
          window.scrollTo(0, 0);
        }
      }
      const target = root.querySelector("[data-autofocus]") || root;
      const naturallyFocusable = typeof target.matches === "function" && target.matches("a[href], button, input, select, textarea, [tabindex]");
      if (!naturallyFocusable && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    });
  }

  function focusInteraction(selector, block = "center") {
    window.requestAnimationFrame(() => {
      const target = root.querySelector(selector);
      if (!target) return;
      const naturallyFocusable = typeof target.matches === "function" && target.matches("a[href], button, input, select, textarea, [tabindex]");
      if (!naturallyFocusable && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (typeof target.scrollIntoView === "function") {
        try { target.scrollIntoView({ behavior: reducedMotionQuery?.matches ? "auto" : "smooth", block, inline: "nearest" }); }
        catch (_) { target.scrollIntoView(); }
      }
    });
  }

  function announce(message, tone = "info") {
    const toast = document.getElementById("toast");
    const live = root.querySelector("[data-runtime-live]");
    if (live) live.textContent = message;
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => { toast.hidden = true; }, tone === "error" ? 7000 : 4200);
  }

  function showCelebration(topic, lesson) {
    const celebration = document.getElementById("celebration");
    const reduced = Boolean(reducedMotionQuery?.matches);
    if (!celebration) {
      announce(`Final destination reached: ${titleOf(topic)} complete!`, "success");
      return;
    }
    celebration.innerHTML = `<div class="celebration-card" role="dialog" aria-modal="true" aria-labelledby="celebrationTitle">
      <div class="celebration-orbit" aria-hidden="true">✦</div>
      <p class="eyebrow">MISSION COMPLETE</p>
      <h2 id="celebrationTitle">${escapeHtml(destinationFor(topic).title)}</h2>
      <p>${escapeHtml(titleOf(lesson, "The final challenge"))} is in your logbook. The next stop is the playground.</p>
      <div class="celebration-actions"><button type="button" class="button button-primary" data-action="dismiss-celebration" data-autofocus>Continue exploring</button><a class="button button-secondary" href="${escapeHtml(safeUrl(topic.playgroundHref || topic.playground || "playground.html"))}">Open playground</a></div>
    </div>`;
    celebration.hidden = false;
    celebration.dataset.reducedMotion = reduced ? "true" : "false";
    celebration.classList.toggle("is-animated", !reduced);
    document.body.classList.add("is-celebrating");
    window.clearTimeout(state.celebrationTimer);
    state.celebrationTimer = window.setTimeout(() => {
      const button = celebration.querySelector("[data-autofocus]");
      if (button) button.focus();
    }, 0);
  }

  function hideCelebration() {
    const celebration = document.getElementById("celebration");
    if (celebration) { celebration.hidden = true; celebration.innerHTML = ""; }
    document.body.classList.remove("is-celebrating");
  }

  function resetGuidedProgress() {
    if (!window.confirm("Reset all Guided Learning progress and XP? This cannot be undone.")) return;
    state.progress = freshProgress();
    saveProgress();
    state.lastResults.clear();
    state.arrangements.clear();
    state.codes.clear();
    state.sessions.clear();
    state.selectedNodes.clear();
    hideCelebration();
    announce("Guided Learning progress reset.", "info");
    render();
  }

  function applyTheme(theme, persist = true) {
    const light = theme !== "dark";
    document.body.dataset.theme = light ? "light" : "dark";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    const button = document.getElementById("themeButton");
    const icon = document.getElementById("themeIcon");
    if (button) button.setAttribute("aria-label", `Switch to ${light ? "dark" : "light"} theme`);
    if (icon) icon.innerHTML = light
      ? '<path d="M20 15.3A8.5 8.5 0 1 1 8.7 4 8.5 8.5 0 0 0 20 15.3z"></path>'
      : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
    if (persist) localSet(THEME_KEY, light ? "light" : "dark");
  }

  function initTheme() {
    applyTheme(localGet(THEME_KEY) === "dark" ? "dark" : "light", false);
    const button = document.getElementById("themeButton");
    if (!button || button.dataset.runtimeBound === "true") return;
    button.dataset.runtimeBound = "true";
    button.addEventListener("click", () => applyTheme(document.body.dataset.theme === "light" ? "dark" : "light"));
  }

  function renderMissingCurriculum() {
    root.dataset.view = "error";
    root.innerHTML = `<section class="learning-empty panel" data-autofocus aria-labelledby="learningErrorTitle">
      <span class="planet-glitch" aria-hidden="true">?</span>
      <p class="eyebrow">GUIDED LEARNING / SIGNAL LOST</p>
      <h1 id="learningErrorTitle">Curriculum unavailable</h1>
      <p>Learning data did not arrive with this page. Reload after starting the local server, or check that the curriculum script is loaded before <code>learning-app.js</code>.</p>
      <p class="runtime-guidance">If the address begins with <code>file://</code>, open the project through a local HTTP server so datasets and the Pyodide worker can load.</p>
      <button type="button" class="button button-primary" data-action="retry-runtime" data-autofocus>Retry curriculum</button>
      <div class="runtime-live" data-runtime-live aria-live="polite"></div>
    </section>`;
    focusAfterRender();
  }

  function renderHub() {
    const topics = topicsForHub();
    root.dataset.view = "hub";
    if (!topics.length) return renderMissingCurriculum();
    const cards = topics.map((topic, index) => {
      const meta = planetMeta(topic, index);
      const progress = topicProgress(topic);
      const lessons = lessonsOf(topic);
      const next = lessons.find((lesson, lessonIndex) => lessonState(topic, lesson, lessonIndex) !== "completed");
      const label = `${titleOf(topic)} planet. ${progress.count} of ${progress.total} checkpoints complete.${next ? ` Next: ${titleOf(next)}.` : " Journey complete."}`;
      const artKind = planetArtKind(topic, index);
      return `<article class="planet-orbit planet-orbit--${escapeHtml(artKind)}" role="listitem" data-topic="${escapeHtml(topic.id)}" data-state="${progress.percent === 100 ? "complete" : "available"}" style="--planet-accent:${escapeHtml(meta.color)};--planet-delay:${index * 0.7}s;--planet-texture:${escapeHtml(meta.texture)}">
        <button type="button" class="planet-button planet" data-action="go-journey" data-topic="${escapeHtml(topic.id)}" aria-controls="journeyView" aria-label="${escapeHtml(label)}">${planetArt(topic, index)}
          <span class="planet-label planet-copy"><strong>${escapeHtml(titleOf(topic))}</strong><small>${escapeHtml(String(topic.subtitle || topic.description || "A focused data-science learning route."))}</small></span><span class="planet-meta"><span>${progress.count}/${progress.total} lessons</span><span>·</span><span>${progress.percent === 100 ? "journey complete" : next ? `next: ${titleOf(next)}` : "ready to begin"}</span></span><span class="planet-progress" aria-hidden="true"><span style="width:${progress.percent}%"></span></span>
        </button>
      </article>`;
    }).join("");
    const totalLessons = topics.reduce((sum, topic) => sum + lessonsOf(topic).length, 0);
    const totalDone = topics.reduce((sum, topic) => sum + topicProgress(topic).count, 0);
    root.innerHTML = `<section class="view hub-view" id="hubView" data-view="hub" aria-labelledby="hubTitle"><div class="guided-cosmos" data-scene="hub"><div class="ambient-systems" aria-hidden="true"><i class="ambient-star ambient-star--one"></i><i class="ambient-star ambient-star--two"></i><i class="ambient-star ambient-star--three"></i><i class="ambient-star ambient-star--four"></i><i class="ambient-star ambient-star--five"></i><i class="ambient-star ambient-star--six"></i><i class="ambient-dust ambient-dust--one"></i><i class="ambient-dust ambient-dust--two"></i><span class="ambient-system ambient-system--one"><i></i><i></i><i></i></span><span class="ambient-system ambient-system--two"><i></i><i></i><i></i></span><span class="ambient-arc ambient-arc--one"></span><span class="ambient-arc ambient-arc--two"></span></div>
      <div class="hub-intro" data-autofocus><span class="eyebrow"><span aria-hidden="true">//</span> guided learning</span><h1 id="hubTitle">CHOOSE A LEARNING PLANET</h1></div>
      <div class="planet-field" role="list" aria-label="Guided Learning planets">${cards}</div>
      <div class="hub-progress-note" aria-label="Guided Learning progress"><span>${totalDone} of ${totalLessons} lessons complete</span><span class="hub-xp">${state.progress.xp} XP</span></div><div class="runtime-live" data-runtime-live aria-live="polite"></div></div></section>`;
    focusAfterRender();
  }

  function stageChips(activeStage) {
    return ["Basic", "Intermediate", "Advanced", "Integrated Final Challenge"].map(stage => `<span class="stage-chip${stage === activeStage ? " is-active" : ""}">${escapeHtml(stage)}</span>`).join("");
  }

  function unitGroups(topic, lessons) {
    const groups = [];
    const byKey = new Map();
    lessons.forEach((lesson, index) => {
      const rawUnit = lesson.unit ?? lesson.unitIndex ?? Math.floor(index / 4) + 1;
      const key = String(rawUnit);
      if (!byKey.has(key)) {
        const group = { key, number: groups.length + 1, title: String(lesson.unitTitle || `Orbit ${groups.length + 1}`), lessons: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      const group = byKey.get(key);
      if (lesson.unitTitle && group.title.startsWith("Orbit ")) group.title = String(lesson.unitTitle);
      group.lessons.push({ lesson, index });
    });
    return groups;
  }

  function lessonIcon(lesson, index) {
    const value = String(lesson?.icon || lesson?.activityIcon || "").toLowerCase();
    if (/challenge|final/.test(value) || /final|integrated/.test(String(lesson?.stage || "").toLowerCase())) return "★";
    if (/inspect|read|look/.test(value)) return "⌕";
    if (/block|arrange/.test(value)) return "▦";
    if (/code|write|free/.test(value)) return "⌘";
    if (/review|recap/.test(value)) return "↺";
    return ["✦", "◒", "⌁", "✧", "◈", "●"][index % 6];
  }

  function renderJourney(topic) {
    const lessons = lessonsOf(topic);
    const destination = destinationFor(topic);
    const progress = topicProgress(topic);
    const completed = progressFor(topic.id);
    root.dataset.view = "journey";
    if (!lessons.length) {
      root.innerHTML = `<section class="learning-empty panel" data-autofocus><button type="button" class="button button-quiet" data-action="go-hub">← Hub</button><p class="eyebrow">JOURNEY UNCHARTED</p><h1>${escapeHtml(titleOf(topic))}</h1><p>This planet has no checkpoints yet.</p></section>`;
      focusAfterRender();
      return;
    }
    const groups = unitGroups(topic, lessons);
    // A journey opens as a map, not as a lesson dashboard.  Selection is an
    // explicit action only; never silently select the first incomplete node.
    const selectedId = state.selectedNodes.get(topic.id) || null;
    const selectedIndex = selectedId ? lessons.findIndex(lesson => lesson.id === selectedId) : -1;
    const selectedLesson = selectedIndex >= 0 ? lessons[selectedIndex] : null;
    const points = groups.map(group => {
      const items = group.lessons.map(({ lesson, index }) => {
        const currentState = lessonState(topic, lesson, index);
        const isSelected = selectedLesson?.id === lesson.id;
        const plan = activityPlan(lesson);
        const reason = currentState === "locked" ? lockReason(topic, index) : `${currentState === "completed" ? "Review" : "Start"} ${titleOf(lesson)}`;
        const stateClass = currentState === "completed" ? "is-completed is-complete" : currentState === "current" ? "is-current is-available" : "is-locked";
        const selectedClass = isSelected ? " is-selected" : "";
        const nodeLabel = `${titleOf(lesson)}. ${reason}. ${lesson.xp || 25} experience points.`;
        const planCopy = `${plan.total} activities · ${plan.learn} learn/check · ${plan.build} build · ${plan.review} review`;
        const popover = isSelected ? `<div class="lesson-popover is-open" id="popover-${escapeHtml(slug(lesson.id))}" role="region" aria-label="${escapeHtml(titleOf(lesson))} details"><button type="button" class="popover-close" data-action="deselect-lesson" data-topic="${escapeHtml(topic.id)}" aria-label="Close lesson details">×</button><span class="popover-stage">${escapeHtml(lesson.stage || "Lesson")}</span><h3>${escapeHtml(titleOf(lesson))}</h3><p>${escapeHtml(lesson.subtitle || lesson.description || "Learn a concept, practise it, and keep the result.")}</p><span class="popover-meta">${escapeHtml(lesson.minutes || 8)} min · +${escapeHtml(lesson.xp || 25)} XP · ${escapeHtml(planCopy)}</span><div class="popover-actions">${currentState === "locked" ? `<button type="button" class="button button-quiet popover-lock" data-action="locked-lesson" data-topic="${escapeHtml(topic.id)}" data-lesson="${escapeHtml(lesson.id)}">Locked</button>` : `<button type="button" class="button button-primary popover-start" data-action="start-lesson" data-topic="${escapeHtml(topic.id)}" data-lesson="${escapeHtml(lesson.id)}">${currentState === "completed" ? "Review lesson" : "Start lesson"}<span aria-hidden="true">→</span></button>`}</div></div>` : "";
        return `<li class="path-node ${stateClass}${selectedClass}" data-checkpoint="${index + 1}" data-level="${escapeHtml(slug(lesson.stage))}" data-state="${currentState}" data-position="${index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right"}"><button type="button" class="node-button" data-action="select-lesson" data-topic="${escapeHtml(topic.id)}" data-lesson="${escapeHtml(lesson.id)}" aria-label="${escapeHtml(nodeLabel)}" aria-expanded="${isSelected ? "true" : "false"}"${isSelected ? ` aria-controls="popover-${escapeHtml(slug(lesson.id))}"` : ""}><span class="node-orb" aria-hidden="true"><span class="node-icon">${currentState === "completed" ? "✓" : lessonIcon(lesson, index)}</span></span><span class="node-copy"><b>LESSON ${String(index + 1).padStart(2, "0")}</b><strong>${escapeHtml(titleOf(lesson))}</strong><small>${escapeHtml(lesson.stage || "Lesson")} · ${escapeHtml(lesson.minutes || 8)} min</small></span></button>${popover}</li>`;
      }).join("");
      return `<li class="path-unit" data-unit="${escapeHtml(group.key)}"><div class="unit-banner"><span class="unit-number">UNIT ${String(group.number).padStart(2, "0")}</span><strong>${escapeHtml(group.title)}</strong><small>${group.lessons.filter(item => completed.has(item.lesson.id)).length}/${group.lessons.length} complete</small></div><ol class="learning-path" aria-label="${escapeHtml(group.title)} lessons">${items}</ol></li>`;
    }).join("");
    const finalTitle = destination.title;
    const firstIncomplete = lessons.findIndex((lesson, index) => lessonState(topic, lesson, index) !== "completed");
    const launchLesson = lessons[Math.max(0, firstIncomplete)] || lessons[0];
    const launchPlan = launchLesson ? activityPlan(launchLesson) : { total: 0, learn: 0, build: 0, review: 0 };
    root.innerHTML = `<section class="view journey-view" id="journeyView" data-view="journey" data-topic="${escapeHtml(topic.id)}" aria-labelledby="journeyTitle"><header class="journey-head"><button type="button" class="back-button back-link" data-action="go-hub" data-autofocus><span aria-hidden="true">←</span> learning planets</button><div class="journey-title-block"><span class="eyebrow"><span aria-hidden="true">//</span> ${escapeHtml(topic.shortTitle || "guided route")}</span><h2 id="journeyTitle">${escapeHtml(topic.journeyTitle || titleOf(topic))}</h2><p data-journey-copy>${escapeHtml(topic.journeyDescription || topic.description || "Take one lesson at a time; each node is one focused lesson.")}</p></div><div class="journey-progress"><span class="status-chip is-live"><i aria-hidden="true"></i><span data-journey-status>${progress.percent === 100 ? "DESTINATION REACHED" : "IN FLIGHT"}</span></span><strong><span data-journey-complete>${progress.count}</span> / <span data-journey-total>${progress.total}</span> lessons</strong><div class="progress-meter" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}"><span data-progress-fill style="width:${progress.percent}%"></span></div></div></header><div class="journey-route-intro"><span class="route-intro-label">${escapeHtml(launchLesson?.stage || "BASIC → INTEGRATED")}</span><span>Choose a node to begin ${launchPlan.total ? escapeHtml(`${launchPlan.total}-activity lesson · ${launchPlan.learn} learn/check · ${launchPlan.build} build · ${launchPlan.review} review`) : "a focused lesson"}.</span><a class="button button-secondary" href="${escapeHtml(safeUrl(topic.playgroundHref || topic.playground || "playground.html"))}">open playground <span aria-hidden="true">↗</span></a></div><div class="journey-map" aria-label="${escapeHtml(titleOf(topic))} learning route"><div class="route-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="route-thread route-thread--one" aria-hidden="true"></div><div class="route-thread route-thread--two" aria-hidden="true"></div><div class="journey-launch"><button type="button" class="launch-marker" data-action="start-lesson" data-topic="${escapeHtml(topic.id)}" data-lesson="${escapeHtml(launchLesson?.id || "")}" aria-label="Start at ${escapeHtml(launchLesson ? titleOf(launchLesson) : "first lesson")}"><span>START</span><i aria-hidden="true"></i></button></div><ol class="path-units" aria-label="Journey units">${points}</ol><div class="journey-destination destination-${escapeHtml(destination.kind)} destination-${escapeHtml(topic.id)}" data-destination="${escapeHtml(topic.id)}" aria-label="Final destination: ${escapeHtml(finalTitle)}"><div class="destination-orb destination-visual"><span></span><i></i></div><div class="destination-copy"><span>DESTINATION</span><strong>${escapeHtml(finalTitle)}</strong><small>${escapeHtml(destination.description)}</small></div></div></div><div class="journey-legend" aria-label="Lesson status"><span><i class="legend-dot completed"></i> completed</span><span><i class="legend-dot current"></i> current</span><span><i class="legend-dot locked"></i> upcoming</span></div><div class="runtime-live" data-runtime-live aria-live="polite"></div></section>`;
    focusAfterRender();
  }

  function exerciseType(lesson) {
    const type = String(lesson?.exercise?.type || lesson?.type || "free").toLowerCase();
    if (/(arrange|order|block)/.test(type)) return "arrange";
    if (/(modify|edit)/.test(type)) return "modify";
    if (/(complete|fill|partial)/.test(type)) return "complete";
    return "free";
  }

  function activityType(activity) {
    const type = String(activity?.type || activity?.kind || "free-code").toLowerCase();
    if (/output[-_ ]?observation|observe|show-output|output-check/.test(type)) return "output-observation";
    if (/demonstrate|show-example|example/.test(type)) return "demonstrate";
    if (/^teach|explain/.test(type)) return "teach";
    if (/choice|quiz|select/.test(type)) return "choice";
    if (/arrange|order|block/.test(type)) return "arrange";
    if (/modify|edit/.test(type)) return "modify";
    if (/complete|fill|partial/.test(type)) return "complete";
    if (/recap|review|summary/.test(type)) return "recap";
    return "free-code";
  }

  function activityPhase(activity) {
    const explicit = String(activity?.phase || "").toLowerCase();
    if (explicit === "review" || /review|recap|retrieval/.test(explicit)) return "review";
    if (/arrange|complete|modify|free-code|build|code/.test(explicit || String(activity?.type || "").toLowerCase())) return "build";
    return "learn";
  }

  function activityPlan(lesson) {
    const activities = lessonActivities(lesson);
    const counts = activities.reduce((result, activity) => {
      const phase = activityPhase(activity);
      result[phase] += 1;
      return result;
    }, { learn: 0, build: 0, review: 0 });
    return { total: activities.length, ...counts };
  }

  function activityPlanCopy(lesson) {
    const plan = activityPlan(lesson);
    return `${plan.total} activities · ${plan.learn} learn/check · ${plan.build} build · ${plan.review} review`;
  }

  function lessonActivities(lesson) {
    if (Array.isArray(lesson?.activities) && lesson.activities.length) return lesson.activities.map((activity, index) => ({ ...activity, type: activityType(activity), index }));
    const activities = [];
    if (lesson?.teaching) {
      const teaching = lesson.teaching;
      activities.push({ type: "teach", title: teaching?.title || teaching?.concept || "The idea", body: teaching?.body || teaching?.text || teaching?.explanation || (typeof teaching === "string" ? teaching : "Start with the idea, then make the data prove it."), points: teaching?.points || teaching?.bullets || [] });
    }
    if (lesson?.exercise || lesson?.starterCode || lesson?.prompt) activities.push({ ...(lesson.exercise || {}), type: activityType(lesson.exercise || lesson), prompt: lesson.exercise?.prompt || lesson.prompt, starterCode: lesson.exercise?.starterCode ?? lesson.starterCode, blocks: lesson.exercise?.blocks || lesson.blocks, solution: lesson.exercise?.solution || lesson.solution, hint: lesson.exercise?.hint || lesson.hint, expected: lesson.exercise?.expected || lesson.expected, validator: lesson.exercise?.validator || lesson.validator, setup: lesson.exercise?.setup || lesson.setup, dataset: lesson.exercise?.dataset || lesson.dataset });
    if (!activities.length) activities.push({ type: "teach", title: titleOf(lesson), body: lesson.subtitle || "Learn the concept, then practise it." });
    return activities.map((activity, index) => ({ ...activity, type: activityType(activity), index }));
  }

  function activityData(lesson, activity = null) {
    const source = activity || lesson?.exercise || lesson || {};
    const type = activityType(source);
    const fallbackTitle = type === "choice" ? "Choose the best answer" : type === "demonstrate" ? "See the move" : type === "output-observation" ? "Read the output" : "Practice";
    return {
      type,
      phase: source.phase || "",
      scaffold: Number.isFinite(Number(source.scaffold)) ? Number(source.scaffold) : null,
      roundLabel: source.roundLabel || "",
      prompt: source.prompt || source.question || lesson.prompt || "Complete the checkpoint task.",
      starterCode: String(source.starterCode ?? source.code ?? lesson.starterCode ?? ""),
      blocks: Array.isArray(source.blocks) ? source.blocks : [],
      hint: source.hint || lesson.hint || "Read the table first, then make one small change at a time.",
      solution: source.solution || source.modelAnswer || lesson.solution || "",
      expected: source.expected || lesson.expected || null,
      validator: source.validator ?? lesson.validator ?? "",
      setup: String(source.setup ?? lesson.setup ?? ""),
      dataset: source.dataset ?? source.datasetId ?? lesson.dataset ?? lesson.datasetId,
      title: source.title || source.concept || fallbackTitle,
      body: source.body || source.text || source.explanation || "",
      points: Array.isArray(source.points || source.bullets) ? (source.points || source.bullets) : [],
      options: Array.isArray(source.options) ? source.options.map(option => typeof option === "object" ? { ...option, label: String(option.label || option.text || option.value || "Option") } : { label: String(option) }) : [],
      answer: source.answer ?? source.correct ?? source.correctAnswer ?? 0,
      answerIndex: Number.isFinite(Number(source.answerIndex)) ? Number(source.answerIndex) : (Number.isFinite(Number(source.answer ?? source.correct ?? source.correctAnswer)) ? Number(source.answer ?? source.correct ?? source.correctAnswer) : 0),
      explanation: source.explanation || source.feedback || "Read the explanation, then try the next step.",
      failure: source.failure || source.incorrect || "Read the prompt again and try another option.",
      observationPrompt: source.observationPrompt || "What evidence should you notice?",
      observation: source.observation || source.output || source.outputContext || "Inspect the result and connect it to the checkpoint.",
      outputContext: source.outputContext || source.output || source.observation || "",
      revealLabel: source.revealLabel || (type === "output-observation" ? "Show output clue" : "Reveal example"),
      continueLabel: source.continueLabel || "Continue"
    };
  }

  function scaffoldLabel(data) {
    const level = Number(data?.scaffold);
    if (!Number.isFinite(level)) return "";
    if (level >= 4) return "guided support";
    if (level >= 2) return "lighter support";
    if (level === 1) return "last hint";
    return "independent";
  }

  function normalizeBlock(block, index) {
    if (typeof block === "string") return { id: `block-${index + 1}`, code: block, label: block };
    const code = String(block?.code ?? block?.value ?? block?.text ?? "");
    return { id: String(block?.id || `block-${index + 1}`), code, label: String(block?.label || block?.text || code), repeatable: Boolean(block?.repeatable) };
  }

  function codeKey(topicId, lessonId, activityIndex = null) { return `${topicId}::${lessonId}${activityIndex == null ? "" : `::activity-${activityIndex}`}`; }

  function freshLessonSession(reviewMode = false) {
    return {
      activityIndex: 0,
      passed: {},
      choices: {},
      feedback: {},
      revealed: {},
      complete: false,
      xpAwarded: false,
      reviewMode: Boolean(reviewMode),
      phase: "normal",
      mistakeQueue: [],
      mistakePosition: 0,
      mistakes: [],
      mistakesFixed: 0,
      mistakeAttempts: {}
    };
  }

  function lessonSession(topic, lesson) {
    const key = codeKey(topic.id, lesson.id);
    if (!state.sessions.has(key)) state.sessions.set(key, freshLessonSession(false));
    const session = state.sessions.get(key);
    if (!session.passed || typeof session.passed !== "object") session.passed = {};
    if (!session.choices || typeof session.choices !== "object") session.choices = {};
    if (!session.feedback || typeof session.feedback !== "object") session.feedback = {};
    if (!session.revealed || typeof session.revealed !== "object") session.revealed = {};
    if (!Array.isArray(session.mistakes)) session.mistakes = [];
    if (!Array.isArray(session.mistakeQueue)) session.mistakeQueue = [];
    if (!Number.isFinite(Number(session.mistakesFixed))) session.mistakesFixed = 0;
    if (!session.mistakeAttempts || typeof session.mistakeAttempts !== "object") session.mistakeAttempts = {};
    if (session.phase !== "mistake") session.phase = "normal";
    return session;
  }

  function restartLessonForReview(topic, lesson) {
    state.sessions.set(codeKey(topic.id, lesson.id), freshLessonSession(true));
    lessonActivities(lesson).forEach((_, index) => {
      const key = codeKey(topic.id, lesson.id, index);
      state.codes.delete(key);
      state.arrangements.delete(key);
      state.lastResults.delete(key);
    });
    state.currentResult = null;
  }

  function initialArrangement(topic, lesson, ex, activityIndex = null) {
    const key = codeKey(topic.id, lesson.id, activityIndex);
    if (!state.arrangements.has(key)) {
      state.arrangements.set(key, { selected: [], used: new Set(), passed: false });
    }
    const value = state.arrangements.get(key);
    value.blocks = ex.blocks.map(normalizeBlock);
    return value;
  }

  function renderTeaching(lesson) {
    const teaching = lesson.teaching;
    if (Array.isArray(teaching)) return teaching.map((item, index) => `<p>${escapeHtml(typeof item === "string" ? item : item?.text || item?.body || "")}</p>`).join("");
    if (teaching && typeof teaching === "object") {
      const eyebrow = teaching.eyebrow ? `<span class="teaching-eyebrow">${escapeHtml(teaching.eyebrow)}</span>` : "";
      const title = teaching.title || teaching.concept ? `<h3>${escapeHtml(teaching.title || teaching.concept)}</h3>` : "";
      const body = teaching.body || teaching.text || teaching.explanation || "";
      const why = teaching.why ? `<p class="why-copy"><strong>Why it matters:</strong> ${escapeHtml(teaching.why)}</p>` : "";
      const points = teaching.points || teaching.bullets || teaching.tips;
      const bullets = Array.isArray(points) ? `<ul>${points.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
      return `${eyebrow}${title}<p>${escapeHtml(body)}</p>${why}${bullets}`;
    }
    return `<p>${escapeHtml(teaching || lesson.explanation || "Start with the idea, then make the data prove it.")}</p>`;
  }

  function renderArrangeExercise(topic, lesson, ex, activityIndex = null) {
    const arrangement = initialArrangement(topic, lesson, ex, activityIndex);
    const blocks = arrangement.blocks.map(block => {
      const selected = arrangement.used.has(block.id) && !block.repeatable;
      return `<button type="button" class="code-block${selected ? " is-selected" : ""}" draggable="${selected ? "false" : "true"}" data-action="select-block" data-block-id="${escapeHtml(block.id)}" aria-label="Add code block: ${escapeHtml(block.label)}"${selected ? " aria-pressed=\"true\"" : ""}>${escapeHtml(block.label)}</button>`;
    }).join("");
    const assembled = arrangement.selected.length ? arrangement.selected.map((block, index) => `<li><code>${escapeHtml(block.code)}</code><button type="button" class="remove-block" data-action="remove-block" data-block-id="${escapeHtml(block.id)}" aria-label="Remove code block ${index + 1}">×</button></li>`).join("") : `<li class="assembly-empty">Select or drag blocks here in the order you want to run them.</li>`;
    return `<div class="arrange-exercise exercise-workspace" data-lesson-key="${escapeHtml(codeKey(topic.id, lesson.id, activityIndex))}"><div class="block-bank" aria-label="Available Python blocks"><span class="bank-label">CODE BLOCKS <small>select or drag in order</small></span>${blocks}</div><div class="assembled-code answer-zone"><div class="code-cell-head"><span class="cell-prompt">[ ]</span><span class="cell-title">python · isolated working copy</span><button class="icon-button clear-code" type="button" data-action="reset-code" aria-label="Clear assembled code">×</button></div><div class="code-cell notebook-cell" data-drop-target="blocks" aria-label="Assembled Python code"><span class="line-number">1</span><ol class="assembled-code-list">${assembled}</ol></div></div><div class="arrange-actions"><button type="button" class="button button-quiet text-button" data-action="undo-block"${arrangement.selected.length ? "" : " disabled"}>Undo</button><button type="button" class="button button-quiet text-button" data-action="reset-code">Reset cell</button></div></div>`;
  }

  function renderCodeExercise(topic, lesson, ex, activityIndex = null) {
    const key = codeKey(topic.id, lesson.id, activityIndex);
    if (!state.codes.has(key)) state.codes.set(key, ex.starterCode);
    const value = state.codes.get(key);
    const placeholder = ex.type === "free-code" ? "Write your Python here…" : "Complete the starter code…";
    return `<div class="free-exercise exercise-workspace"><div class="assembled-code answer-zone"><div class="code-cell-head"><span class="cell-prompt">[ ]</span><span class="cell-title">python · isolated working copy</span><button class="icon-button clear-code" type="button" data-action="clear-code" aria-label="Clear code">×</button></div><div class="code-cell notebook-cell"><span class="line-number">1</span><textarea class="code-editor" id="lessonCode" data-code-key="${escapeHtml(key)}" data-run-shortcut aria-label="Python code for ${escapeHtml(titleOf(lesson))}" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></div></div><div class="arrange-actions"><button type="button" class="button button-quiet text-button" data-action="clear-code">Clear code</button><button type="button" class="button button-quiet text-button" data-action="reset-code">Reset starter</button></div></div>`;
  }

  function renderExercise(topic, lesson, activityIndex = null, activity = null) {
    const ex = activityData(lesson, activity);
    const session = lessonSession(topic, lesson);
    const canContinue = Boolean(session.passed[activityIndex]) || Boolean(state.currentResult?.passed);
    const content = ex.type === "arrange" && ex.blocks.length ? renderArrangeExercise(topic, lesson, ex, activityIndex) : renderCodeExercise(topic, lesson, ex, activityIndex);
    const actions = canContinue
      ? `<button type="button" class="raised-button primary-action button button-primary continue-button" data-action="continue-activity">Continue <span aria-hidden="true">→</span></button>`
      : `<button type="button" class="raised-button primary-action button button-primary run-button" data-action="run-activity"><span class="run-label">Check</span><span class="run-spinner" aria-hidden="true"></span><span aria-hidden="true">→</span></button><button type="button" class="button button-secondary hint-button" data-action="toggle-hint" aria-expanded="false">Need a hint?</button><span class="keycap">⌘/CTRL + ENTER</span>`;
    return `<section class="exercise-card exercise-round" data-scaffold="${Number.isFinite(ex.scaffold) ? ex.scaffold : ""}" aria-labelledby="exerciseTitle"><div class="exercise-head exercise-header"><div><span class="mode-chip mode-practice">PRACTICE · ${escapeHtml(ex.type.toUpperCase())}</span><h2 id="exerciseTitle">${escapeHtml(ex.title || "Your turn")}</h2></div><span class="status-chip" data-exercise-status><i aria-hidden="true"></i>${canContinue ? "passed" : "ready"}</span></div><p class="exercise-prompt">${escapeHtml(ex.prompt)}</p><div class="exercise-body">${content}</div><div class="scaffold-note" aria-live="polite">${escapeHtml(scaffoldLabel(ex))}</div><div class="session-action-tray exercise-actions">${actions}</div><div class="hint-panel" data-hint hidden><p>${escapeHtml(ex.hint)}</p></div><div class="session-feedback" data-session-feedback aria-live="polite"></div><div class="output-panel lesson-output" id="lessonOutput" aria-live="polite" aria-atomic="false"><div class="output-head"><strong>OUTPUT WINDOW</strong><span class="runtime-status"><i aria-hidden="true"></i>ready</span></div><div class="output-body"><div class="output-placeholder output-empty">Run the cell to test the result.</div></div></div></section>`;
  }

  function datasetReference(lesson, topic) {
    const curriculum = getCurriculum() || {};
    const reference = lesson.dataset ?? topic.dataset ?? lesson.datasetId ?? topic.datasetId;
    const datasets = curriculum.datasets || {};
    if (reference && typeof reference === "object") return { ...reference };
    const refId = String(reference || "");
    const fromMap = Array.isArray(datasets) ? datasets.find(item => String(item.id || item.name) === refId) : datasets[refId];
    if (fromMap) return { ...fromMap, id: String(fromMap.id || refId) };
    const cleaning = window.CLEANING_MINI_DATASETS || {};
    if (refId && Object.prototype.hasOwnProperty.call(cleaning, refId)) return { id: refId, inlineId: refId, sep: "," };
    if (typeof reference === "string" && /[,\n]/.test(reference)) return { id: "inline", csv: reference, sep: "," };
    return { id: refId || "unknown", sep: "," };
  }

  function cleanInlineValue(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (typeof value.csv === "string") return { csv: value.csv, sep: value.sep || "," };
      if (typeof value.text === "string") return { csv: value.text, sep: value.sep || "," };
      if (Array.isArray(value.rows)) return { csv: rowsToCsv(value.rows, value.columns), sep: value.sep || "," };
      if (Array.isArray(value.data)) return { csv: rowsToCsv(value.data, value.columns), sep: value.sep || "," };
    }
    if (Array.isArray(value)) return { csv: rowsToCsv(value), sep: "," };
    if (typeof value === "string") return { csv: value, sep: "," };
    return null;
  }

  function csvEscape(value) {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function rowsToCsv(rows, columns) {
    if (!Array.isArray(rows) || !rows.length) return "";
    const objects = rows.every(row => row && typeof row === "object" && !Array.isArray(row));
    const headers = Array.isArray(columns) && columns.length ? columns.map(String) : objects ? [...new Set(rows.flatMap(row => Object.keys(row)))] : [];
    const lines = [];
    if (headers.length) lines.push(headers.map(csvEscape).join(","));
    rows.forEach(row => {
      const values = objects ? headers.map(header => row[header]) : row;
      lines.push(values.map(csvEscape).join(","));
    });
    return lines.join("\n");
  }

  async function decodeEmbeddedDataset(id) {
    const encoded = window.EMBEDDED_DATASETS?.[id];
    if (!encoded) return null;
    if (!("DecompressionStream" in window)) {
      throw new Error("This browser cannot decode the bundled dataset copy. Try a current browser or use a local HTTP server.");
    }
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function loadDataset(reference) {
    const key = JSON.stringify(reference);
    if (state.datasetCache.has(key)) return state.datasetCache.get(key);
    const cleaning = window.CLEANING_MINI_DATASETS || {};
    let inline = reference.inlineId && Object.prototype.hasOwnProperty.call(cleaning, reference.inlineId) ? cleanInlineValue(cleaning[reference.inlineId]) : null;
    if (!inline && reference.id && Object.prototype.hasOwnProperty.call(cleaning, reference.id)) inline = cleanInlineValue(cleaning[reference.id]);
    if (inline) {
      const value = { csv: inline.csv, sep: reference.sep || inline.sep || ",", label: reference.label || reference.name || reference.id };
      state.datasetCache.set(key, value);
      return value;
    }
    if (typeof reference.csv === "string" || typeof reference.text === "string") {
      const value = { csv: String(reference.csv ?? reference.text), sep: reference.sep || ",", label: reference.label || reference.name || reference.id };
      state.datasetCache.set(key, value);
      return value;
    }
    const url = reference.url || reference.href || reference.file || reference.path;
    if (!url) throw new Error("No dataset source was configured for this lesson.");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Dataset request failed (${response.status}).`);
      const csv = await response.text();
      const value = { csv, sep: reference.sep || ",", label: reference.label || reference.name || reference.id || url };
      state.datasetCache.set(key, value);
      return value;
    } catch (error) {
      try {
        const embeddedCsv = await decodeEmbeddedDataset(reference.id);
        if (embeddedCsv != null) {
          const value = { csv: embeddedCsv, sep: reference.sep || ",", label: reference.label || reference.name || reference.id || url, embedded: true };
          state.datasetCache.set(key, value);
          return value;
        }
      } catch (embeddedError) {
        error = embeddedError;
      }
      const isFile = window.location.protocol === "file:";
      const guidance = isFile ? " The bundled copy could not be decoded. Try a current browser or open learning.html through a local HTTP server." : " Check the dataset path and reload.";
      throw new Error(`${error?.message || error}${guidance}`);
    }
  }

  function parseCsvRow(line, sep) {
    const result = [];
    let value = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
        else quoted = !quoted;
      } else if (char === sep && !quoted) { result.push(value); value = ""; }
      else value += char;
    }
    result.push(value);
    return result;
  }

  function previewDataset(data) {
    const sep = String(data.sep || ",").charAt(0);
    const allLines = String(data.csv || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
    const lines = allLines.slice(0, 8);
    if (!lines.length) return { columns: [], rows: [] };
    const columns = parseCsvRow(lines[0], sep).map(value => value.trim());
    const rows = lines.slice(1).map(line => parseCsvRow(line, sep).slice(0, columns.length));
    return { columns, rows, rowCount: Math.max(0, allLines.length - 1), columnCount: columns.length };
  }

  async function previewPreparedDataset(reference, data) {
    const prepare = String(reference.prepare || "").trim();
    if (!prepare || /^df\.copy\(\)$/.test(prepare.replace(/\s+/g, ""))) return { ...previewDataset(data), prepared: true };
    const cacheKey = JSON.stringify({ id: reference.id, url: reference.url || reference.file, sep: data.sep, prepare });
    if (state.previewCache.has(cacheKey)) return state.previewCache.get(cacheKey);
    const pending = runInWorker({
        csv: data.csv,
        sep: data.sep || ",",
        prepare,
        setup: "",
        code: "df",
        validator: "True"
      })
      .then(result => {
        if (result?.status === "error" || !result?.table) throw new Error(result?.error || "The prepared dataset preview could not be produced.");
        const preview = { columns: result.table.columns || [], rows: (result.table.rows || []).slice(0, 7), rowCount: result.table.rowCount, columnCount: result.table.columnCount, prepared: true };
        state.previewCache.set(cacheKey, preview);
        return preview;
      })
      .catch(error => {
        state.previewCache.delete(cacheKey);
        if (window.location.protocol === "file:") {
          return {
            ...previewDataset(data),
            prepared: false,
            notice: "Showing the bundled raw rows. Start a local HTTP server to run the prepared preview and notebook.",
          };
        }
        throw error;
      });
    state.previewCache.set(cacheKey, pending);
    return pending;
  }

  async function loadPreview(topic, lesson, token) {
    const target = $("#datasetPreview", root);
    if (!target) return;
    try {
      const reference = datasetReference(lesson, topic);
      const data = await loadDataset(reference);
      if (token !== state.renderToken || !$("#datasetPreview", root)) return;
      const preview = await previewPreparedDataset(reference, data);
      if (token !== state.renderToken || !$("#datasetPreview", root)) return;
      const rowLabel = preview.prepared ? "prepared rows" : "rows";
      const previewNotice = preview.notice ? `<p class="table-note">${escapeHtml(preview.notice)}</p>` : "";
      target.innerHTML = `<div class="dataset-preview-head"><span>${escapeHtml(data.label || "Dataset preview")}</span><small>${preview.rows.length ? `${preview.rows.length} sample rows · ${preview.rowCount ?? preview.rows.length} ${rowLabel}` : "Empty dataset"}</small></div>${renderTable(preview, preview.rowCount ?? preview.rows.length, preview.columnCount ?? preview.columns.length, "dataset-table")}${previewNotice}`;
      target.dataset.ready = "true";
      const stateLabel = $(".dataset-state", root);
      if (stateLabel) stateLabel.textContent = "preview ready";
    } catch (error) {
      if (token !== state.renderToken) return;
      target.innerHTML = `<div class="runtime-error"><strong>Dataset preview unavailable.</strong><p>${escapeHtml(error.message || error)}</p></div>`;
      target.dataset.ready = "false";
      const stateLabel = $(".dataset-state", root);
      if (stateLabel) stateLabel.textContent = "preview unavailable";
    }
  }

  function renderTable(table, rowCount, columnCount, className = "output-table") {
    if (!table || !Array.isArray(table.columns)) return "";
    const columns = table.columns.map(value => String(value));
    const rows = Array.isArray(table.rows) ? table.rows : [];
    return `<div class="table-scroll"><table class="${className}"><caption class="sr-only">${rowCount == null ? "" : `${rowCount} rows, ${columnCount ?? columns.length} columns`}</caption><thead><tr>${columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map((_, index) => `<td>${escapeHtml(formatValue(row?.[index]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${rowCount > rows.length ? `<p class="table-note">Showing ${rows.length} of ${rowCount} rows.</p>` : ""}`;
  }

  function formatValue(value) {
    if (value == null) return "—";
    if (typeof value === "number") return Number.isInteger(value) ? String(value) : Number(value.toFixed(4)).toString();
    return String(value);
  }

  function renderOutput(result, lesson) {
    const target = $("#lessonOutput", root);
    if (!target) return;
    const passed = Boolean(result?.passed);
    const status = result?.status === "error" ? "error" : passed ? "success" : "failure";
    let html = `<div class="runtime-feedback feedback-${status}" role="status"><strong>${escapeHtml(status === "success" ? (lesson.success || "Checkpoint complete — the output matches the mission.") : status === "failure" ? (lesson.failure || "Python ran, but the result does not meet this checkpoint yet.") : "The notebook hit a runtime error.")}</strong>`;
    if (result?.validatorError && status !== "success") html += `<p>${escapeHtml(result.validatorError)}</p>`;
    if (result?.error) html += `<details class="traceback"><summary>Show traceback</summary><pre>${escapeHtml(result.error)}</pre></details>`;
    html += "</div>";
    if (result?.table) html += `<div class="output-section"><p class="output-label">DATAFRAME OUTPUT</p>${renderTable(result.table, result.table.rowCount, result.table.columnCount)}</div>`;
    if (result?.value != null && result.value !== "") html += `<div class="output-section"><p class="output-label">RESULT</p><pre class="scalar-output">${escapeHtml(result.value)}</pre></div>`;
    if (result?.stdout) html += `<div class="output-section"><p class="output-label">CONSOLE</p><pre class="console-output">${escapeHtml(result.stdout)}</pre></div>`;
    if (result?.stderr) html += `<div class="output-section"><p class="output-label">STDERR</p><pre class="console-output">${escapeHtml(result.stderr)}</pre></div>`;
    if (Array.isArray(result?.charts) && result.charts.length) html += `<div class="output-section chart-output"><p class="output-label">CHART OUTPUT</p><div class="chart-grid">${result.charts.map((src, index) => `<figure><img src="${escapeHtml(src)}" alt="Chart output ${index + 1}"><figcaption>Figure ${index + 1}</figcaption></figure>`).join("")}</div></div>`;
    target.innerHTML = `<div class="output-head"><strong>OUTPUT WINDOW</strong><span class="runtime-status runtime-${status}"><i aria-hidden="true"></i>${status === "success" ? "passed" : status === "failure" ? "check output" : "runtime error"}</span></div><div class="output-body">${html}</div>`;
    target.dataset.status = status;
  }

  function renderChoiceActivity(topic, lesson, activity, activityIndex, session) {
    const data = activityData(lesson, activity);
    const selected = session.choices[activityIndex];
    const feedback = session.feedback[activityIndex];
    const correctLabel = data.options[data.answerIndex]?.label || (typeof data.answer === "string" ? data.answer : "the highlighted option");
    const review = activityPhase(activity) === "review" || String(activity?.phase || "").toLowerCase() === "review";
    const options = data.options.map((option, index) => {
      const label = option.label || String(option);
      const selectedClass = Number(selected) === index ? " is-selected" : "";
      const resultClass = feedback ? (index === data.answerIndex ? " is-correct" : Number(selected) === index ? " is-wrong" : "") : "";
      return `<button type="button" class="choice-option${selectedClass}${resultClass}" data-action="choose-choice" data-option="${index}" aria-pressed="${Number(selected) === index ? "true" : "false"}"${feedback?.correct ? " disabled" : ""}><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(label)}</span></button>`;
    }).join("");
    const disabled = selected == null ? " disabled" : "";
    const feedbackMarkup = feedback ? `<div class="choice-feedback session-feedback ${feedback.correct ? "is-correct" : "is-wrong"}" role="status"><strong>${feedback.correct ? "Correct." : "Not quite yet."}</strong>${feedback.correct ? "" : `<span class="choice-correction"><b>Correct answer:</b> ${escapeHtml(correctLabel)}</span>`}<span>${escapeHtml(feedback.message || data.explanation)}</span></div>` : "";
    const choiceAction = feedback?.correct ? "continue-activity" : feedback ? "retry-choice" : "check-choice";
    return `<section class="activity-card choice-card exercise-round${review ? " review-activity" : ""}" data-scaffold="${Number.isFinite(data.scaffold) ? data.scaffold : ""}" aria-labelledby="activityTitle"><div class="activity-card-head"><span class="mode-chip ${review ? "mode-review" : "mode-practice"}">${review ? "REVIEW · RETRIEVE" : "PRACTICE · CHOOSE"}</span><span class="activity-kind">${review ? "spaced recall" : "quick check"} · ${escapeHtml(scaffoldLabel(data))}</span></div><h2 id="activityTitle">${escapeHtml(data.title || "Choose the best answer")}</h2><p class="activity-prompt exercise-prompt">${escapeHtml(data.prompt)}</p><div class="exercise-body"><div class="choice-list answer-zone" role="group" aria-label="Answer choices">${options}</div></div>${feedbackMarkup}<div class="session-action-tray activity-actions"><button type="button" class="button button-primary" data-action="${choiceAction}"${disabled}>${feedback?.correct ? "Continue" : feedback ? "Try again" : "Check answer"}<span aria-hidden="true">→</span></button>${!feedback ? `<button type="button" class="button button-quiet" data-action="toggle-hint" aria-expanded="false">Need a hint?</button><div class="hint-panel" data-hint hidden><p>${escapeHtml(data.hint)}</p></div>` : ""}</div></section>`;
  }

  function renderTeachingActivity(lesson, activity, activityIndex) {
    const data = activityData(lesson, activity);
    const points = data.points.length ? `<ul>${data.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : "";
    return `<section class="activity-card teaching-activity exercise-round" data-scaffold="${Number.isFinite(data.scaffold) ? data.scaffold : ""}" aria-labelledby="activityTitle"><div class="activity-card-head"><span class="mode-chip mode-teach">LEARN · ${String(activityIndex + 1).padStart(2, "0")}</span><span class="activity-kind">new concept · ${escapeHtml(scaffoldLabel(data))}</span></div><h2 id="activityTitle">${escapeHtml(data.title || "The idea")}</h2><div class="activity-copy exercise-body"><p>${escapeHtml(data.body || "Start with the idea, then make the data prove it.")}</p>${points}</div><div class="session-action-tray activity-actions"><button type="button" class="button button-primary" data-action="continue-activity">Continue <span aria-hidden="true">→</span></button></div></section>`;
  }

  function renderDemonstrateActivity(topic, lesson, activity, activityIndex, session) {
    const data = activityData(lesson, activity);
    const revealed = Boolean(session.revealed[activityIndex]);
    const example = data.solution || activity.example || activity.code || lesson.solution || "# The worked example will appear here.";
    const observationPrompt = activity.observationPrompt || data.observationPrompt || data.prompt || "What changed in the table?";
    const observation = activity.observation || data.observation || data.explanation || data.body || "Inspect the example, then try the same move in your own words.";
    const outputContext = activity.outputContext || data.outputContext || "";
    // Demonstrations carry authored prose in `prompt` or `body`; do not let
    // activityData's generic legacy fallback hide that guidance before reveal.
    const authoredInstruction = activity.prompt || activity.instruction || activity.body || (activity.observationPrompt ? `Observe the example, then answer: ${activity.observationPrompt}` : "Inspect this worked example before you practise the same idea.");
    const revealLabel = activity.revealLabel || "Reveal example";
    const continueLabel = activity.continueLabel || "Continue";
    return `<section class="activity-card demonstrate-activity exercise-round" data-scaffold="${Number.isFinite(data.scaffold) ? data.scaffold : ""}" aria-labelledby="activityTitle"><div class="activity-card-head"><span class="mode-chip mode-teach">WATCH · ${String(activityIndex + 1).padStart(2, "0")}</span><span class="activity-kind">worked example · ${escapeHtml(scaffoldLabel(data))}</span></div><h2 id="activityTitle">${escapeHtml(data.title || "See the move")}</h2><p class="activity-prompt exercise-prompt">${escapeHtml(authoredInstruction)}</p><div class="demonstration-window${revealed ? " is-revealed" : ""}">${revealed ? `<pre class="example-code"><code>${escapeHtml(example)}</code></pre>${outputContext ? `<div class="demonstration-output"><span>OUTPUT CONTEXT</span><strong>${escapeHtml(outputContext)}</strong></div>` : ""}<p class="demonstration-note"><strong>${escapeHtml(observationPrompt)}</strong><br>${escapeHtml(observation)}</p>` : `<div class="example-veil" aria-hidden="true"><span>PYTHON EXAMPLE</span><i>•••</i></div>`}</div><div class="session-action-tray activity-actions">${revealed ? `<button type="button" class="button button-primary" data-action="continue-activity">${escapeHtml(continueLabel)} <span aria-hidden="true">→</span></button>` : `<button type="button" class="button button-primary" data-action="reveal-example">${escapeHtml(revealLabel)} <span aria-hidden="true">→</span></button>`}</div></section>`;
  }

  function renderOutputObservationActivity(topic, lesson, activity, activityIndex, session) {
    const data = activityData(lesson, activity);
    const revealed = Boolean(session.revealed[activityIndex]);
    const example = activity.example || activity.code || data.solution || lesson.solution || "# Observe the output evidence";
    const observationPrompt = activity.observationPrompt || data.observationPrompt || "Which output characteristic should you point to?";
    const observation = activity.observation || data.observation || data.expected || "Connect the visible output to the checkpoint contract.";
    const outputContext = activity.outputContext || data.outputContext || data.expected || "The output should satisfy the authored checkpoint contract.";
    const authoredInstruction = activity.prompt || activity.instruction || activity.body || "Pause and read the result before moving to independent code.";
    const revealLabel = activity.revealLabel || data.revealLabel || "Show output clue";
    const continueLabel = activity.continueLabel || data.continueLabel || "I can read the result";
    return `<section class="activity-card output-observation-activity exercise-round" data-scaffold="${Number.isFinite(data.scaffold) ? data.scaffold : ""}" aria-labelledby="activityTitle"><div class="activity-card-head"><span class="mode-chip mode-data">OBSERVE · ${String(activityIndex + 1).padStart(2, "0")}</span><span class="activity-kind">output evidence · ${escapeHtml(scaffoldLabel(data))}</span></div><h2 id="activityTitle">${escapeHtml(data.title || "Read the output")}</h2><p class="activity-prompt exercise-prompt">${escapeHtml(authoredInstruction)}</p><div class="demonstration-window output-observation-window${revealed ? " is-revealed" : ""}">${revealed ? `<div class="demonstration-output"><span>OUTPUT OBSERVATION</span><strong>${escapeHtml(outputContext)}</strong></div><pre class="example-code"><code>${escapeHtml(example)}</code></pre><p class="demonstration-note"><strong>${escapeHtml(observationPrompt)}</strong><br>${escapeHtml(observation)}</p>` : `<div class="example-veil" aria-hidden="true"><span>OUTPUT EVIDENCE</span><i>•••</i></div>`}</div><div class="session-action-tray activity-actions">${revealed ? `<button type="button" class="button button-primary" data-action="continue-activity">${escapeHtml(continueLabel)} <span aria-hidden="true">→</span></button>` : `<button type="button" class="button button-primary" data-action="reveal-example">${escapeHtml(revealLabel)} <span aria-hidden="true">→</span></button>`}</div></section>`;
  }

  function renderRecapActivity(lesson, activity, activityIndex) {
    const data = activityData(lesson, activity);
    const points = data.points.length ? `<ul>${data.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : `<p>${escapeHtml(data.body || "You have practised the core move and are ready for the next checkpoint.")}</p>`;
    return `<section class="activity-card recap-activity exercise-round" data-scaffold="${Number.isFinite(data.scaffold) ? data.scaffold : ""}" aria-labelledby="activityTitle"><div class="activity-card-head"><span class="mode-chip mode-review">REVIEW · ${String(activityIndex + 1).padStart(2, "0")}</span><span class="activity-kind">lock it in · ${escapeHtml(scaffoldLabel(data))}</span></div><h2 id="activityTitle">${escapeHtml(data.title || "Checkpoint recap")}</h2><div class="activity-copy exercise-body">${points}</div><div class="session-action-tray activity-actions"><button type="button" class="button button-primary" data-action="continue-activity">Continue <span aria-hidden="true">→</span></button></div></section>`;
  }

  function renderActivity(topic, lesson, activity, activityIndex, session) {
    const type = activityType(activity);
    if (type === "teach") return renderTeachingActivity(lesson, activity, activityIndex);
    if (type === "demonstrate") return renderDemonstrateActivity(topic, lesson, activity, activityIndex, session);
    if (type === "output-observation") return renderOutputObservationActivity(topic, lesson, activity, activityIndex, session);
    if (type === "choice") return renderChoiceActivity(topic, lesson, activity, activityIndex, session);
    if (type === "recap") return renderRecapActivity(lesson, activity, activityIndex);
    return renderExercise(topic, lesson, activityIndex, activity);
  }

  function renderLessonComplete(topic, lesson, lessonIndex, addedXp) {
    const destination = destinationFor(topic);
    const session = lessonSession(topic, lesson);
    const plan = activityPlan(lesson);
    const mistakes = Number(session.mistakesFixed || 0);
    const nextLabel = lessonIndex >= lessonsOf(topic).length - 1 ? "Return to destination" : "Continue route";
    const completionLabel = session.reviewMode ? "REVIEW COMPLETE" : "LESSON COMPLETE";
    return `<section class="lesson-summary" data-autofocus aria-labelledby="lessonCompleteTitle"><div class="completion-emblem" aria-hidden="true">✦</div><span class="eyebrow">${completionLabel}</span><h2 id="lessonCompleteTitle">${escapeHtml(titleOf(lesson))}</h2><p>You finished ${plan.total} focused activities: ${plan.learn} learn/check, ${plan.build} build, and ${plan.review} review. The route is one step closer to ${escapeHtml(destination.title)}.</p><div class="completion-reward"><strong>+${addedXp ? Number(lesson.xp) || 25 : 0} XP</strong><span>${addedXp ? "added to your log" : "already logged"}</span></div><div class="lesson-summary-stats"><span><strong>${plan.total}</strong><small>activities</small></span><span><strong>${mistakes}</strong><small>mistakes fixed</small></span><span><strong>${addedXp ? Number(lesson.xp) || 25 : 0}</strong><small>XP earned</small></span></div><div class="completion-actions"><button type="button" class="button button-primary" data-action="continue-lesson">${nextLabel} <span aria-hidden="true">→</span></button><button type="button" class="button button-secondary" data-action="go-journey" data-topic="${escapeHtml(topic.id)}">Review map</button></div></section>`;
  }

  function renderLesson(topic, lesson) {
    const lessons = lessonsOf(topic);
    const lessonIndex = lessons.findIndex(item => item.id === lesson.id);
    const activities = lessonActivities(lesson);
    const session = lessonSession(topic, lesson);
    const activityIndex = Math.min(Math.max(0, Number(session.activityIndex) || 0), Math.max(0, activities.length - 1));
    session.activityIndex = activityIndex;
    const activity = activities[activityIndex] || { type: "recap", title: "Checkpoint complete" };
    const token = ++state.renderToken;
    state.currentResult = state.lastResults.get(codeKey(topic.id, lesson.id, activityIndex)) || null;
    state.runtimeError = null;
    root.dataset.view = "lesson";
    const previewSource = {
      ...lesson,
      ...activity,
      dataset: activity.dataset ?? activity.datasetId ?? lesson.dataset ?? lesson.datasetId
    };
    const dataset = datasetReference(previewSource, topic);
    const datasetName = String(dataset.name || dataset.label || dataset.id || "LESSON_DATA.CSV").toUpperCase();
    const completeMarkup = session.complete ? renderLessonComplete(topic, lesson, lessonIndex, Boolean(session.xpAwarded)) : renderActivity(topic, lesson, activity, activityIndex, session);
    const segments = activities.map((_, index) => `<span class="progress-segment${index < activityIndex ? " is-done" : index === activityIndex ? " is-current" : ""}" aria-hidden="true"></span>`).join("");
    const reviewBadge = session.phase === "mistake" ? `<span class="mistake-review-badge" role="status">REVIEWING MISSED ROUNDS · ${Math.min((session.mistakePosition || 0) + 1, session.mistakeQueue.length)} / ${session.mistakeQueue.length}</span>` : session.reviewMode ? `<span class="mistake-review-badge" role="status">LESSON REVIEW · XP ALREADY EARNED</span>` : "";
    const phaseLabel = String(activity.phase || activityType(activity) || "learn").replace(/[-_]/g, " ").toUpperCase();
    const roundLabel = session.phase === "mistake" ? `REVIEW · ACTIVITY ${activityIndex + 1} OF ${activities.length}` : `ACTIVITY ${activityIndex + 1} OF ${activities.length} · ${phaseLabel}`;
    root.innerHTML = `<section class="view lesson-view" id="lessonView" data-view="lesson" aria-labelledby="lessonTitle"><div class="lesson-session"><header class="session-topbar"><button type="button" class="session-exit" data-action="go-journey" data-topic="${escapeHtml(topic.id)}" aria-label="Exit lesson and return to journey">×<span class="sr-only">Exit lesson</span></button><div class="session-progress" role="progressbar" aria-label="Lesson round progress" aria-valuemin="0" aria-valuemax="${activities.length}" aria-valuenow="${Math.min(activityIndex, activities.length)}">${segments}</div><span class="session-round">${escapeHtml(roundLabel)}</span><span class="session-xp">+${escapeHtml(lesson.xp || 25)} XP</span></header><div class="session-heading"><span class="eyebrow"><span aria-hidden="true">//</span> ${escapeHtml(lesson.stage || "guided learning")}</span><h1 id="lessonTitle" data-lesson-title>${escapeHtml(titleOf(lesson))}</h1><p data-lesson-subtitle>${escapeHtml(lesson.subtitle || lesson.description || "Learn one move, then make the data prove it.")}</p>${reviewBadge}</div>${session.complete ? `<main class="lesson-stage lesson-summary-stage">${completeMarkup}</main>` : `<main class="exercise-stage" data-autofocus tabindex="-1" aria-labelledby="exerciseTitle"><details class="inline-dataset"><summary><span class="dataset-state">DATA PREVIEW · ready to inspect</span><strong>${escapeHtml(datasetName)}</strong><span aria-hidden="true">⌄</span></summary><div class="dataset-table-wrap dataset-preview" id="datasetPreview"><div class="loading-signal"><span></span><span></span><span></span> Loading dataset preview…</div></div><p class="dataset-note"><span class="signal-dot"></span>Read the columns before you write a transformation.</p></details>${completeMarkup}</main>`}<div class="runtime-live" data-runtime-live aria-live="polite"></div></div></section>`;
    if (state.currentResult && !session.complete && ["arrange", "modify", "complete", "free-code"].includes(activityType(activity))) renderOutput(state.currentResult, activity);
    loadPreview(topic, previewSource, token);
    focusAfterRender();
  }

  function render() {
    initTheme();
    hideCelebration();
    const curriculum = getCurriculum();
    if (!curriculum || (!Array.isArray(curriculum.topics) && (!curriculum.topics || typeof curriculum.topics !== "object"))) return renderMissingCurriculum();
    const route = parseRoute();
    state.route = route;
    if (route.type === "hub") return renderHub();
    const topic = topicById(route.topicId);
    if (!topic || isStatisticalTopic(topic)) { navigate("hub"); return; }
    if (route.type === "journey") return renderJourney(topic);
    const lesson = lessonsOf(topic).find(item => item.id === route.lessonId);
    if (!lesson) { navigate("journey", topic.id); return; }
    const index = lessonsOf(topic).findIndex(item => item.id === lesson.id);
    if (lessonState(topic, lesson, index) === "locked") {
      announce(lockReason(topic, index), "info");
      navigate("journey", topic.id);
      return;
    }
    return renderLesson(topic, lesson);
  }

  function currentLessonContext() {
    const route = parseRoute();
    if (route.type !== "lesson") return null;
    const topic = topicById(route.topicId);
    if (!topic) return null;
    const lesson = lessonsOf(topic).find(item => item.id === route.lessonId);
    return lesson ? { route, topic, lesson } : null;
  }

  function currentCode(context) {
    const session = lessonSession(context.topic, context.lesson);
    const activityIndex = session.activityIndex;
    const activity = lessonActivities(context.lesson)[activityIndex] || {};
    const ex = activityData(context.lesson, activity);
    if (ex.type === "arrange" && ex.blocks.length) {
      const arrangement = initialArrangement(context.topic, context.lesson, ex, activityIndex);
      return arrangement.selected.map(block => block.code).join("\n");
    }
    const editor = $("#lessonCode", root);
    const key = codeKey(context.topic.id, context.lesson.id, activityIndex);
    if (editor) state.codes.set(key, editor.value);
    return editor ? editor.value : state.codes.get(key) || ex.starterCode;
  }

  function normalizeArrangeCode(value) {
    return String(value == null ? "" : value)
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  function arrangeSequenceMatches(ex, arrangement) {
    if (!arrangement || !Array.isArray(arrangement.selected)) return false;
    const selected = normalizeArrangeCode(arrangement.selected.map(block => block.code).join("\n"));
    // The authored solution is the canonical order contract.  Falling back
    // to the authored block bank keeps older lessons compatible while still
    // rejecting partial selections and swapped blocks before execution.
    const authored = normalizeArrangeCode(ex.solution || "");
    const expected = authored || normalizeArrangeCode(ex.blocks.map(normalizeBlock).map(block => block.code).join("\n"));
    return Boolean(expected) && selected === expected;
  }

  function markLessonComplete(topic, lesson) {
    const completed = progressFor(topic.id);
    if (completed.has(lesson.id)) return false;
    const values = [...completed, lesson.id];
    state.progress.completed[topic.id] = values;
    state.progress.xp += Math.max(0, Number(lesson.xp) || 25);
    saveProgress();
    return true;
  }

  function isAssessableActivity(activity) {
    return ["choice", "arrange", "modify", "complete", "free-code"].includes(activityType(activity));
  }

  function addMistake(context, activityIndex) {
    const session = lessonSession(context.topic, context.lesson);
    const activities = lessonActivities(context.lesson);
    if (!isAssessableActivity(activities[activityIndex])) return;
    if (!session.mistakes.includes(activityIndex)) session.mistakes.push(activityIndex);
    session.mistakeAttempts[activityIndex] = Number(session.mistakeAttempts[activityIndex] || 0) + 1;
  }

  function beginMistakeReview(context) {
    const session = lessonSession(context.topic, context.lesson);
    if (!session.mistakes.length) return false;
    session.phase = "mistake";
    session.mistakeQueue = [...new Set(session.mistakes)].sort((a, b) => a - b);
    session.mistakePosition = 0;
    // Re-present the missed rounds as fresh assessments.  A correct retry in
    // the normal pass earns its place in the review queue, but must not let a
    // learner skip the deliberately spaced second attempt.
    session.mistakeQueue.forEach(index => {
      delete session.passed[index];
      delete session.feedback[index];
      delete session.choices[index];
      const key = codeKey(context.topic.id, context.lesson.id, index);
      state.lastResults.delete(key);
      state.codes.delete(key);
      state.arrangements.delete(key);
    });
    session.activityIndex = session.mistakeQueue[0];
    state.currentResult = null;
    renderLesson(context.topic, context.lesson);
    focusInteraction("#activityTitle", "start");
    announce("One more pass: revisit the rounds you missed.", "info");
    return true;
  }

  function resolveMistake(context, activityIndex) {
    const session = lessonSession(context.topic, context.lesson);
    if (session.mistakes.includes(activityIndex)) session.mistakesFixed = Number(session.mistakesFixed || 0) + 1;
    session.mistakes = session.mistakes.filter(index => Number(index) !== Number(activityIndex));
    session.mistakeQueue = session.mistakeQueue.filter(index => Number(index) !== Number(activityIndex));
    session.mistakePosition = 0;
  }

  function advanceActivity(context, index) {
    const session = lessonSession(context.topic, context.lesson);
    const activities = lessonActivities(context.lesson);
    if (session.phase === "mistake") {
      resolveMistake(context, index);
      if (session.mistakeQueue.length) {
        session.activityIndex = session.mistakeQueue[0];
        state.currentResult = null;
        renderLesson(context.topic, context.lesson);
        focusInteraction("#activityTitle", "start");
        announce("Missed round fixed. Keep going.", "success");
      } else {
        finishLesson(context);
      }
      return;
    }
    if (index >= activities.length - 1) {
      if (!beginMistakeReview(context)) finishLesson(context);
      return;
    }
    session.activityIndex = index + 1;
    state.currentResult = null;
    renderLesson(context.topic, context.lesson);
    focusInteraction("#activityTitle", "start");
    const live = root.querySelector("[data-runtime-live]");
    if (live) live.textContent = "Next round unlocked.";
  }

  function handlePassed(context, result) {
    const session = lessonSession(context.topic, context.lesson);
    const activityIndex = session.activityIndex;
    session.passed[activityIndex] = true;
    session.feedback[activityIndex] = { correct: true, message: "The output satisfies this activity." };
    const exerciseStatus = $("[data-exercise-status]", root);
    if (exerciseStatus) { exerciseStatus.classList.add("is-complete"); exerciseStatus.innerHTML = '<i aria-hidden="true"></i>passed'; }
    const continueButton = $("[data-action=continue-activity]", root);
    if (continueButton) {
      continueButton.disabled = false;
      continueButton.textContent = "Continue";
    }
    if (result) result.passed = true;
    renderLesson(context.topic, context.lesson);
    focusInteraction("[data-action=continue-activity]", "end");
    announce("Correct. Your output meets the activity goal.", "success");
  }

  function refreshLessonProgress(topic) {
    const progress = topicProgress(topic);
    $$('[data-progress-fill]', root).forEach(node => { node.style.width = `${progress.percent}%`; });
    $$('.progress-meter[role="progressbar"]', root).forEach(node => node.setAttribute("aria-valuenow", String(progress.percent)));
  }

  async function runCurrentLesson() {
    const context = currentLessonContext();
    if (!context || state.running) return;
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    const activityInfo = activityData(context.lesson, activity);
    if (!["arrange", "modify", "complete", "free-code"].includes(activityInfo.type)) return;
    if (activityInfo.type === "arrange") {
      const arrangement = initialArrangement(context.topic, context.lesson, activityInfo, session.activityIndex);
      if (!arrangeSequenceMatches(activityInfo, arrangement)) {
        const result = {
          status: "ok",
          passed: false,
          validatorError: "Arrange every code block in the authored order before checking.",
          value: currentCode(context)
        };
        state.lastResults.set(codeKey(context.topic.id, context.lesson.id, session.activityIndex), result);
        state.currentResult = result;
        renderOutput(result, activity);
        addMistake(context, session.activityIndex);
        announce("Not quite. Arrange every block in the correct order before checking.", "info");
        return;
      }
    }
    const code = currentCode(context);
    if (!code.trim()) {
      announce("Add some Python to the notebook before running it.", "error");
      const editor = $("#lessonCode", root); if (editor) editor.focus();
      return;
    }
    const button = $("[data-action=run-activity], [data-action=run-lesson]", root);
    const label = $(".run-label", button || root);
    state.running = true;
    if (button) { button.disabled = true; button.dataset.running = "true"; }
    if (label) label.textContent = "Launching notebook…";
    announce("Running an isolated checkpoint attempt…", "info");
    try {
      const activityReference = datasetReference({ ...context.lesson, ...activity, dataset: activityInfo.dataset ?? context.lesson.dataset ?? context.lesson.datasetId }, context.topic);
      const data = await loadDataset(activityReference);
      const validator = validatorCode(activityInfo.validator);
      const result = await runInWorker({
        csv: data.csv,
        sep: data.sep || ",",
        prepare: activityReference.prepare || "",
        setup: activityInfo.setup,
        code,
        validator
      });
      if (typeof activityInfo.validator === "function" && result.status !== "error" && result.passed) {
        try { result.passed = Boolean(activityInfo.validator(result)); }
        catch (error) { result.passed = false; result.validatorError = `Validator error: ${error.message || error}`; }
      }
      state.lastResults.set(codeKey(context.topic.id, context.lesson.id, session.activityIndex), result);
      state.currentResult = result;
      renderOutput(result, activity);
      if (result.passed) {
        handlePassed(context, result);
      } else {
        addMistake(context, session.activityIndex);
        announce(result.status === "error" ? "Notebook error. Read the traceback and try again." : "Python ran, but the output does not satisfy the checkpoint yet.", result.status === "error" ? "error" : "info");
      }
    } catch (error) {
      state.runtimeError = error;
      const result = { status: "error", passed: false, error: error.message || String(error) };
      state.lastResults.set(codeKey(context.topic.id, context.lesson.id, session.activityIndex), result);
      renderOutput(result, activity);
      addMistake(context, session.activityIndex);
      announce(error.message || "The runtime could not launch.", "error");
    } finally {
      state.running = false;
      if (button) { button.disabled = false; button.dataset.running = "false"; }
      if (label) label.textContent = "Run & check";
    }
  }

  function validatorCode(validator) {
    if (typeof validator === "string") return validator;
    if (validator && typeof validator === "object") return String(validator.python || validator.code || validator.expression || "");
    return "";
  }

  function workerSource() {
    return String.raw`
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
let pyodide = null;
let ready = false;
let bootPromise = null;
let queue = Promise.resolve();

const PY_BOOT = [
  "import io, json, base64, contextlib, ast, traceback",
  "import numpy as np",
  "import pandas as pd",
  "import matplotlib",
  "matplotlib.use('Agg')",
  "import matplotlib.pyplot as plt",
  "import seaborn as sns",
  "import sklearn",
  "sns.set_theme(style='whitegrid', palette='muted')"
].join("\n");

const PY_RUN = [
  "def __safe(value):",
  "    if value is None: return None",
  "    if isinstance(value, np.generic): return __safe(value.item())",
  "    if isinstance(value, (pd.Timestamp,)): return str(value)",
  "    if isinstance(value, float) and (np.isnan(value) or np.isinf(value)): return None",
  "    if isinstance(value, (str, int, float, bool)): return value",
  "    return str(value)",
  "",
  "def __validator_value(value):",
  "    if isinstance(value, np.generic): return value.item()",
  "    return value",
  "",
  "def __run_attempt(__csv_text, __sep, __prepare, __setup, __user_code, __validator):",
  "    __stdout, __stderr = io.StringIO(), io.StringIO()",
  "    __result, __error, __validator_error = None, None, None",
  "    __passed = False",
  "    __last_display = None",
  "    plt.close('all')",
  "    try:",
  "        __source_df = pd.read_csv(io.StringIO(__csv_text), sep=__sep, engine='python')",
  "        __env = {'pd': pd, 'np': np, 'plt': plt, 'sns': sns, 'sklearn': sklearn, 'original_df': __source_df.copy(deep=True), 'df': __source_df.copy(deep=True)}",
  "        if str(__prepare).strip():",
  "            try:",
  "                __prepare_tree = ast.parse(__prepare, mode='eval')",
  "                __prepared_df = eval(compile(__prepare_tree, '<prepare>', 'eval'), __env, __env)",
  "            except SyntaxError:",
  "                exec(compile(ast.parse(__prepare, mode='exec'), '<prepare>', 'exec'), __env, __env)",
  "                __prepared_df = __env.get('df')",
  "            if not isinstance(__prepared_df, pd.DataFrame):",
  "                raise TypeError('Dataset prepare metadata must produce a DataFrame.')",
  "        else:",
  "            __prepared_df = __source_df.copy(deep=True)",
  "        __original_df = __source_df.copy(deep=True)",
  "        __df = __prepared_df.copy(deep=True)",
  "        __env['original_df'] = __original_df",
  "        __env['df'] = __df",
  "        def __display(value):",
  "            __env['__last_display'] = value",
  "        __env['display'] = __display",
  "        if str(__setup).strip():",
  "            exec(compile(ast.parse(__setup, mode='exec'), '<setup>', 'exec'), __env, __env)",
  "        __tree = ast.parse(__user_code, mode='exec')",
  "        with contextlib.redirect_stdout(__stdout), contextlib.redirect_stderr(__stderr):",
  "            if __tree.body and isinstance(__tree.body[-1], ast.Expr):",
  "                __last = __tree.body.pop()",
  "                exec(compile(__tree, '<lesson>', 'exec'), __env, __env)",
  "                __result = eval(compile(ast.Expression(__last.value), '<lesson>', 'eval'), __env, __env)",
  "            else:",
  "                exec(compile(__tree, '<lesson>', 'exec'), __env, __env)",
  "                __result = __env.get('__last_display')",
  "        __env['result'] = __result",
  "        __env['output'] = __result",
  "        if str(__validator).strip():",
  "            try:",
  "                try:",
  "                    __validator_tree = ast.parse(__validator, mode='eval')",
  "                    __passed = bool(__validator_value(eval(compile(__validator_tree, '<validator>', 'eval'), __env, __env)))",
  "                except SyntaxError:",
  "                    exec(compile(ast.parse(__validator, mode='exec'), '<validator>', 'exec'), __env, __env)",
  "                    __passed = bool(__env.get('valid', __env.get('__valid__', False)))",
  "            except Exception:",
  "                __validator_error = traceback.format_exc()",
  "                __passed = False",
  "        else:",
  "            __validator_error = 'No trusted output validator is configured for this checkpoint.'",
  "            __passed = False",
  "    except Exception:",
  "        __error = traceback.format_exc()",
  "    __table = None",
  "    if __error is None and isinstance(__result, pd.Series):",
  "        __result = __result.to_frame()",
  "    if __error is None and isinstance(__result, pd.DataFrame):",
  "        __shown = __result.head(50).iloc[:, :20]",
  "        __table = {'columns': [str(c) for c in __shown.columns], 'rows': [[__safe(v) for v in row] for row in __shown.to_numpy().tolist()], 'rowCount': int(len(__result)), 'columnCount': int(len(__result.columns))}",
  "    __charts = []",
  "    for __number in plt.get_fignums():",
  "        try:",
  "            __fig = plt.figure(__number)",
  "            __buffer = io.BytesIO()",
  "            __fig.savefig(__buffer, format='png', dpi=125, bbox_inches='tight', facecolor='#fffaf0')",
  "            __charts.append('data:image/png;base64,' + base64.b64encode(__buffer.getvalue()).decode('ascii'))",
  "        except Exception:",
  "            pass",
  "    plt.close('all')",
  "    __value = None",
  "    if __error is None and __table is None and __result is not None:",
  "        try: __value = str(__result)",
  "        except Exception: __value = None",
  "    return {'status': 'error' if __error else 'ok', 'passed': bool(__passed) if __error is None else False, 'error': __error, 'validatorError': __validator_error, 'stdout': __stdout.getvalue(), 'stderr': __stderr.getvalue(), 'table': __table, 'charts': __charts, 'value': __value}"
].join("\n");

async function boot() {
  if (ready) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    pyodide = await loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"});
    await pyodide.loadPackage(["pandas", "numpy", "matplotlib", "scipy", "scikit-learn", "micropip"]);
    await pyodide.runPythonAsync("import micropip; await micropip.install('seaborn==0.13.2')");
    await pyodide.runPythonAsync(PY_BOOT);
    await pyodide.runPythonAsync(PY_RUN);
    ready = true;
  })().catch(error => { bootPromise = null; throw error; });
  return bootPromise;
}

function post(id, payload) { self.postMessage({id, ...payload}); }
async function handle(data) {
  try {
    await boot();
    if (data.type !== 'run') throw new Error('Unknown runtime request.');
    pyodide.globals.set('__csv_text', data.csv || '');
    pyodide.globals.set('__sep', data.sep || ',');
    pyodide.globals.set('__prepare', data.prepare || '');
    pyodide.globals.set('__setup', data.setup || '');
    pyodide.globals.set('__user_code', data.code || '');
    pyodide.globals.set('__validator', data.validator || '');
    const raw = await pyodide.runPythonAsync("json.dumps(__run_attempt(__csv_text, __sep, __prepare, __setup, __user_code, __validator), default=str)");
    post(data.id, {ok: true, output: JSON.parse(raw)});
  } catch (error) {
    post(data.id, {ok: false, error: error && error.message ? error.message : String(error)});
  }
}
self.onmessage = event => { queue = queue.then(() => handle(event.data)); };
`;
  }

  function ensureWorker() {
    if (state.worker) return state.worker;
    if (typeof Worker !== "function") throw new Error("This browser does not support Web Workers. Try a current browser over a local HTTP server.");
    const blob = new Blob([workerSource()], { type: "text/javascript" });
    state.worker = new Worker(URL.createObjectURL(blob));
    state.worker.onmessage = event => {
      const request = state.workerPending.get(event.data.id);
      if (!request) return;
      state.workerPending.delete(event.data.id);
      if (event.data.ok) request.resolve(event.data.output);
      else request.reject(new Error(event.data.error || "Pyodide runtime error."));
    };
    state.worker.onerror = event => {
      const error = new Error(event.message || "The Python worker stopped unexpectedly.");
      state.workerPending.forEach(request => request.reject(error));
      state.workerPending.clear();
      state.worker = null;
    };
    return state.worker;
  }

  function runInWorker(payload) {
    const worker = ensureWorker();
    return new Promise((resolve, reject) => {
      const id = ++state.workerSequence;
      state.workerPending.set(id, { resolve, reject });
      worker.postMessage({ id, type: "run", ...payload });
    });
  }

  function selectBlock(blockId, context) {
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    const ex = activityData(context.lesson, activity);
    const arrangement = initialArrangement(context.topic, context.lesson, ex, session.activityIndex);
    const block = arrangement.blocks.find(item => item.id === blockId);
    if (!block || (arrangement.used.has(block.id) && !block.repeatable)) return;
    arrangement.selected.push(block);
    if (!block.repeatable) arrangement.used.add(block.id);
    invalidateActivityResult(context);
    renderLessonExerciseOnly(context);
  }

  function removeBlock(blockId, context) {
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    const ex = activityData(context.lesson, activity);
    const arrangement = initialArrangement(context.topic, context.lesson, ex, session.activityIndex);
    const index = arrangement.selected.findIndex(block => block.id === blockId);
    if (index < 0) return;
    const [removed] = arrangement.selected.splice(index, 1);
    if (!removed.repeatable) arrangement.used.delete(removed.id);
    invalidateActivityResult(context);
    renderLessonExerciseOnly(context);
  }

  function undoBlock(context) {
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    const ex = activityData(context.lesson, activity);
    const arrangement = initialArrangement(context.topic, context.lesson, ex, session.activityIndex);
    const removed = arrangement.selected.pop();
    if (removed && !removed.repeatable) arrangement.used.delete(removed.id);
    invalidateActivityResult(context);
    renderLessonExerciseOnly(context);
  }

  function invalidateActivityResult(context) {
    const session = lessonSession(context.topic, context.lesson);
    const key = codeKey(context.topic.id, context.lesson.id, session.activityIndex);
    delete session.passed[session.activityIndex];
    delete session.feedback[session.activityIndex];
    state.lastResults.delete(key);
    state.currentResult = null;
  }

  function resetCode(context, clear = false) {
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    const ex = activityData(context.lesson, activity);
    const key = codeKey(context.topic.id, context.lesson.id, session.activityIndex);
    if (ex.type === "arrange" && ex.blocks.length) {
      state.arrangements.delete(key);
    } else {
      state.codes.set(key, clear ? "" : ex.starterCode);
      const editor = $("#lessonCode", root);
      if (editor) editor.value = clear ? "" : ex.starterCode;
    }
    const output = $("#lessonOutput", root);
    if (output) output.innerHTML = '<div class="output-placeholder">Run the cell to test the result.</div>';
    delete session.passed[session.activityIndex];
    delete session.feedback[session.activityIndex];
    state.lastResults.delete(key);
    state.currentResult = null;
    renderLessonExerciseOnly(context);
  }

  function renderLessonExerciseOnly(context) {
    renderLesson(context.topic, context.lesson);
  }

  function continueLesson(context) {
    const lessons = lessonsOf(context.topic);
    const index = lessons.findIndex(item => item.id === context.lesson.id);
    const session = lessonSession(context.topic, context.lesson);
    if (!session.complete) {
      announce("Finish every activity in this lesson before leaving it.", "info");
      return;
    }
    if (index >= lessons.length - 1) {
      hideCelebration();
      navigate("journey", context.topic.id);
      return;
    }
    navigate("lesson", context.topic.id, lessons[index + 1].id);
  }

  function finishLesson(context) {
    const session = lessonSession(context.topic, context.lesson);
    if (session.complete) return;
    if (session.mistakes.length || session.mistakeQueue.length) {
      beginMistakeReview(context);
      return;
    }
    const added = markLessonComplete(context.topic, context.lesson);
    session.complete = true;
    session.xpAwarded = added;
    saveProgress();
    if (added) announce(`Lesson complete. ${Number(context.lesson.xp) || 25} XP added.`, "success");
    renderLesson(context.topic, context.lesson);
    const lessonIndex = lessonsOf(context.topic).findIndex(item => item.id === context.lesson.id);
    if (added && lessonIndex === lessonsOf(context.topic).length - 1) showCelebration(context.topic, context.lesson);
  }

  function continueActivity(context) {
    const session = lessonSession(context.topic, context.lesson);
    if (session.complete) return continueLesson(context);
    const activities = lessonActivities(context.lesson);
    const index = Math.min(Math.max(0, Number(session.activityIndex) || 0), activities.length - 1);
    const activity = activities[index] || {};
    const type = activityType(activity);
    const passed = Boolean(session.passed[index]) || Boolean(state.lastResults.get(codeKey(context.topic.id, context.lesson.id, index))?.passed);
    if (["demonstrate", "output-observation"].includes(type) && !session.revealed[index]) {
      announce(type === "output-observation" ? "Show the output clue before continuing." : "Reveal the worked example before continuing.", "info");
      return;
    }
    if (["choice", "arrange", "modify", "complete", "free-code"].includes(type) && !passed) {
      announce(type === "choice" ? "Choose the correct answer before continuing." : "Run the code and satisfy the output check before continuing.", "info");
      return;
    }
    session.passed[index] = true;
    return advanceActivity(context, index);
  }

  function chooseChoice(context, optionIndex) {
    const session = lessonSession(context.topic, context.lesson);
    const activities = lessonActivities(context.lesson);
    const activity = activities[session.activityIndex] || {};
    if (activityType(activity) !== "choice" || session.feedback[session.activityIndex]?.correct) return;
    session.choices[session.activityIndex] = Number(optionIndex);
    renderLesson(context.topic, context.lesson);
    const option = $(`.choice-option[data-option="${Number(optionIndex)}"]`, root);
    if (option) option.focus();
  }

  function checkChoice(context) {
    const session = lessonSession(context.topic, context.lesson);
    const activities = lessonActivities(context.lesson);
    const activity = activities[session.activityIndex] || {};
    const data = activityData(context.lesson, activity);
    const selected = session.choices[session.activityIndex];
    if (selected == null) return announce("Choose an answer first.", "info");
    const selectedOption = data.options[Number(selected)];
    const answerText = typeof data.answer === "string" ? data.answer : null;
    const correct = answerText != null ? String(selectedOption?.label || "") === answerText : Number(selected) === data.answerIndex;
    session.feedback[session.activityIndex] = { correct, message: correct ? (data.explanation || "That is the right move.") : (data.failure || "Read the prompt again and try another option.") };
    if (correct) {
      session.passed[session.activityIndex] = true;
      announce("Correct. Continue when you are ready.", "success");
    } else {
      addMistake(context, session.activityIndex);
      announce("Not quite. You can try the choice again.", "info");
    }
    renderLesson(context.topic, context.lesson);
  }

  function retryChoice(context) {
    const session = lessonSession(context.topic, context.lesson);
    const index = session.activityIndex;
    if (session.feedback[index]?.correct) return;
    delete session.feedback[index];
    renderLesson(context.topic, context.lesson);
  }

  function revealExample(context) {
    const session = lessonSession(context.topic, context.lesson);
    const activity = lessonActivities(context.lesson)[session.activityIndex] || {};
    if (!["demonstrate", "output-observation"].includes(activityType(activity))) return;
    session.revealed[session.activityIndex] = true;
    session.passed[session.activityIndex] = true;
    renderLesson(context.topic, context.lesson);
    focusInteraction(".demonstration-window.is-revealed", "center");
    announce("Example revealed. Notice the move, then continue.", "info");
  }

  function handleAction(action, target) {
    const context = currentLessonContext();
    const topicId = target.dataset.topic;
    const lessonId = target.dataset.lesson;
    if (action === "go-hub") { const activeTopicId = topicId || parseRoute().topicId; if (activeTopicId) state.selectedNodes.delete(activeTopicId); return navigate("hub"); }
    if (action === "go-journey") {
      const destinationTopic = topicId || context?.topic?.id;
      if (destinationTopic) state.selectedNodes.delete(destinationTopic);
      return destinationTopic ? navigate("journey", destinationTopic) : navigate("hub");
    }
    if (action === "select-lesson") {
      const topic = topicById(topicId);
      const lesson = topic && lessonsOf(topic).find(item => item.id === lessonId);
      if (!topic || !lesson) return;
      const index = lessonsOf(topic).findIndex(item => item.id === lesson.id);
      if (lessonState(topic, lesson, index) === "locked") return announce(lockReason(topic, index), "info");
      state.selectedNodes.set(topic.id, lesson.id);
      renderJourney(topic);
      focusInteraction(".lesson-popover.is-open", "center");
      return;
    }
    if (action === "deselect-lesson") {
      if (topicId) state.selectedNodes.delete(topicId);
      else if (currentLessonContext()?.topic) state.selectedNodes.delete(currentLessonContext().topic.id);
      const topic = topicById(topicId) || topicById(parseRoute().topicId);
      return topic ? renderJourney(topic) : navigate("hub");
    }
    if (action === "start-lesson") {
      const topic = topicById(topicId);
      const lesson = topic && lessonsOf(topic).find(item => item.id === lessonId);
      if (!topic || !lesson) return;
      const index = lessonsOf(topic).findIndex(item => item.id === lesson.id);
      const currentState = lessonState(topic, lesson, index);
      if (currentState === "locked") return announce(lockReason(topic, index), "info");
      if (currentState === "completed") restartLessonForReview(topic, lesson);
      return navigate("lesson", topic.id, lesson.id);
    }
    if (action === "locked-lesson") {
      const topic = topicById(topicId);
      const lesson = topic && lessonsOf(topic).find(item => item.id === lessonId);
      if (topic && lesson) announce(lockReason(topic, lessonsOf(topic).findIndex(item => item.id === lesson.id)), "info");
      return;
    }
    if (action === "go-lesson") {
      const topic = topicById(topicId);
      const lesson = topic && lessonsOf(topic).find(item => item.id === lessonId);
      if (!topic || !lesson) return;
      const index = lessonsOf(topic).findIndex(item => item.id === lesson.id);
      if (lessonState(topic, lesson, index) === "locked") return announce(lockReason(topic, index), "info");
      return navigate("lesson", topic.id, lesson.id);
    }
    if (action === "reset-progress") return resetGuidedProgress();
    if (action === "retry-runtime") { state.runtimeError = null; return render(); }
    if (action === "dismiss-celebration") return hideCelebration();
    if (!context) return;
    if (action === "reveal-example") return revealExample(context);
    if (action === "run-lesson" || action === "run-activity") return runCurrentLesson();
    if (action === "continue-lesson") return continueLesson(context);
    if (action === "continue-activity") return continueActivity(context);
    if (action === "choose-choice") return chooseChoice(context, target.dataset.option);
    if (action === "check-choice") return checkChoice(context);
    if (action === "retry-choice") return retryChoice(context);
    if (action === "select-block") return selectBlock(target.dataset.blockId, context);
    if (action === "remove-block") return removeBlock(target.dataset.blockId, context);
    if (action === "undo-block") return undoBlock(context);
    if (action === "reset-code") return resetCode(context, false);
    if (action === "clear-code") return resetCode(context, true);
    if (action === "toggle-hint") {
      const panel = $("[data-hint]", root);
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      target.setAttribute("aria-expanded", String(open));
      return;
    }
  }

  root.addEventListener("click", event => {
    const target = event.target.closest?.("[data-action]");
    if (target && root.contains(target)) {
      event.preventDefault();
      handleAction(target.dataset.action, target);
    }
  });

  root.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const route = parseRoute();
      if (route.type === "lesson") { event.preventDefault(); navigate("journey", route.topicId); }
      else if (route.type === "journey") { event.preventDefault(); navigate("hub"); }
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && event.target.matches?.("[data-run-shortcut]")) {
      event.preventDefault(); runCurrentLesson(); return;
    }
    if ((event.key === "Enter" || event.key === " ") && event.target.matches?.(".code-block")) {
      event.preventDefault(); event.target.click();
    }
  });

  root.addEventListener("dragstart", event => {
    const block = event.target.closest?.(".code-block");
    if (!block || block.getAttribute("draggable") !== "true") return;
    state.dragBlockId = block.dataset.blockId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", state.dragBlockId);
    }
  });
  root.addEventListener("dragover", event => {
    if (event.target.closest?.("[data-drop-target=blocks]")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }
  });
  root.addEventListener("drop", event => {
    const target = event.target.closest?.("[data-drop-target=blocks]");
    if (!target) return;
    event.preventDefault();
    const context = currentLessonContext();
    const id = event.dataTransfer?.getData("text/plain") || state.dragBlockId;
    if (context && id) selectBlock(id, context);
    state.dragBlockId = null;
  });

  root.addEventListener("input", event => {
    if (!event.target.matches?.("#lessonCode")) return;
    const context = currentLessonContext();
    if (!context) return;
    const session = lessonSession(context.topic, context.lesson);
    state.codes.set(codeKey(context.topic.id, context.lesson.id, session.activityIndex), event.target.value);
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("popstate", render);
  window.addEventListener("learningcurriculumready", render);
  if (!window.location.hash) window.history.replaceState(null, "", "#hub");
  initTheme();
  render();

  window.DSPYGuidedLearning = {
    render,
    navigate,
    resetProgress: resetGuidedProgress,
    getProgress: () => ({ version: state.progress.version, completed: structuredCloneSafe(state.progress.completed), xp: state.progress.xp })
  };

  function structuredCloneSafe(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }
})();
