"""Browser contract for retired notebook-management controls.

Notebook drafts still save automatically through ``NotebookSession``. The
visible Save/Open/Export/Delete-draft controls were intentionally removed from
both notebook surfaces, so this test checks the public session API and the
visible control tree without pretending that a removed export button exists.
"""

from __future__ import annotations

import argparse

from playwright.sync_api import sync_playwright


RETIRED_MARKERS = (
    "Save notebook",
    "Open saved notebook",
    "Export last executed report",
    "Delete saved drafts",
    "Your Conclusion",
    "Conclusion",
)
SESSION_METHODS = ("install", "save", "restore", "remember", "beginTransition", "last")


def visible_control_labels(page) -> list[str]:
    candidates = page.locator("button, a, input, select, [role='button']")
    labels: list[str] = []
    for element in candidates.all():
        if not element.is_visible():
            continue
        label = " ".join(
            value.strip()
            for value in (
                element.get_attribute("aria-label"),
                element.get_attribute("title"),
                element.text_content(),
                element.get_attribute("value"),
            )
            if value and value.strip()
        )
        if label:
            labels.append(label)
    return labels


def assert_retired_controls_absent(page, page_name: str) -> None:
    labels = visible_control_labels(page)
    for marker in RETIRED_MARKERS:
        if any(marker.lower() in label.lower() for label in labels):
            raise AssertionError(f"{page_name} still exposes retired notebook control {marker!r}: {labels}")
    if page.locator("#openNotebookFile").count():
        raise AssertionError(f"{page_name} still exposes the removed notebook file picker.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8001")
    parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
    args = parser.parse_args()

    with sync_playwright() as playwright:
        browser = getattr(playwright, args.engine).launch()
        page = browser.new_page()
        for page_name in ("playground", "ml"):
            page.goto(f"{args.base_url.rstrip('/')}/{page_name}.html", wait_until="domcontentloaded")
            page.wait_for_function(
                "() => /^(Python ready|Pyodide 0\.26\.4 ready)/.test(document.querySelector('#runtimeStatus')?.textContent || '')",
                timeout=120_000,
            )
            assert_retired_controls_absent(page, page_name)
            methods = page.evaluate(
                """names => Object.fromEntries(names.map(name => [name, typeof window.NotebookSession?.[name]]))""",
                list(SESSION_METHODS),
            )
            if any(value != "function" for value in methods.values()):
                raise AssertionError(f"{page_name} lost a supported NotebookSession API: {methods}")

        page.goto(f"{args.base_url.rstrip('/')}/ml.html", wait_until="domcontentloaded")
        page.wait_for_function(
            "() => /^(Python ready|Pyodide 0\.26\.4 ready)/.test(document.querySelector('#runtimeStatus')?.textContent || '')",
            timeout=120_000,
        )
        if page.evaluate("() => window.NotebookSession.save()") is not True:
            raise AssertionError("NotebookSession.save() no longer reports a successful automatic draft save.")
        saved = page.evaluate("() => Object.keys(localStorage).some(key => key.startsWith('dspp-notebook-v1:'))")
        if not saved:
            raise AssertionError("NotebookSession.save() did not persist an automatic draft.")
        assert_retired_controls_absent(page, "ml")
        browser.close()

    print("Retired notebook controls are absent; Machine Learning automatic draft saving remains available.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
