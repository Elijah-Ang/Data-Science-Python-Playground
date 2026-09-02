(() => {
  "use strict";

  /* A deterministic canvas network keeps the hero visual crisp, light, and alive
     without shipping a heavy image or a third-party rendering runtime. */
  const initNeuralCanvas = () => {
    const canvas = document.querySelector("#neuralCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // One compact input column, three hidden columns, and one compact output
    // column. Keeping the x coordinates stable makes the feed-forward shape
    // readable even while the nodes breathe in depth.
    const layerPositions = [0.10, 0.30, 0.47, 0.64, 0.90];
    // Equal hidden-column counts and fixed slots keep the graph legible as a
    // feed-forward network instead of a cloud of unrelated points.
    const layerCounts = [6, 9, 9, 9, 4];
    const palette = { input: "#c75b20", hidden: "#7651a6", output: "#137c9c" };
    let width = 1;
    let height = 1;
    let dpr = 1;
    let nodes = [];
    let edges = [];

    const pseudo = value => {
      const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const buildNetwork = () => {
      nodes = [];
      edges = [];
      layerPositions.forEach((position, layer) => {
        const count = layerCounts[layer];
        for (let index = 0; index < count; index += 1) {
          const seed = layer * 101 + index * 17;
          const isInput = layer === 0;
          const isOutput = layer === layerPositions.length - 1;
          nodes.push({
            layer,
            index,
            group: isInput ? "input" : isOutput ? "output" : "hidden",
            x: position,
            y: .12 + (index + 1) / (count + 1) * .76,
            z: (pseudo(seed + 3) - .5) * .9,
            phase: pseudo(seed + 7) * Math.PI * 2,
            radius: isInput ? 4.1 : isOutput ? 4.4 : 2.45,
            color: isInput ? palette.input : isOutput ? palette.output : palette.hidden
          });
        }
      });

      for (let layer = 0; layer < layerPositions.length - 1; layer += 1) {
        const left = nodes.filter(node => node.layer === layer);
        const right = nodes.filter(node => node.layer === layer + 1);
        left.forEach((from, fromIndex) => {
          // Map each node to its nearest slot in the next column, with one
          // adjacent branch. This preserves the familiar fan while avoiding
          // the dense criss-cross that obscures the layer boundaries.
          const center = Math.round((fromIndex / Math.max(1, left.length - 1)) * (right.length - 1));
          const targetIndexes = [...new Set([center, Math.min(right.length - 1, center + (fromIndex % 2 ? 1 : -1))])];
          targetIndexes.forEach((targetIndex, edgeIndex) => {
            const to = right[targetIndex];
            if (to) edges.push({ from, to, phase: pseudo(layer * 37 + fromIndex * 11 + edgeIndex * 5) });
          });
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNetwork();
    };

    const point = (node, time) => {
      // Keep the columns fixed, but make the depth pulse read clearly as a
      // quick in/out processing pass instead of a slow, barely perceptible
      // drift. The modest amplitude keeps neighbouring layers separated.
      const breathing = Math.sin(time * .0032 + node.phase) * .016;
      const depth = node.z + Math.sin(time * .0036 + node.phase) * .22;
      const scale = .78 + depth * .28;
      return {
        x: width * (node.x + depth * .032),
        y: height * (node.y + breathing + depth * .025),
        scale
      };
    };

    const draw = time => {
      const now = Number.isFinite(time) ? time : 0;
      ctx.clearRect(0, 0, width, height);

      /* Hairline planes make the five columns legible as input, hidden, and
         output layers without putting a card or labels over the network. */
      const regionColors = [
        "rgba(199, 91, 32, .025)",
        "rgba(118, 81, 166, .026)",
        "rgba(19, 124, 156, .025)"
      ];
      [[.035, .20], [.235, .755], [.80, .965]].forEach(([start, end], regionIndex) => {
        const region = ctx.createLinearGradient(width * start, 0, width * end, 0);
        region.addColorStop(0, "rgba(255, 255, 255, 0)");
        region.addColorStop(.5, regionColors[regionIndex]);
        region.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = region;
        ctx.fillRect(width * start, height * .07, width * (end - start), height * .86);
      });
      const guideColors = [
        "rgba(199, 91, 32, .24)",
        "rgba(118, 81, 166, .16)",
        "rgba(118, 81, 166, .16)",
        "rgba(118, 81, 166, .16)",
        "rgba(19, 124, 156, .26)"
      ];
      ctx.save();
      ctx.setLineDash([2, 9]);
      layerPositions.forEach((layerX, layerIndex) => {
        const px = width * layerX;
        ctx.beginPath();
        ctx.moveTo(px, height * .08);
        ctx.lineTo(px, height * .92);
        ctx.strokeStyle = guideColors[layerIndex];
        ctx.lineWidth = layerIndex === 0 || layerIndex === layerPositions.length - 1 ? 1.7 : .85;
        ctx.stroke();
      });
      ctx.restore();

      edges.forEach(edge => {
        const from = point(edge.from, now);
        const to = point(edge.to, now);
        const alpha = .13 + ((from.scale + to.scale) / 2 - .72) * .16;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(29, 67, 92, ${Math.max(.075, alpha)})`;
        ctx.lineWidth = .7 + Math.max(0, (from.scale + to.scale - 1.48) * .4);
        ctx.stroke();

        const progress = (now * .00078 + edge.phase) % 1;
        const signal = progress < .82 ? progress / .82 : 1 - (progress - .82) / .18;
        const sx = from.x + (to.x - from.x) * progress;
        const sy = from.y + (to.y - from.y) * progress;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
        glow.addColorStop(0, "rgba(255, 207, 103, .82)");
        glow.addColorStop(1, "rgba(255, 207, 103, 0)");
        ctx.globalAlpha = Math.max(0, signal);
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 9, sy - 9, 18, 18);
        ctx.globalAlpha = 1;
      });

      nodes.forEach(node => {
        const position = point(node, now);
        const pulse = 1 + Math.sin(now * .0038 + node.phase) * .16;
        const radius = node.radius * position.scale * pulse;
        const glow = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, radius * 4.2);
        glow.addColorStop(0, `${node.color}99`);
        glow.addColorStop(1, `${node.color}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius * 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 250, 240, .82)";
        ctx.lineWidth = .7;
        ctx.stroke();
      });

      canvas.dataset.neuralFrame = String(Math.round(now));
      if (!reduced) window.requestAnimationFrame(draw);
    };

    resize();
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }
    draw(0);
  };

  initNeuralCanvas();

  const steps = [...document.querySelectorAll("[data-story-step]")];
  const shots = [...document.querySelectorAll(".workspace-shot[data-shot]")];
  const callouts = [...document.querySelectorAll(".shot-callout[data-step]")];
  const caption = document.querySelector("[data-stage-caption]");
  const stageLabel = document.querySelector("[data-stage-label]");
  if (!steps.length || !shots.length) return;

  const show = step => {
    steps.forEach(item => item.classList.toggle("is-active", item === step));
    const stepId = step?.dataset.step || String(Math.max(0, steps.indexOf(step)) + 1);
    callouts.forEach(callout => callout.classList.toggle("is-focus", callout.dataset.step === stepId));
    const shotId = step?.dataset.shot || steps[0].dataset.shot;
    shots.forEach(shot => { shot.hidden = shot.dataset.shot !== shotId; });
    if (stageLabel) stageLabel.textContent = shotId === "ml" ? "MACHINE LEARNING" : "DATA PLAYGROUND";
    if (caption && step?.dataset.caption) caption.textContent = step.dataset.caption;
  };

  show(steps[0]);
  // Read the breakpoint at sync time rather than only on page load. The
  // in-app browser can be resized into phone mode without a reload, and the
  // final card must still be selected using the lower mobile reading anchor.
  const compactQuery = window.matchMedia("(max-width: 980px)");
  const storyStage = document.querySelector(".story-stage");
  let ticking = false;
  const syncVisibleStep = () => {
    ticking = false;
    const compact = compactQuery.matches;
    const activeShot = shots.find(shot => !shot.hidden);
    const activeShotRect = activeShot?.getBoundingClientRect();
    const stageRect = storyStage?.getBoundingClientRect();
    // On a stacked phone layout, choose the note from the open reading area
    // below the pinned map. This keeps the active explanation from being
    // selected while its heading is still hidden behind the enlarged stage.
    const lowerReadingAnchor = stageRect && stageRect.bottom < window.innerHeight
      ? stageRect.bottom + (window.innerHeight - stageRect.bottom) * .52
      : window.innerHeight * .66;
    const anchor = compact
      ? Math.min(window.innerHeight - 52, lowerReadingAnchor)
      : activeShotRect
        ? activeShotRect.top + activeShotRect.height / 2
        : window.innerHeight * .46;
    const visible = steps
      .map(step => ({ step, rect: step.getBoundingClientRect() }))
      .filter(item => item.rect.bottom > 84 && item.rect.top < window.innerHeight - 12)
      .sort((a, b) => {
        const aPosition = compact ? (a.rect.top + a.rect.bottom) / 2 : a.rect.top;
        const bPosition = compact ? (b.rect.top + b.rect.bottom) / 2 : b.rect.top;
        return Math.abs(aPosition - anchor) - Math.abs(bPosition - anchor);
      })[0];
    if (visible) show(visible.step);
  };
  const scheduleSync = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(syncVisibleStep);
    }
  };
  window.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync);
  compactQuery.addEventListener?.("change", scheduleSync);
  syncVisibleStep();

  steps.forEach(step => {
    step.addEventListener("focusin", () => show(step));
    step.addEventListener("mouseenter", () => show(step));
  });
})();
