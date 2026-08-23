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


def wait_for_route(page, expected_steps: int) -> None:
    page.wait_for_function(
        "stepCount => document.querySelectorAll('#routeStrip .route-card').length === stepCount",
        arg=expected_steps,
        timeout=15_000,
    )


def wait_for_cell(page, index: int, timeout: int = 120_000) -> None:
    page.wait_for_function(
        "index => ['done', 'error'].includes(document.querySelectorAll('#notebookPanel article')[index]?.dataset.status)",
        arg=index,
        timeout=timeout,
    )
    status = page.locator("#notebookPanel article").nth(index).get_attribute("data-status")
    if status != "done":
        output = page.locator("#outputList .output-item").last.inner_text()
        raise AssertionError(f"Browser cell {index + 1} failed:\n{output}")


def run_steps(page, count: int) -> None:
    for index in range(count):
        button = page.locator("#routeStrip .route-card").nth(index)
        button.wait_for(state="visible", timeout=15_000)
        if button.is_disabled():
            raise AssertionError(f"Route step {index + 1} was disabled unexpectedly.")
        button.click()
        wait_for_cell(page, index)
        if page.locator("#outputList .output-item[data-status='error']").count():
            raise AssertionError(f"Route step {index + 1} produced a Python error.")


def select_route(page, dataset: str, scenario: str, model: str, expected_steps: int) -> None:
    page.select_option("#datasetSelect", dataset)
    wait_for_ready(page)
    page.select_option("#scenarioSelect", scenario)
    wait_for_ready(page)
    page.select_option("#modelSelect", model)
    wait_for_ready(page)
    wait_for_route(page, expected_steps)


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

        if page.locator("#holdoutState").text_content().strip() != "sealed":
            raise AssertionError("The supervised route did not start with a sealed test set.")
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

        select_route(page, "gapminder", "simple", "simple_linear", 9)
        run_steps(page, 9)
        supervised_statuses = page.locator("#notebookPanel article").evaluate_all(
            "articles => articles.map(article => article.dataset.status)"
        )
        if supervised_statuses != ["done"] * 9:
            raise AssertionError(f"Complete supervised route did not finish all nine steps: {supervised_statuses}")
        if page.locator("#outputList .output-item[data-status='error']").count():
            raise AssertionError("Complete supervised route produced a Python error.")
        final_text = page.locator("#outputList").inner_text()
        for metric in ("RMSE", "MAE", "R²", "test rows"):
            if metric not in final_text:
                raise AssertionError(f"Final supervised output is missing expected metric {metric!r}.")
        if page.locator("#holdoutState").text_content().strip() != "opened once":
            raise AssertionError("The final supervised step did not open the saved test set exactly once.")
        if not page.locator("#routeStrip .route-card").nth(8).is_disabled():
            raise AssertionError("The final supervised route remained rerunnable after using the test set.")
        if not page.locator("#notebookPanel article").nth(8).locator("button.run").is_disabled():
            raise AssertionError("The final notebook cell remained rerunnable after using the test set.")

        select_route(page, "breast", "continuous5", "pca", 7)
        run_steps(page, 4)
        pca_statuses = page.locator("#notebookPanel article").evaluate_all(
            "articles => articles.map(article => article.dataset.status)"
        )
        if pca_statuses != ["done"] * 4:
            raise AssertionError(f"PCA route did not reach its fitted variance step: {pca_statuses}")
        pca_text = page.locator("#outputList").inner_text()
        if "explained_variance" not in pca_text or "cumulative_variance" not in pca_text:
            raise AssertionError("PCA variance output was not produced in the browser runtime.")
        page.locator("#addCellButton").click()
        custom_editor = page.locator("#notebookPanel textarea").last
        custom_editor.fill("type(full_pca).__name__")
        page.locator("#notebookPanel article").last.locator("button.run").click()
        wait_for_cell(page, page.locator("#notebookPanel article").count() - 1)
        if "PCA" not in page.locator("#outputList .output-item").last.inner_text():
            raise AssertionError("The fitted PCA object was not available after the browser route step.")

        page.locator("#addCellButton").click()
        reset_mutation = page.locator("#notebookPanel textarea").last
        reset_mutation.fill(
            "df.drop(columns=[df.columns[0]], inplace=True)\n"
            "pd = None\n"
            "np = 'broken'\n"
            "del sns\n"
            "some_random_variable = 123\n"
            "True"
        )
        page.locator("#notebookPanel article").last.locator("button.run").click()
        mutation_index = page.locator("#notebookPanel article").count() - 1
        wait_for_cell(page, mutation_index)
        page.locator("#resetButton").click()
        wait_for_ready(page)
        if "raw data retained" not in (page.locator("#runtimeStatus").text_content() or ""):
            raise AssertionError("Browser reset did not report that the raw data was retained.")
        page.locator("#addCellButton").click()
        reset_check = page.locator("#notebookPanel textarea").last
        reset_check.fill(
            "reset_check = (\n"
            "    pd.__name__ == 'pandas'\n"
            "    and np.__name__ == 'numpy'\n"
            "    and sns.__name__ == 'seaborn'\n"
            "    and df.shape == (569, 31)\n"
            "    and df.columns[-1] == 'diagnosis'\n"
            "    and 'some_random_variable' not in globals()\n"
            ")\n"
            "reset_check"
        )
        page.locator("#notebookPanel article").last.locator("button.run").click()
        reset_check_index = page.locator("#notebookPanel article").count() - 1
        wait_for_cell(page, reset_check_index)
        if "True" not in page.locator("#outputList .output-item").last.inner_text():
            raise AssertionError("Browser reset did not restore runtime aliases and the pristine raw dataframe.")

        browser.close()

    if browser_errors:
        raise AssertionError("Browser/Pyodide smoke test reported errors:\n" + "\n".join(browser_errors))
    print("Browser/Pyodide smoke test passed: invalidation, complete supervised 9-step route, and fitted PCA route.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
