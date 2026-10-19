"""Drive the same clickable code menus a learner uses."""


def controls(section):
    return section.locator("[data-code-key]").evaluate_all(
        """nodes=>{
      const seen=new Set();return nodes.filter(n=>{if(seen.has(n.dataset.codeKey))return false;seen.add(n.dataset.codeKey);return true;})
       .map(n=>({key:n.dataset.codeKey,value:n.dataset.codeValue,label:n.getAttribute('aria-label'),options:JSON.parse(n.dataset.codeOptions)}));
    }"""
    )


def choose(page, section, key, value):
    button = section.locator('[data-code-key="' + key + '"]').first
    button.click()
    page.get_by_role("listbox").locator('[data-value="' + str(value) + '"]').click()
    assert section.locator('[data-code-key="' + key + '"]').first.get_attribute(
        "data-code-value"
    ) == str(value)
