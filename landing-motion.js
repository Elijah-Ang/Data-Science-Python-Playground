/* Independent moving pieces over an always-visible picture. */
(() => {
  'use strict';
  const scene = document.querySelector('[data-scene]');
  if (!scene) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1100px)');
  const artwork = scene.querySelector('.scene-art');
  const canvas = scene.querySelector('.garden-water');
  const crop = { x: 990, y: 815, width: 485, height: 216 };
  let away = false;
  let frame = 0;
  let lastFrame = 0;
  let water = null;
  let waterSource = '';

  function prepareWater() {
    if (!desktop.matches || reduced.matches || !canvas || !artwork?.complete || !artwork.naturalWidth) return;
    if (water && waterSource === artwork.currentSrc) return;
    // The picture changes asynchronously on resize. Wait for its desktop plate.
    if (!artwork.currentSrc.includes('garden-desktop-clean-v2')) return;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const texture = document.createElement('canvas');
      const mask = document.createElement('canvas');
      for (const layer of [texture, mask]) { layer.width = crop.width; layer.height = crop.height; }
      const textureContext = texture.getContext('2d');
      const maskContext = mask.getContext('2d');
      textureContext.drawImage(artwork, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const pixels = textureContext.getImageData(0, 0, crop.width, crop.height);
      const outline = new Path2D();
      const polygons = [
        [[1298,846],[1315,834],[1346,835],[1353,847],[1341,871],[1337,896],[1360,916],[1340,930],[1286,919],[1296,898]],
        [[1297,901],[1341,902],[1377,930],[1417,945],[1431,965],[1405,984],[1357,997],[1299,1003],[1248,1014],[1184,1012],[1125,1001],[1110,972],[1155,943],[1229,922],[1250,914]]
      ];
      for (const polygon of polygons) {
        outline.moveTo(polygon[0][0] - crop.x, polygon[0][1] - crop.y);
        for (const [x, y] of polygon.slice(1)) outline.lineTo(x - crop.x, y - crop.y);
        outline.closePath();
      }
      // Only blue water inside the shoreline moves. Bridge, duck, rocks and
      // lily pads stay stationary, including their edges.
      for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) {
        const i = (y * crop.width + x) * 4;
        const [r, g, b] = pixels.data.subarray(i, i + 3);
        const blue = Math.max(0, Math.min(1, (b - r - 25) / 35, (g - r - 20) / 35, (b - 110) / 50));
        pixels.data[i + 3] = maskContext.isPointInPath(outline, x, y) ? Math.round(255 * blue) : 0;
      }
      maskContext.putImageData(pixels, 0, 0);
      water = { ctx, texture, mask };
      waterSource = artwork.currentSrc;
      scene.dataset.water = 'ready';
    } catch (_) {
      water = null;
      scene.dataset.water = 'static';
    }
  }

  function drawWater(time) {
    const { ctx, texture, mask } = water;
    const t = time / 1000;
    ctx.clearRect(0, 0, crop.width, crop.height);
    ctx.globalCompositeOperation = 'source-over';
    for (let y = 0; y < crop.height; y += 2) {
      const falls = y < 98;
      const dx = Math.sin(y * .13 - t * (falls ? 4 : 2.2)) * (falls ? .7 : 1.2);
      const dy = falls ? Math.sin(y * .22 - t * 7) * 2.2 : Math.cos(y * .1 + t * 1.8) * .65;
      ctx.drawImage(texture, 0, y + dy, crop.width, 2, dx, y, crop.width, 2);
    }
    ctx.globalCompositeOperation = 'screen';
    // Highlights travel down the waterfall and fine ripples cross the pond.
    ctx.fillStyle = '#c4f8ff';
    for (let i = 0; i < 7; i++) {
      const y = 26 + ((t * 58 + i * 17) % 65);
      ctx.globalAlpha = .22 + .12 * Math.sin(t * 3 + i);
      ctx.fillRect(310 + i * 6, y, 1.5, 10);
    }
    ctx.strokeStyle = '#a8eefe';
    ctx.lineWidth = 1;
    ctx.globalAlpha = .16;
    for (let i = 0; i < 6; i++) {
      const y = 116 + i * 17 + Math.sin(t * 1.8 + i) * 2;
      const x = 138 + ((i * 47 + t * 9) % 235);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 13, y - 2, x + 27, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  function animate(time) {
    frame = 0;
    if (scene.dataset.paused === 'true' || !desktop.matches || !water) return;
    if (time - lastFrame >= 1000 / 30) { drawWater(time); lastFrame = time; }
    frame = requestAnimationFrame(animate);
  }

  function sync() {
    const paused = away || document.hidden || reduced.matches;
    scene.dataset.paused = String(paused);
    scene.dataset.motion = reduced.matches ? 'static' : 'ready';
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (reduced.matches || !desktop.matches) {
      scene.dataset.water = 'static';
      return;
    }
    prepareWater();
    if (water) {
      scene.dataset.water = 'ready';
      if (!paused) frame = requestAnimationFrame(animate);
    }
  }
  artwork?.addEventListener('load', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  desktop.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { away = true; sync(); });
  window.addEventListener('pageshow', () => { away = false; sync(); });
  sync();
})();
