import { autoUpdate, computePosition, offset, flip, shift, size } from '@floating-ui/dom';

// Positioning never owns the selected Python value or the scientific model.
export function follow(anchor, menu) {
  let active = true, revision = 0;
  const update = async () => {
    const current = ++revision;
    const result = await computePosition(anchor, menu, {
      strategy: 'fixed', placement: 'bottom-start',
      middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 }),
        size({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
          if (!active || current !== revision) return;
          Object.assign(elements.floating.style, {
            maxWidth: Math.max(0, availableWidth) + 'px',
            maxHeight: Math.max(44, Math.min(320, availableHeight)) + 'px'
          });
        } })]
    });
    if (!active || current !== revision || !anchor.isConnected || !menu.isConnected) return;
    Object.assign(menu.style, { left: result.x + 'px', top: result.y + 'px' });
    menu.dataset.positioner = 'floating-ui';
    menu.dataset.placement = result.placement;
  };
  const stop = autoUpdate(anchor, menu, update);
  return () => { active = false; revision++; stop(); };
}
