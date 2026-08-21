"""Headless browser smoke test for representative Pyodide routes."""

from __future__ import annotations

import argparse

from playwright.sync_api import sync_playwright


READY_TEXT = "Pyodide 0.26.4 ready"


def wait_for_ready(page) -> None:
    page.wait_for_function(
        """readyText => document.querySelector('#runtimeStatus')?.textContent.includes(readyText)""",
        arg=READY_TEXT,
        timeout=120_000,
    )


def run_steps(page, count: int) -> None:
    for index in range(count):
        button = page.locator("#routeStrip .route-card").nth(index)
        button.wait_for(state="visible", timeout=15_000)
        if button.is_disabled():
            raise AssertionError(f"Route step {index + 1} was disabled unexpectedly.")
        button.click()
        page.wait_for_function(
            """stepIndex => document.querySelectorAll('#notebookPanel article')[stepIndex]?.dataset.status === 'done'""",
            arg=index,
            timeout=120_000,
        )
        if page.locator("#outputList .output-item[data-status='error']").count():
            raise AssertionError(f"Route step {index + 1} produced a Python error.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()

    browser_errors: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        page.on("pageerror", lambda error: browser_errors.append(str(error)))
        page.on(
            "console",
            lambda message: browser_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.goto(args.base_url, wait_until="domcontentloaded")
        wait_for_ready(page)

        run_steps(page, 3)
        supervised_output_count = page.locator("#outputList .output-item[data-status='ok']").count()
        if supervised_output_count < 3:
            raise AssertionError("Supervised smoke route did not produce three successful outputs.")

        first_editor = page.locator("#notebookPanel textarea").nth(0)
        first_editor.fill(first_editor.input_value() + "\n# edit invalidation smoke check")
        page.wait_for_function(
            """() => [...document.querySelectorAll('#notebookPanel article')].slice(0, 3).every(article => article.dataset.status === 'stale')""",
            timeout=10_000,
        )
        if page.locator("#outputList .output-item[data-status='ok']").count():
            raise AssertionError("Editing a completed guided cell left old output visible.")
        if page.locator("#routeStrip .route-card").nth(0).is_disabled():
            raise AssertionError("The edited route step was not made runnable again.")
        if not page.locator("#routeStrip .route-card").nth(1).is_disabled():
            raise AssertionError("A downstream route step remained enabled after editing an earlier cell.")
        run_steps(page, 1)

        page.select_option("#modelSelect", "pca")
        wait_for_ready(page)
        run_steps(page, 3)
        total_output_count = page.locator("#outputList .output-item[data-status='ok']").count()
        if total_output_count < 3:
            raise AssertionError("Unsupervised smoke route did not produce successful outputs.")

        browser.close()

    if browser_errors:
        raise AssertionError("Browser/Pyodide smoke test reported errors:\n" + "\n".join(browser_errors))
    print("Browser/Pyodide smoke test passed: supervised and PCA route cells produced successful output.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
