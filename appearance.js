/* Applied in the head, before paint, across all product pages. */
(() => {
  const query = matchMedia('(prefers-color-scheme: dark)');
  const moonIcon = '<path d="M20 15.3A8.5 8.5 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3z"></path>';
  const sunIcon = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
  let preference = 'system';
  try { preference=localStorage.getItem('dspp-appearance') || 'system'; } catch {}
  function syncThemeControl(theme) {
    const button = document.getElementById('themeButton');
    if (!button) return;
    const isLight = theme === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    button.setAttribute('aria-pressed', String(isLight));
    button.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    button.title = `Switch to ${nextTheme} theme`;
    const icon = document.getElementById('themeIcon');
    if (icon) icon.innerHTML = isLight ? moonIcon : sunIcon;
  }
  function apply(value=preference) {
    preference=value;
    const theme=value==='system' ? (query.matches ? 'dark':'light') : value;
    document.documentElement.dataset.theme=theme;
    if (document.body) document.body.dataset.theme=theme;
    syncThemeControl(theme);
    try {localStorage.setItem('dspp-appearance',value);} catch {}
    window.dispatchEvent(new CustomEvent('appearancechange', {detail:{theme}}));
  }
  window.AppAppearance={apply}; apply();
  query.addEventListener('change', () => {if (preference==='system') apply();});
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    if (location.pathname.endsWith('/about.html')) {
      fetch('build-info.json').then(response=>response.json()).then(build=> {const p=document.createElement('p');p.className='build-identity';p.textContent=`Build ${build.contentId.slice(0,12)} · ${build.builtAt} · commit ${build.commit}${build.dirty ? ' · modified source' : ''}`;document.querySelector('main')?.append(p);}).catch(()=>{});
    }
  });
})();
