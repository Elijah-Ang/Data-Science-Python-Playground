/* Exact code names in prose are rendered as code; keyboard shortcuts use kbd. */
(function(root){
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function format(value) {
    const text = String(value ?? '');
    const pattern = /`([^`]+)`|\b(?:[A-Za-z_]\w*\.)*[A-Za-z_]\w*\([^\n()]*\)|\b(?:df|pd|np|sns|plt|fig|ax|combined|record_count|X_train|X_test|y_train|y_test|X|y)\b/g;
    let html = '', start = 0;
    for (const m of text.matchAll(pattern)) {
      html += escape(text.slice(start,m.index)) + '<code class="code-identifier">' + escape(m[1] || m[0]) + '</code>';
      start = m.index + m[0].length;
    }
    return html + escape(text.slice(start));
  }
  function decorate(element) {
    if (!element) return;
    element.querySelectorAll('code').forEach(code => {
      if (!code.closest('pre')) code.classList.add('code-identifier');
    });
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('svg,math,code,kbd,pre,textarea,script,style,button,select,option')) nodes.push(node);
    }
    for (const text of nodes) {
      const html = format(text.textContent);
      if (!html.includes('<code')) continue;
      const template = document.createElement('template'); template.innerHTML = html;
      text.replaceWith(template.content);
    }
  }
  root.CodeIdentifiers = {format,decorate};
})(window);
