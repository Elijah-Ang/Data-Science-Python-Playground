/* Exact code names in prose are rendered as code; keyboard shortcuts use kbd. */
(function(root){
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function format(value) {
    const text = String(value ?? '');
    // Treat both coordinate names alike, including "x and y" explanations.
    // Numeric dimensions and ordinary hyphenated words remain prose.
    const pattern = /`([^`]+)`|\b(?:[A-Za-z_]\w*\.)*[A-Za-z_]\w*\([^\n()]*\)|\b(?:df|pd|np|sns|plt|fig|ax|combined|record_count|X_train|X_test|y_train|y_test|X|x|y)\b/g;
    let html = '', start = 0;
    for (const m of text.matchAll(pattern)) {
      if (m[0] === 'x' && ((/\d\s*$/.test(text.slice(0,m.index)) && /^\s*\d/.test(text.slice(m.index+1))) || /^-(?!axis\b)[a-z]/i.test(text.slice(m.index+1)))) continue;
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
