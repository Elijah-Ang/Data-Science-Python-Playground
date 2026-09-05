"""Source UI contract for the corrected landing and playground surfaces.

This suite intentionally serves the repository root instead of ``dist``. It
checks the HTML/CSS/JavaScript currently being edited and keeps its screenshots
and JSON evidence under ``tests/evidence``. The Python runtime is allowed to
load from the normal web fallback so workspace geometry is measured after the
actual app has reached its ready state.
"""

import argparse
import json
import re
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument("--engine", default="chromium", choices=("chromium", "webkit", "firefox"))
parser.add_argument("--base-url", default="http://127.0.0.1:8002")
parser.add_argument("--evidence-dir", default="tests/evidence")
parser.add_argument("--runtime-timeout", type=int, default=180000)
args = parser.parse_args()

VIEWPORTS = ((390, 844), (834, 900), (1440, 1000))
FORBIDDEN_LANDING = (
    "Start exploring data",
    "Machine Learning",
    "System appearance",
    "Light appearance",
    "Dark appearance",
)
FORBIDDEN_CONTROL_MARKERS = (
    "Conclusion",
    "Save notebook",
    "Open saved notebook",
    "Export last executed report",
    "Delete saved drafts",
)
WORKSPACE_SELECTORS = {
    "data": ("#datasetSelect",),
    "ml": ("#datasetSelect", "#scenarioSelect", "#modelSelect", "#foldSelect"),
}


def url(base_url, page_name):
    return f"{base_url.rstrip('/')}/{page_name}.html"


def visible_text(page):
    return page.locator("body").inner_text(timeout=5000)


def wait_for_runtime(page, failures, page_name):
    try:
        page.wait_for_function(
            """() => (document.querySelector('#runtimeStatus')?.textContent || '')
                .toLowerCase().includes('ready')""",
            timeout=args.runtime_timeout,
        )
        return True
    except PlaywrightTimeoutError:
        status = page.locator("#runtimeStatus").text_content() or "missing"
        failures.append(f"{page_name}: Python runtime did not become ready ({status.strip()!r})")
        return False


def check(failures, condition, message):
    if not condition:
        failures.append(message)


def check_landing(page, width, height, failures, evidence_dir):
    page.goto(url(args.base_url, "index"), wait_until="domcontentloaded")
    page.locator("#welcome-title").wait_for()
    page.wait_for_function(
        "document.querySelector('.scene-art')?.naturalWidth > 0",
        timeout=args.runtime_timeout,
    )

    body = visible_text(page)
    for marker in FORBIDDEN_LANDING:
        check(failures, marker.lower() not in body.lower(), f"landing {width}: forbidden text remains: {marker}")

    links = page.locator("a:visible")
    hrefs = [link.get_attribute("href") for link in links.all()]
    check(
        failures,
        len(hrefs) == 2 and "tutorial.html" in hrefs and "playground.html" in hrefs,
        f"landing {width}: visible links are not only the tour and gate ({hrefs!r})",
    )

    tour = page.locator("a.tour-button")
    check(failures, tour.count() == 1 and tour.is_visible(), f"landing {width}: retained tour button missing or duplicated")
    if tour.count() == 1:
        box = tour.bounding_box()
        check(failures, box is not None, f"landing {width}: tour button has no geometry")
        if box:
            check(failures, box["x"] + box["width"] / 2 > width / 2, f"landing {width}: tour is not top-right")
            check(failures, box["y"] < height * 0.30, f"landing {width}: tour is too low ({box['y']:.1f})")
            check(failures, box["height"] <= 72, f"landing {width}: tour is too tall ({box['height']:.1f})")
            check(failures, box["width"] < width * 0.55, f"landing {width}: tour is too wide ({box['width']:.1f})")

    gate = page.locator("a.gate-hitbox")
    check(failures, gate.count() == 1 and gate.is_visible(), f"landing {width}: data gate missing or duplicated")
    check(failures, page.locator(".appearance-select").count() == 0, f"landing {width}: appearance select exists")
    check(failures, page.locator(".nav-label").count() == 0, f"landing {width}: injected navigation caption exists")

    page.screenshot(path=str(evidence_dir / f"ui-{args.engine}-{width}-landing.png"), full_page=True)
    return {
        "visible_links": hrefs,
        "tour_box": tour.bounding_box() if tour.count() == 1 else None,
        "gate_visible": gate.count() == 1 and gate.is_visible(),
    }


def check_no_forbidden_controls(page, page_name, failures):
    # Inspect interactive controls and headings rather than body text: prose
    # can discuss evidence or conclusions without exposing a removed control.
    candidates = page.locator("button, a, select, input, textarea, [role='heading']")
    labels = []
    for element in candidates.all():
        if not element.is_visible():
            continue
        label = " ".join(
            value
            for value in (
                element.get_attribute("aria-label"),
                element.get_attribute("title"),
                element.text_content(),
            )
            if value
        ).strip()
        if label:
            labels.append(label)
    for marker in FORBIDDEN_CONTROL_MARKERS:
        check(
            failures,
            not any(marker.lower() in label.lower() for label in labels),
            f"{page_name}: retired control marker remains in visible UI: {marker}",
        )
    return labels


def check_mode_captions(page, page_name, failures):
    # Accessibility names remain on the image buttons, while visible captions
    # injected below those artworks were removed.
    check(failures, page.locator(".mode-link .nav-label").count() == 0, f"{page_name}: visible mode caption injection remains")
    check(
        failures,
        page.locator(".mode-link .mode-icon").count() == page.locator(".mode-link").count(),
        f"{page_name}: one or more mode links lacks its pixel icon",
    )


def check_theme_control(page, page_name, failures):
    theme_value = page.locator("body").get_attribute("data-theme")
    theme = page.locator("#themeButton")
    if theme.count() != 1:
        return
    expected_next = "dark" if theme_value == "light" else "light"
    expected_pressed = "true" if theme_value == "light" else "false"
    expected_icon = "M20 15.3" if theme_value == "light" else "<circle"
    actual_label = theme.get_attribute("aria-label")
    actual_pressed = theme.get_attribute("aria-pressed")
    icon_markup = page.locator("#themeIcon").inner_html() if page.locator("#themeIcon").count() == 1 else ""
    check(
        failures,
        actual_label == f"Switch to {expected_next} theme",
        f"{page_name}: theme action label is {actual_label!r}, expected Switch to {expected_next} theme",
    )
    check(
        failures,
        actual_pressed == expected_pressed,
        f"{page_name}: theme action pressed state is {actual_pressed!r}, expected {expected_pressed!r}",
    )
    check(
        failures,
        expected_icon in icon_markup,
        f"{page_name}: theme icon does not match {theme_value!r} theme ({icon_markup!r})",
    )


def check_workspace(page, workspace, width, failures, evidence_dir, runtime_ready):
    page_name = f"{workspace} {width}"
    heading = page.locator("#inspectorTitle")
    check(failures, heading.count() == 1 and heading.is_visible(), f"{page_name}: inspector heading is missing")

    inspector_body = page.locator(".inspector-body")
    check(failures, inspector_body.count() == 1, f"{page_name}: inspector body is missing or duplicated")
    if inspector_body.count() == 1:
        wrapped = inspector_body.evaluate("node => Boolean(node.closest('details'))")
        check(failures, not wrapped, f"{page_name}: inspector body is wrapped in a collapsible details element")
        check(failures, inspector_body.is_visible(), f"{page_name}: inspector body is not visible")

    check(failures, page.locator(".appearance-select").count() == 0, f"{page_name}: appearance dropdown exists")
    allowed = WORKSPACE_SELECTORS[workspace]
    for select in page.locator("select:visible").all():
        check(
            failures,
            f"#{select.get_attribute('id')}" in allowed,
            f"{page_name}: unexpected visible select ({select.get_attribute('id')!r})",
        )
    check(
        failures,
        page.locator("[aria-label='Appearance'], [title*='appearance' i]").count() == 0,
        f"{page_name}: appearance picker label/title exists",
    )

    theme = page.locator("#themeButton")
    check(failures, theme.count() == 1 and theme.is_visible(), f"{page_name}: moon/sun theme button is missing")
    if theme.count() == 1:
        check(failures, page.locator("#themeIcon").count() == 1, f"{page_name}: theme icon is missing")
        check_theme_control(page, page_name, failures)

    check_no_forbidden_controls(page, page_name, failures)
    check_mode_captions(page, page_name, failures)

    route = page.locator("#suggestedRoute .route-task").first if workspace == "data" else page.locator("#routeStrip .route-card").first
    route_box = route.bounding_box() if runtime_ready and route.count() == 1 else None
    if runtime_ready:
        check(failures, route.count() == 1 and route.is_visible(), f"{page_name}: first route button is missing after runtime ready")
        if route_box:
            check(failures, route_box["height"] <= 72, f"{page_name}: route button is too tall ({route_box['height']:.1f})")
            check(
                failures,
                route_box["width"] >= 120,
                f"{page_name}: route button is too narrow ({route_box['width']:.1f})",
            )

    page.screenshot(path=str(evidence_dir / f"ui-{args.engine}-{width}-{workspace}.png"), full_page=True)
    return {
        "inspector_wrapped_in_details": bool(inspector_body.count() == 1 and inspector_body.evaluate("node => Boolean(node.closest('details'))")),
        "theme": page.locator("body").get_attribute("data-theme"),
        "route_box": route_box,
    }


def toggle_and_check_theme(page, failures):
    before = page.locator("body").get_attribute("data-theme")
    theme = page.locator("#themeButton")
    if theme.count() != 1:
        failures.append("theme persistence: theme button unavailable")
        return None
    theme.click()
    try:
        page.wait_for_function("before => document.body.dataset.theme !== before", arg=before, timeout=5000)
    except PlaywrightTimeoutError:
        failures.append(f"theme persistence: moon/sun click did not change theme from {before!r}")
        return None
    after = page.locator("body").get_attribute("data-theme")
    stored = page.evaluate("localStorage.getItem('dspp-appearance')")
    check(failures, after in ("light", "dark") and after != before, f"theme persistence: invalid toggled theme {after!r}")
    check(failures, stored == after, f"theme persistence: localStorage is {stored!r}, expected {after!r}")
    check_theme_control(page, "theme persistence after Data toggle", failures)
    return after


def main():
    evidence_dir = Path(args.evidence_dir)
    evidence_dir.mkdir(parents=True, exist_ok=True)
    failures = []
    evidence = {
        "engine": args.engine,
        "base_url": args.base_url,
        "viewports": [list(size) for size in VIEWPORTS],
        "landing": {},
        "data": {},
        "ml": {},
        "theme": {},
    }

    with sync_playwright() as playwright:
        browser = getattr(playwright, args.engine).launch()
        context = browser.new_context()
        context.add_init_script(
            "if (!localStorage.getItem('dspp-appearance')) "
            "localStorage.setItem('dspp-appearance', 'light')"
        )
        page = context.new_page()
        page.set_viewport_size({"width": VIEWPORTS[0][0], "height": VIEWPORTS[0][1]})
        page_errors = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            evidence["landing"][str(width)] = check_landing(page, width, height, failures, evidence_dir)

        page.set_viewport_size({"width": VIEWPORTS[0][0], "height": VIEWPORTS[0][1]})
        page.goto(url(args.base_url, "playground"), wait_until="domcontentloaded")
        data_ready = wait_for_runtime(page, failures, "data")
        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(200)
            evidence["data"][str(width)] = check_workspace(page, "data", width, failures, evidence_dir, data_ready)
        if data_ready:
            toggled_theme = toggle_and_check_theme(page, failures)
            evidence["theme"]["after_data_toggle"] = toggled_theme

        page.set_viewport_size({"width": 1440, "height": 1000})
        page.goto(url(args.base_url, "ml"), wait_until="domcontentloaded")
        ml_ready = wait_for_runtime(page, failures, "ml")
        expected_theme = evidence["theme"].get("after_data_toggle")
        if expected_theme:
            actual_theme = page.locator("body").get_attribute("data-theme")
            evidence["theme"]["ml_after_navigation"] = actual_theme
            check(failures, actual_theme == expected_theme, f"theme persistence: ML opened as {actual_theme!r}, expected {expected_theme!r}")
            check_theme_control(page, "theme persistence on ML navigation", failures)
        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(200)
            evidence["ml"][str(width)] = check_workspace(page, "ml", width, failures, evidence_dir, ml_ready)

        page.goto(url(args.base_url, "playground"), wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        if expected_theme:
            actual_theme = page.locator("body").get_attribute("data-theme")
            evidence["theme"]["data_after_return"] = actual_theme
            check(failures, actual_theme == expected_theme, f"theme persistence: Data returned as {actual_theme!r}, expected {expected_theme!r}")
            check_theme_control(page, "theme persistence on Data return", failures)

        evidence["browser_version"] = browser.version
        evidence["page_errors"] = page_errors
        evidence["failures"] = failures
        (evidence_dir / f"ui-preferences-{args.engine}.json").write_text(json.dumps(evidence, indent=2) + "\n")
        browser.close()

    if failures:
        print(json.dumps({"status": "failed", "failures": failures}, indent=2))
        raise SystemExit(1)
    print(json.dumps({"status": "passed", "evidence": str(evidence_dir)}, indent=2))


if __name__ == "__main__":
    main()
