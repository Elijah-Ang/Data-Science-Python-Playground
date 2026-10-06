/* Native input previews a gesture. Commit inserts immediately and requests one
   guarded run. Only the latest waiting choice runs; ordinary cell Run remains. */
(function (root) {
  'use strict';
  function mount(container, options) {
    let items = [], selectedId = null, committedId = null, dragging = false;
    let pendingId = null, active = null, epoch = 0, gesture = 0, lastCommit = '', scheduled = false;
    const attempts = new Map(), id = container.id || 'route';
    container.classList.add('step-route'); container.replaceChildren();
    const rail = document.createElement('div'); rail.className = 'step-route-rail';
    const range = document.createElement('input'); range.type = 'range'; range.min = '0'; range.step = '1';
    range.className = 'step-route-range'; range.setAttribute('aria-label', options.name || 'Choose a route step');
    range.tabIndex = 0; range.setAttribute('aria-describedby', id + '-help');
    const stops = document.createElement('div'); stops.className = 'step-route-stops'; stops.setAttribute('aria-hidden', 'true');
    rail.append(range, stops);
    const info = document.createElement('div'); info.className = 'step-route-info';
    const number = document.createElement('span'); number.className = 'step-route-number';
    const label = document.createElement('strong'); label.className = 'step-route-label'; label.id = id + '-label';
    info.append(number, label);
    const help = document.createElement('span'); help.id = id + '-help'; help.className = 'step-route-help';
    help.textContent = 'Move to a stop to add and run its editable cell. A drag runs only the released stop. Earlier steps and Python must be ready; the latest waiting selection runs when ready. Successful unchanged cells are reused. Step 0 keeps cells and cancels a waiting selection. Arrow keys, Home and End select stops. Manual cell Run remains available.';
    container.append(rail, info, help);
    const index = value => value === null ? 0 : Math.max(0, items.findIndex(item => item.id === value) + 1);
    function paint() {
      const i = index(selectedId), item = items[i - 1], policy = item ? options.state?.(item, i - 1) : null;
      if (range.max !== String(items.length)) range.max = String(items.length);
      if (range.value !== String(i)) range.value = String(i);
      range.disabled = !items.length;
      const waiting = item && pendingId === item.id;
      const state = policy?.fatal ? 'unavailable' : policy?.status === 'running' ? 'running' : policy?.permanent && policy?.status !== 'done' ? 'used once' : waiting ? policy?.blocked ? policy.short || 'waiting' : 'queued' : policy?.status === 'error' ? 'fix code' : '';
      number.textContent = i + ' / ' + items.length;
      label.textContent = (!items.length ? options.emptyState?.() === 'error' ? 'Route unavailable' : 'Preparing route' : item ? (options.label?.(item) || item.title) : 'Choose a step') + (state && !dragging ? ' · ' + state : '');
      const message = !items.length ? options.emptyText?.() || 'Wait for the dataset.' : !item ? 'Existing cells are kept. No waiting step will run.' : dragging ? 'Release to add and run this step. Preview movement runs no code.' : policy?.message || 'The selected cell runs when its prerequisites are ready.';
      range.setAttribute('aria-valuetext', 'Step ' + i + ' of ' + items.length + ': ' + label.textContent + '. ' + message);
      info.title = message; container.dataset.preview = String(dragging); container.dataset.pending = pendingId || '';
      stops.replaceChildren(...[null, ...items].map((step, n) => {
        const stop = document.createElement('span'); stop.className = 'step-route-stop';
        const state = step ? options.state?.(step, n - 1) : null;
        stop.dataset.taskId = step?.id || ''; stop.dataset.index = n; stop.dataset.selected = String(n === i);
        stop.dataset.state = !step ? 'start' : state?.status === 'done' ? 'done' : state?.status || 'ready';
        stop.style.left = (items.length ? n * 100 / items.length : 0) + '%'; return stop;
      }));
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true; queueMicrotask(() => { scheduled = false; drain(); });
    }
    async function drain() {
      if (dragging || active || !pendingId) return;
      const item = items.find(item => item.id === pendingId);
      if (!item) { pendingId = null; paint(); return; }
      const policy = options.state?.(item, items.indexOf(item)) || {};
      if (policy.status === 'done' || policy.fatal || policy.permanent) { pendingId = null; paint(); return; }
      if (policy.blocked || policy.status === 'running') { paint(); return; }
      const key = options.key?.(item) ?? item.id;
      // A stale result represents changed shared Python state even when its
      // source text is identical. Only an unchanged failed attempt is reused;
      // successful cells were handled above, and pending/running work is guarded.
      if (policy.status === 'error' && attempts.get(item.id) === key) { pendingId = null; paint(); return; }
      const token = epoch;
      attempts.set(item.id, key); pendingId = null; active = {id:item.id, epoch:token};
      try { await options.run(item); }
      catch (error) { options.onError?.(error); }
      finally {
        if (active?.epoch === token && active.id === item.id) active = null;
        paint(); if (pendingId) schedule();
      }
    }
    function commit() {
      dragging = false;
      const signature = epoch + ':' + gesture + ':' + (selectedId || '0');
      if (signature === lastCommit) { paint(); return; }
      lastCommit = signature; committedId = selectedId; pendingId = selectedId;
      const item = items[index(selectedId) - 1];
      if (item) Promise.resolve(options.insert(item)).catch(error => options.onError?.(error));
      paint(); schedule();
    }
    function begin() { if (!dragging) gesture++; dragging = true; range.focus({preventScroll:true}); }
    range.addEventListener('pointerdown', begin); range.addEventListener('touchstart', begin, {passive:true});
    range.addEventListener('input', () => { selectedId = items[Number(range.value) - 1]?.id || null; paint(); });
    range.addEventListener('change', () => { if (!dragging) commit(); });
    range.addEventListener('pointerup', commit);
    function cancel() { dragging = false; selectedId = committedId; paint(); schedule(); }
    range.addEventListener('pointercancel', event => {
      // Successful native WebKit touch taps hand off here, then commit at touchend.
      if (event.pointerType !== 'touch') cancel();
    });
    range.addEventListener('touchend', commit); range.addEventListener('touchcancel', cancel);
    range.addEventListener('keydown', event => {
      const delta = {ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1, PageUp:1, PageDown:-1}[event.key];
      if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault(); gesture++;
      const n = event.key === 'Home' ? 0 : event.key === 'End' ? items.length : Math.min(items.length, Math.max(0, index(selectedId) + delta));
      selectedId = items[n - 1]?.id || null; commit();
    });
    return {
      update(next) {
        const sameRoute = next.length === items.length && next.every((item, n) => item.id === items[n].id);
        items = next;
        if (!sameRoute) {
          epoch++;
          // Conditional Statistics follow-ups can disappear after analysis.
          // Keep a surviving committed choice in the same study. Setup/reset
          // adapters explicitly reset the rail or first update it to no steps.
          const present = value => value && items.some(item => item.id === value);
          if (!present(selectedId)) selectedId = null;
          if (!present(committedId)) committedId = null;
          if (!present(pendingId)) pendingId = null;
          for (const key of attempts.keys()) if (!present(key)) attempts.delete(key);
          if (!items.length) dragging = false;
        }
        else if (selectedId && !items.some(item => item.id === selectedId)) selectedId = null;
        paint(); schedule();
      },
      // Manual and batch failures also satisfy an identical waiting request.
      // Retrying edited/stale code or a reset workspace remains possible.
      recordFailure(itemId) {
        const item = items.find(item => item.id === itemId);
        if (item && options.state?.(item, items.indexOf(item))?.status === 'error') attempts.set(itemId, options.key?.(item) ?? itemId);
      },
      refresh() { paint(); schedule(); },
      reset() { epoch++; selectedId = null; committedId = null; pendingId = null; dragging = false; attempts.clear(); paint(); },
      select(value) { gesture++; selectedId = items[value - 1]?.id || null; commit(); },
      get selectedId() { return selectedId; }
    };
  }
  root.RouteSlider = {mount};
})(window);
