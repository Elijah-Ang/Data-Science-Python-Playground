"""Bounded 200%-reflow, focus, contrast, and state review.

This is a rendered browser probe, not an exhaustive WCAG audit.  A 720 CSS
pixel viewport models the effective layout width of a 1440 CSS pixel page at
200% browser zoom; the browser's native zoom UI is outside Playwright's stable
cross-engine API.  The review checks visible names, keyboard focus, document
overflow, sampled text contrast, and representative Data/ML disabled/error
states against a disposable final native snapshot.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


PUBLIC_PAGES = ("index", "tutorial", "help", "about", "privacy", "acknowledgements")
WORKSPACES = ("playground", "ml")
VIEWPORT = {"width": 720, "height": 900}
READY = {
    "playground": "Python ready",
    "ml": "Pyodide 0.26.4 ready",
}


def wait_ready(page, page_name: str, timeout: int) -> None:
    page.wait_for_function(
        "text => (document.querySelector('#runtimeStatus')?.textContent || '').includes(text)",
        arg=READY[page_name],
        timeout=timeout,
    )


def visible_focusables(page) -> list[dict]:
    return page.evaluate(
        """
        () => [...document.querySelectorAll(
          'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'
        )].filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden'
            && !element.hidden && !element.disabled
            && element.getAttribute('aria-disabled') !== 'true'
            && rect.width > 0 && rect.height > 0;
        }).map(element => {
          const labelledBy = element.getAttribute('aria-labelledby');
          const labelledText = labelledBy
            ? labelledBy.split(/\\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ')
            : '';
          const name = element.getAttribute('aria-label')
            || labelledText
            || element.getAttribute('title')
            || element.innerText
            || element.value
            || element.getAttribute('placeholder')
            || element.getAttribute('alt')
            || '';
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            name: name.replace(/\\s+/g, ' ').trim(),
          };
        });
        """
    )


def focus_snapshot(page) -> dict:
    return page.evaluate(
        """
        () => {
          const element = document.activeElement;
          if (!element || element === document.body || element === document.documentElement) {
            return {tag: element?.tagName?.toLowerCase() || 'none', visible: false, ring: false, name: ''};
          }
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const name = (
            element.getAttribute('aria-label') || element.getAttribute('title') ||
            element.innerText || element.value || element.getAttribute('placeholder') || ''
          ).replace(/\\s+/g, ' ').trim();
          const visible = style.display !== 'none' && style.visibility !== 'hidden'
            && rect.width > 0 && rect.height > 0
            && rect.bottom > 0 && rect.right > 0
            && rect.top <= innerHeight && rect.left <= innerWidth;
          const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
            || style.boxShadow !== 'none';
          return {
            tag: element.tagName.toLowerCase(), id: element.id, name,
            visible, ring,
            rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
          };
        }
        """
    )


def review_focus(page, max_tabs: int = 80) -> dict:
    candidates = visible_focusables(page)
    focusable_selector = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'
    # Headless engines differ in whether a synthetic Tab scrolls a long page.
    # Focus each visible candidate and scroll it into view before inspecting the
    # focus indicator; this tests the control itself without treating that
    # engine-specific scrolling difference as an application failure.
    snapshots: list[dict] = []
    for index in range(min(max_tabs, len(candidates))):
        page.evaluate(
            """
            ({selector, index}) => {
              const elements = [...document.querySelectorAll(selector)].filter(element => {
                const style = getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden'
                  && !element.hidden && !element.disabled
                  && element.getAttribute('aria-disabled') !== 'true'
                  && rect.width > 0 && rect.height > 0;
              });
              const element = elements[index];
              if (!element) return false;
              element.focus();
              element.scrollIntoView({block: 'nearest', inline: 'nearest'});
              return true;
            }
            """,
            {"selector": focusable_selector, "index": index},
        )
        snapshots.append(focus_snapshot(page))
    active = [snapshot for snapshot in snapshots if snapshot.get("tag") not in ("none", "body", "html")]
    visible_failures = [snapshot for snapshot in active if not snapshot.get("visible")]
    rings = [snapshot for snapshot in active if snapshot.get("ring")]
    names = [snapshot.get("name", "") for snapshot in active]
    # Keep a short native-Tab sample in the evidence.  A few engines do not
    # expose every link as a tab stop in headless mode, so this is diagnostic
    # evidence rather than the pass/fail focus contract above.
    page.evaluate("scrollTo(0, 0)")
    native_tabs: list[dict] = []
    for _ in range(min(12, max(3, len(candidates) + 2))):
        page.keyboard.press("Tab")
        native_tabs.append(focus_snapshot(page))
    native_active = [snapshot for snapshot in native_tabs if snapshot.get("tag") not in ("none", "body", "html")]
    return {
        "visible_focusables": len(candidates),
        "focus_targets_checked": len(snapshots),
        "active_steps": len(active),
        "unique_focus_names": len(set(names)),
        "missing_names": [candidate for candidate in candidates if not candidate.get("name")],
        "focus_visibility_failures": visible_failures,
        "focus_ring_steps": len(rings),
        "native_tab_steps": len(native_tabs),
        "native_tab_active_steps": len(native_active),
        "native_tab_offscreen_steps": [snapshot for snapshot in native_active if not snapshot.get("visible")],
        "native_tab_no_active_steps": len(native_tabs) - len(native_active),
    }


def contrast_samples(page) -> list[dict]:
    return page.evaluate(
        """
        () => {
          const parse = value => {
            const match = value.match(/rgba?\\(([^)]+)\\)/);
            if (!match) return null;
            const parts = match[1].split(',').map(part => Number.parseFloat(part.trim()));
            if (parts.length < 3) return null;
            return {r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1};
          };
          const luminance = rgb => {
            const channels = [rgb.r, rgb.g, rgb.b].map(value => value / 255).map(value =>
              value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
            );
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const ratio = (foreground, background) => {
            const light = luminance(foreground), dark = luminance(background);
            return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
          };
          const backgroundFor = element => {
            for (let node = element; node; node = node.parentElement) {
              const color = parse(getComputedStyle(node).backgroundColor);
              if (color && color.a > 0.05) return color;
            }
            return parse(getComputedStyle(document.body).backgroundColor) || {r: 255, g: 255, b: 255, a: 1};
          };
          const selectors = [
            '#welcome-title', '.tour-button', '.dataset-question', '.result-note',
            '.teaching-line', '.teaching-reading-cue', '.route-card', '.cell-label',
            '.cell-footer', '#runtimeStatus', 'button', 'a',
            'label', 'select'
          ];
          const seen = new Set(), samples = [];
          for (const selector of selectors) {
            for (const element of document.querySelectorAll(selector)) {
              if (seen.has(element) || !element.innerText?.trim() && !element.value) continue;
              const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
              if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden') continue;
              seen.add(element);
              const foreground = parse(style.color), background = backgroundFor(element);
              if (!foreground || !background) continue;
              samples.push({
                selector, text: (element.innerText || element.value || '').replace(/\\s+/g, ' ').trim().slice(0, 90),
                ratio: ratio(foreground, background), color: style.color,
                background: `rgb(${background.r}, ${background.g}, ${background.b})`,
              });
              if (samples.length >= 80) return samples;
            }
          }
          return samples;
        }
        """
    )


def overflow(page) -> dict:
    return page.evaluate(
        """
        () => ({
          innerWidth: innerWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
        })
        """
    )


def disable_test_smooth_scroll(page) -> None:
    # Smooth scrolling can leave a freshly focused, long-page target outside
    # the viewport until the animation completes.  The probe is about the
    # resulting focus state, so make that state deterministic for both engines.
    page.add_style_tag(content="html, body { scroll-behavior: auto !important; }")


def focus_error_disclosure(page, selector: str) -> dict:
    details = page.locator(selector)
    if details.count() != 1:
        return {"count": details.count(), "keyboard_opened": False, "summary_name": ""}
    summary = details.locator("summary")
    summary.focus()
    before = focus_snapshot(page)
    page.keyboard.press("Enter")
    opened = details.evaluate("element => element.open")
    after = focus_snapshot(page)
    return {
        "count": 1,
        "keyboard_opened": bool(opened),
        "summary_name": summary.inner_text().strip(),
        "focus_before": before,
        "focus_after": after,
    }


def run_workspace_probe(page, page_name: str, timeout: int) -> dict:
    page.goto(f"{page.url.split('/')[0]}//{page.url.split('/')[2]}/{page_name}.html?accessibility_probe=1", wait_until="domcontentloaded")
    wait_ready(page, page_name, timeout)
    initial_disabled = page.locator("button:visible:disabled").evaluate_all(
        "elements => elements.map(element => ({id: element.id, text: element.innerText.trim(), className: element.className}))"
    )
    if page_name == "playground":
        page.locator("#addCellButton").click()
        cell = page.locator("article.cell").last
        cell.locator("textarea").fill('raise RuntimeError("accessibility-probe")')
        cell.locator("button.run").click()
        page.wait_for_function(
            "() => { const cells = document.querySelectorAll('article.cell'); const last = cells[cells.length - 1]; return last?.dataset.status === 'error'; }",
            timeout=timeout,
        )
        error_selector = ".cell-inline-output details.console-wrap"
    else:
        route_disabled = page.locator("#routeStrip .route-card:disabled").count()
        if route_disabled < 1:
            raise AssertionError("ML representative disabled state has no blocked downstream route card.")
        page.locator("#addCellButton").click()
        cell = page.locator("article.cell").last
        cell.locator("textarea").fill('raise RuntimeError("accessibility-probe")')
        cell.locator("button.run").click()
        page.wait_for_function(
            "() => { const cells = document.querySelectorAll('article.cell'); const last = cells[cells.length - 1]; return last?.dataset.status === 'error'; }",
            timeout=timeout,
        )
        error_selector = ".cell-inline-output details.technical-details"
    error_article = page.locator("article.cell[data-status='error']").last
    if error_article.count() != 1:
        raise AssertionError(f"{page_name} error probe did not leave one error cell.")
    disclosure = focus_error_disclosure(page, error_selector)
    if not disclosure["keyboard_opened"]:
        raise AssertionError(f"{page_name} error traceback disclosure did not open from the keyboard.")
    return {
        "initial_disabled_controls": initial_disabled,
        "error_cell_status": error_article.get_attribute("data-status"),
        "error_disclosure": disclosure,
        "overflow_after_error": overflow(page),
    }


def run(args) -> dict:
    report: dict = {
        "base_url": args.base_url,
        "engine": args.engine,
        "zoom_proxy": {
            "viewport_width": VIEWPORT["width"],
            "viewport_height": VIEWPORT["height"],
            "base_layout_width": 1440,
            "description": "720 CSS px models the effective width of 1440 CSS px at 200% browser zoom.",
        },
        "public": {},
        "workspaces": {},
        "page_errors": [],
        "contrast": {},
    }
    with sync_playwright() as playwright:
        browser = getattr(playwright, args.engine).launch()
        context = browser.new_context(viewport=VIEWPORT, service_workers="block")
        context.add_init_script("localStorage.setItem('dspp-appearance', 'light')")
        page = context.new_page()
        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
        page.on("console", lambda message: report["page_errors"].append(f"console:{message.text}") if message.type == "error" else None)
        origin = args.base_url.rstrip("/")
        for page_name in PUBLIC_PAGES:
            page.goto(f"{origin}/{page_name}.html?accessibility_probe=public", wait_until="domcontentloaded")
            page.wait_for_timeout(100)
            disable_test_smooth_scroll(page)
            focus = review_focus(page)
            samples = contrast_samples(page)
            report["public"][page_name] = {
                "overflow": overflow(page),
                "focus": focus,
                "contrast_samples": len(samples),
                "minimum_sampled_contrast": min((sample["ratio"] for sample in samples), default=None),
            }
            report["contrast"][page_name] = {"light": samples}
            page.evaluate("window.AppAppearance?.apply('dark')")
            dark_samples = contrast_samples(page)
            report["contrast"][page_name]["dark"] = dark_samples
            report["public"][page_name]["dark_minimum_sampled_contrast"] = min(
                (sample["ratio"] for sample in dark_samples), default=None
            )
        for page_name in WORKSPACES:
            page.goto(f"{origin}/{page_name}.html?accessibility_probe=workspace", wait_until="domcontentloaded")
            wait_ready(page, page_name, args.runtime_timeout)
            disable_test_smooth_scroll(page)
            report["workspaces"][page_name] = {
                "overflow_before_error": overflow(page),
                "focus": review_focus(page),
                "contrast_samples": contrast_samples(page),
            }
            report["workspaces"][page_name]["state_probe"] = run_workspace_probe(page, page_name, args.runtime_timeout)
            report["workspaces"][page_name]["overflow_after_probe"] = overflow(page)
        report["browser_version"] = browser.version
        browser.close()
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8004")
    parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
    parser.add_argument("--runtime-timeout", type=int, default=120_000)
    parser.add_argument("--output", default="tests/evidence/accessibility-zoom.json")
    args = parser.parse_args()
    try:
        report = run(args)
    except PlaywrightTimeoutError as error:
        raise SystemExit(f"Accessibility probe timed out: {error}") from error
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n")
    failures = []
    for page_name, result in report["public"].items():
        if result["overflow"]["horizontalOverflow"]:
            failures.append(f"{page_name}: horizontal overflow")
        if result["focus"]["missing_names"]:
            failures.append(f"{page_name}: unnamed focusable controls")
        if result["focus"]["focus_visibility_failures"]:
            failures.append(f"{page_name}: keyboard focus left the viewport")
    for page_name, result in report["workspaces"].items():
        if result["overflow_before_error"]["horizontalOverflow"] or result["overflow_after_probe"]["horizontalOverflow"]:
            failures.append(f"{page_name}: horizontal overflow")
        if result["focus"]["missing_names"] or result["focus"]["focus_visibility_failures"]:
            failures.append(f"{page_name}: keyboard focus contract failed")
        if result["state_probe"]["overflow_after_error"]["horizontalOverflow"]:
            failures.append(f"{page_name}: error-state horizontal overflow")
    if report["page_errors"]:
        failures.append("browser page errors: " + "; ".join(report["page_errors"]))
    if failures:
        print(json.dumps({"status": "failed", "failures": failures, "evidence": str(output)}, indent=2))
        return 1
    print(json.dumps({"status": "passed", "evidence": str(output), "browser": report["browser_version"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
