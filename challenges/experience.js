(function(root) {
  "use strict";
  function createChallengeExperience(registry, adapters = {}) {
    const collectionInfo = registry.collection;
    const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const all = registry.challenges;
    const url = (c) => `#${c.deck}/challenges/${c.id}`;
    function tabs(deck, active) {
      return `<nav class="challenge-mode-tabs" aria-label="Learning mode"><a href="${esc(collectionInfo.lessonsHref ?? ("#"+deck.id))}" ${active === "lessons" ? 'aria-current="page"' : ""}>${esc(collectionInfo.lessonsLabel || "Lessons & Reviews")}</a><a href="#${deck.id}/challenges" ${active === "challenges" ? 'aria-current="page"' : ""}>${esc(collectionInfo.title)}</a></nav>`;
    }
    // Finer 64-unit grid: two-unit outlines and short stair steps retain the pixel character.
    // Each illustration is a single unobstructed scenario silhouette.
    function illustration({ family }) {
      if(adapters.illustration)return adapters.illustration(family);
      const scenes = {
        delivery: `
          <path class="pixel-shadow" d="M8 54h48v2H8z"/>
          <path class="pixel-outline" d="M7 20h32v8h10v2h2v2h2v2h2v2h2v3h3v11H7z"/>
          <path class="pixel-face" d="M9 22h28v24H9zM39 30h9v2h2v2h2v2h2v4h4v8H39z"/>
          <path class="pixel-light" d="M11 24h24v14H11zM41 31h6v2h2v2h2v3H41z"/>
          <path class="pixel-accent" d="M11 40h24v4H11zM41 40h5v2h-5zM55 43h3v3h-3z"/>
          <path class="pixel-outline" d="M15 44h8v2h2v2h2v5h-2v2h-2v2h-8v-2h-2v-2h-2v-5h2v-2h2zM45 44h8v2h2v2h2v5h-2v2h-2v2h-8v-2h-2v-2h-2v-5h2v-2h2z"/>
          <path class="pixel-light" d="M16 48h6v5h-6zM46 48h6v5h-6z"/>
          <path class="pixel-accent" d="M5 12h15v2H5zM2 16h10v2H2z"/>`,
        cafe: `
          <path class="pixel-shadow" d="M10 54h43v2H10z"/>
          <path class="pixel-outline" d="M12 23h34v3h8v2h3v3h2v10h-2v3h-3v2H43v4h-3v3H21v-2h-4v-3h-3v-7h-2z"/>
          <path class="pixel-face" d="M14 25h30v16h-2v6h-3v3H22v-2h-4v-3h-2v-6h-2z"/>
          <path class="pixel-light" d="M16 27h26v4H16zM46 29h7v2h3v10h-3v2H44v-3h2z"/>
          <path class="pixel-accent" d="M19 35h19v2H19zM22 39h13v2H22zM8 54h48v2H8z"/>
          <path class="pixel-outline" d="M22 7h2v4h-2v2h-2v3h2v3h-2v-2h-2v-5h2v-2h2zM35 7h2v4h-2v2h-2v3h2v3h-2v-2h-2v-5h2v-2h2z"/>`,
        study: `
          <path class="pixel-shadow" d="M6 51h52v3H6z"/>
          <path class="pixel-outline" d="M5 17h15v1h6v2h4v2h4v-2h4v-2h6v-1h15v35H42v1h-5v2H27v-2h-5v-1H5z"/>
          <path class="pixel-face" d="M7 19h13v1h6v2h4v29h-3v-1h-5v-1H7zM34 22h4v-2h6v-1h13v30H42v1h-5v1h-3z"/>
          <path class="pixel-light" d="M9 21h11v1h6v2h2v21h-7v-1H9zM36 24h2v-2h6v-1h11v23H43v1h-7z"/>
          <path class="pixel-outline" d="M31 24h2v28h-2z"/>
          <path class="pixel-accent" d="M11 28h12v2H11zM11 34h13v2H11zM11 40h9v2h-9zM40 28h12v2H40zM40 34h12v2H40zM40 40h8v2h-8zM45 13h6v15h-2v-2h-2v-2h-2z"/>`,
        sales: `
          <path class="pixel-shadow" d="M9 54h46v2H9z"/>
          <path class="pixel-outline" d="M16 13h31v2h3v3h2v3h2v4h2v29H8V25h2v-4h2v-3h2v-3h2z"/>
          <path class="pixel-face" d="M17 15h29v2h3v3h2v4h2v3H11v-3h2v-4h2v-3h2zM10 30h44v22H10z"/>
          <path class="pixel-light" d="M18 17h27v2H18zM12 32h40v4H12z"/>
          <path class="pixel-accent" d="M28 15h7v12h-7zM28 30h7v12h-2v-2h-3v2h-2z"/>
          <path class="pixel-outline" d="M14 41h9v2h-9zM14 45h6v2h-6zM44 43h2v5h-2zM48 41h2v7h-2z"/>`,
        activity: `
          <path class="pixel-shadow" d="M12 55h40v2H12z"/>
          <path class="pixel-outline" d="M14 12h36v2h3v3h2v38H9V17h2v-3h3z"/>
          <path class="pixel-face" d="M14 15h36v3h2v34H12V18h2z"/>
          <path class="pixel-light" d="M16 22h32v26H16z"/>
          <path class="pixel-outline" d="M25 7h14v3h5v10H20V10h5z"/>
          <path class="pixel-accent" d="M27 9h10v3h5v6H22v-6h5zM17 34h7v-4h2v-4h2v15h2v4h2v-8h2v-7h2v4h2v2h9v2H36v-1h-1v10h-7v-4h-2v-6h-9zM17 50h11v1H17zM34 50h13v1H34z"/>`
      };
      return `<svg class="case-illustration" viewBox="0 0 64 64" role="img" aria-label="${esc(registry.families[family])} scenario" shape-rendering="crispEdges">${scenes[family] || scenes.activity}</svg>`;
    }
    function collection(deck) {
      const entries = all.filter((c) => c.deck === deck.id);
      return `<header class="foundation-deck-heading"><span class="foundation-eyebrow">${esc(deck.title)} \xB7 ${esc(collectionInfo.briefLabel || "Practical data briefs")}</span><h2>${esc(collectionInfo.title)}</h2><p>${esc(collectionInfo.introduction)}</p>${tabs(deck, "challenges")}<p class="case-intro">${esc(collectionInfo.inputNote || "Choose any brief. Each uses small synthetic datasets and runs independently. Time estimates are loose guidance.")}</p></header><div class="case-collection-caption"><span>${entries.length} independent briefs</span><span>Open any case file <span aria-hidden="true">\u2197</span></span></div><div class="case-shelf">${entries.map((c) => `<a class="case-file" href="${url(c)}"><span class="case-tab">${esc(c.id)}</span>${illustration(c)}<div class="case-copy"><span class="case-family">${esc(registry.families[c.family])}</span><h3>${esc(c.title)}</h3><p>${esc(c.question)}</p><span class="case-flow">${c.inputs.some((i) => i.file) ? "CSV" : c.inputs.length > 1 ? "Tables" : "Table"} <span aria-hidden="true">\u2192</span> ${esc(c.deliverableType)}</span><div class="case-meta"><span>${esc(c.minutes)}</span><span>${c.tags.map(esc).join(" \xB7 ")}</span></div><span class="case-open">Open brief <span aria-hidden="true">\u2192</span></span></div><span class="case-corner" aria-hidden="true"></span></a>`).join("")}</div>`;
    }
    function inputPreview(input, table) {
      if(adapters.inputPreview)return adapters.inputPreview(input,table);
      const keys = Object.keys(input.columns), rows = input.columns[keys[0]].map((_, i) => keys.map((k) => input.columns[k][i]));
      const name = input.file || input.name;
      return `<section class="case-input"><h4>${esc(name)}</h4><p>${esc(input.description)}</p><details class="case-fields"><summary>Field meanings and units</summary><dl>${Object.entries(input.fields).map(([name2, meaning]) => `<dt>${esc(name2)}</dt><dd>${esc(meaning)}</dd>`).join("")}</dl></details>${table(keys, rows.slice(0, 5), `${name} \xB7 first ${Math.min(5, rows.length)} of ${rows.length} rows`)}${rows.length > 5 ? `<details><summary>View all ${rows.length} rows</summary>${table(keys, rows, `${name} \xB7 complete input`)}</details>` : ""}</section>`;
    }
    function solutionPanel(c) {
      return `<p class="case-solution-intro">Add these lines below <code># Your work</code> in the editor. The supplied input setup is already there.</p><pre class="case-solution-code"><code>${esc(c.solution)}</code></pre><details class="case-solution-setup"><summary>View supplied setup</summary><p>This code is already at the top of the editor.</p><pre><code>${esc(c.setup)}</code></pre></details><h4>Why these steps exist</h4><ul>${c.explanationSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ul><h4>Another valid approach</h4><p>${esc(c.alternative)}</p>`;
    }
    function page(c, deck, { table, pythonPane, curriculum }) {
      const entries = all.filter((x) => x.deck === c.deck), index = entries.indexOf(c);
      const round = { ...c, label: "Workflow challenge", steps: c.deliverables.map((d) => d.requirement), deliverables: c.deliverables, task: c.question, target: c.chart ? "plot" : "value" };
      const links = c.prerequisites.map((id) => {
        const l = curriculum.lessons.find((x) => x.id === id);
        return `<a href="#${l.deck}/${l.id}/0">${esc(l.title)}</a>`;
      }).join(" \xB7 ");
      return `<nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="${esc(collectionInfo.rootHref)}">${esc(collectionInfo.rootTitle)}</a>${collectionInfo.omitDeckCrumb?'':`<span>/</span><a href="#${c.deck}">${esc(deck.title)}</a>`}<span>/</span><a href="#${c.deck}/challenges">${esc(collectionInfo.title)}</a><span>/</span><span>${esc(c.id)}</span></nav><header class="foundation-lesson-heading case-heading"><div class="foundation-lesson-copy"><span class="foundation-eyebrow">${esc(c.id)} \xB7 ${esc(registry.families[c.family])} \xB7 ${esc(c.minutes)}</span><h2>${esc(c.title)}</h2><p>${esc(c.tags.join(" \xB7 "))}</p><button class="foundation-editor-jump" type="button">Go to editor \u2193</button></div><span class="case-deliverable-label">${esc(c.deliverableType)}</span></header><div class="foundation-split"><article class="foundation-content case-brief" aria-label="Challenge brief"><nav class="case-brief-nav" aria-label="Brief sections"><button type="button" data-brief-target="case-inputs">Inputs</button><button type="button" data-brief-target="case-deliverables">Deliverables</button><button type="button" data-brief-target="case-help">Help</button></nav><section class="case-question"><h3>The question</h3><p>${esc(c.question)}</p><div class="case-input-flow">${illustration(c)}<span>${c.inputs.map((i) => esc(i.file || i.name)).join(" + ")} <span aria-hidden="true">\u2192</span> ${esc(c.deliverableType)}</span></div></section><section id="case-inputs" tabindex="-1"><h3>Your inputs</h3>${c.inputs.map((i) => inputPreview(i, table)).join("")}<p class="case-input-note">${c.inputs.some((i) => i.file) ? "The file is available in the Python working folder. Load it yourself." : "The editable setup in Your Python creates these inputs when you run it."}</p></section><section class="case-requirements" id="case-deliverables" tabindex="-1"><h3>Deliverables</h3><p class="case-output-note">${esc(collectionInfo.contractNote || "Use these variable names and filenames so Check answer can inspect each result.")}</p>${adapters.deliverables?adapters.deliverables(c):`<ol>${c.deliverables.map((d) => `<li><div class="case-output-heading"><strong>${esc(d.label)}</strong><span class="case-output-contract"><span class="case-output-contract-label">Output</span><code>${esc(d.fileName || d.contract || d.name)}</code><span>${esc(d.format)}</span></span></div><p>${esc(d.requirement)}</p>${d.kind === "figure" ? `<p>${esc(chartLabels(c.chart))}</p>` : ""}</li>`).join("")}</ol>`}<p class="case-policy"><strong>Data policy</strong> ${c.policies.map(esc).join(" ")}</p></section>${c.planning.length ? `<aside class="case-planning"><h3>Before you code</h3>${c.planning.map((p) => `<p>${esc(p)}</p>`).join("")}<small>Optional thinking prompt \xB7 no answer to submit</small></aside>` : ""}<details class="case-help" id="case-help"><summary>Help <span>Hints &amp; explained solution</span></summary><p>Choose the amount of help you need. Opening one hint does not reveal the others.</p><details><summary>Hint 1 \u2014 Think</summary><p>${esc(c.hints.think)}</p></details><details><summary>Hint 2 \u2014 Tools</summary><p>${esc(c.hints.tools)}</p><p class="case-prerequisites">Revisit: ${links}</p></details><details><summary>Hint 3 \u2014 Approach</summary><p>${esc(c.hints.approach)}</p></details><details><summary>Explained solution</summary>${solutionPanel(c)}</details></details></article>${pythonPane(round, false, true)}</div><nav class="foundation-navigation" aria-label="Challenge navigation">${index ? `<a href="${url(entries[index - 1])}">\u2190 Previous challenge</a>` : "<span></span>"}<a href="#${c.deck}/challenges">All challenges</a>${index < entries.length - 1 ? `<a href="${url(entries[index + 1])}">Next challenge \u2192</a>` : "<span></span>"}</nav>`;
    }
    function chartLabels(rule) {
      return (rule.panels || [rule]).map((p, i) => `${rule.panels ? "Panel " + (i + 1) + ": " : ""}Identify ${p.xLabel} and ${p.yLabel} on the appropriate axes; extra wording is welcome.`).join(" ");
    }
    function results(result, stale = false) {
      if (!result.checked) return "";
      return `<div class="case-results-body" ${stale ? 'data-stale="true"' : ""}><h3>Check results <span>${stale ? "Previous run" : "This run only"}</span></h3>${result.error ? '<p class="case-run-error">Python stopped. Available outputs were checked; the error is shown below.</p>' : ""}${stale ? '<p class="case-stale">Code changed. These results describe the previous run.</p>' : ""}<ul>${result.deliverables.map((d) => `<li class="check-${esc(d.status)}"><span aria-hidden="true">${{ correct: "\u2713", "needs-attention": "\u25B3", unavailable: "\u25CB" }[d.status]}</span><div><strong>${esc(d.label)} \xB7 ${{ correct: "Correct", "needs-attention": "Needs attention", unavailable: "Unable to check" }[d.status]}</strong>${d.status === "correct" && d.message === "Matches the requested evidence." ? "" : `<p>${esc(d.message)}</p>`}</div></li>`).join("")}</ul></div>`;
    }
    function bind() {
      document.querySelectorAll("[data-brief-target]").forEach((button) => button.addEventListener("click", () => {
        const section = document.getElementById(button.dataset.briefTarget);
        const target = section.tagName === "DETAILS" ? section.querySelector("summary") : section;
        const brief = document.querySelector(".case-brief");
        if (matchMedia("(min-width: 801px)").matches) {
          const nav = brief.querySelector(".case-brief-nav");
          brief.scrollTop += target.getBoundingClientRect().top - brief.getBoundingClientRect().top - (nav?.offsetHeight || 0) - 12;
        } else target.scrollIntoView({ block: "start", behavior: "instant" });
        target.focus({ preventScroll: true });
      }));
      document.querySelectorAll(".case-brief .foundation-table-scroll").forEach((table) => {
        table.tabIndex = 0;
        table.setAttribute("role", "region");
        table.setAttribute("aria-label", table.querySelector("caption")?.textContent + "; scroll horizontally for more columns");
      });
    }
    return { all, tabs, collection, page, results, url, bind };
  }
  root.createChallengeExperience = createChallengeExperience;
  if(root.DataWorkflowChallenges)root.ChallengeExperience = createChallengeExperience(root.DataWorkflowChallenges);
})(window);
