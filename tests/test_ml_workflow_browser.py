"""Focused browser regression for the revised ML route surface.

This focused suite uses the generated route task IDs rendered by the page, then exercises the pinned local
Pyodide bundle through the real worker and editable cells.  Run it against a
disposable source/dist overlay, for example::

    python tests/test_ml_workflow_browser.py \
      --base-url 'http://127.0.0.1:8003/ml.html?runtime=local' \
      --engine chromium
"""

from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


READY_TEXT = "Pyodide 0.26.4 ready"
REMOVED_TEXT = (
    "Start Exploring Data",
    "Machine Learning",
    "System appearance",
    "Save notebook",
    "Open saved notebook",
    "Export last executed report",
    "Delete saved drafts",
    "Your Conclusion",
)


def wait_ready(page, timeout: int = 180_000) -> None:
    page.wait_for_function(
        "ready => document.querySelector('#runtimeStatus')?.textContent.includes(ready)",
        arg=READY_TEXT,
        timeout=timeout,
    )


def route_ids(page) -> list[str]:
    return page.locator("#routeStrip .route-card").evaluate_all(
        "cards => cards.map(card => card.dataset.taskId)"
    )


def wait_route(page, expected: list[str], timeout: int = 30_000) -> None:
    page.wait_for_function(
        "expected => JSON.stringify([...document.querySelectorAll('#routeStrip .route-card')].map(card => card.dataset.taskId)) === JSON.stringify(expected)",
        arg=expected,
        timeout=timeout,
    )


def select_route(page, dataset: str, scenario: str, model: str) -> list[str]:
    page.select_option("#datasetSelect", dataset)
    page.wait_for_function("value => document.querySelector('#datasetSelect').value === value", arg=dataset)
    wait_ready(page)
    page.select_option("#scenarioSelect", scenario)
    page.wait_for_function("value => document.querySelector('#scenarioSelect').value === value", arg=scenario)
    wait_ready(page)
    page.select_option("#modelSelect", model)
    page.wait_for_function("value => document.querySelector('#modelSelect').value === value", arg=model)
    wait_ready(page)
    expected = route_ids(page)
    if not expected:
        raise AssertionError(f"No route tasks rendered for {dataset}/{scenario}/{model}.")
    wait_route(page, expected)
    return expected


def article_for_title(page, title: str):
    articles = page.locator("#notebookPanel article.cell")
    for index in range(articles.count()):
        article = articles.nth(index)
        if article.locator(".cell-label").inner_text().strip() == title:
            return article
    raise AssertionError(f"No rendered cell with title {title!r}.")


def output_for_title(page, title: str):
    items = page.locator("#outputList .output-item")
    for index in range(items.count()):
        item = items.nth(index)
        if item.locator(".output-item-head strong").inner_text().strip() == title:
            return item
    # On a narrow viewport, output is mounted into each cell instead of the
    # desktop report.  The caller uses a desktop viewport, but this fallback
    # keeps the helper honest if a device-sized run is requested later.
    articles = page.locator("#notebookPanel article.cell")
    for index in range(articles.count()):
        article = articles.nth(index)
        if article.locator(".cell-label").inner_text().strip() == title:
            item = article.locator(".cell-inline-output .output-item")
            if item.count():
                return item.last
    raise AssertionError(f"No output card with title {title!r}.")


def open_optional(details) -> None:
    """Open a disclosure before clicking controls mounted inside it."""
    details.locator("summary").click()
    if not details.evaluate("element => element.open"):
        raise AssertionError("Optional evidence disclosure did not open.")


def wait_cell(page, title: str, timeout: int = 180_000):
    page.wait_for_function(
        "title => [...document.querySelectorAll('#notebookPanel article.cell')].some(article => article.querySelector('.cell-label')?.textContent.trim() === title && ['done', 'error'].includes(article.dataset.status))",
        arg=title,
        timeout=timeout,
    )
    article = article_for_title(page, title)
    status = article.get_attribute("data-status")
    if status != "done":
        raise AssertionError(f"Route cell {title!r} failed:\n{article.inner_text()}")
    return article


def wait_new_optional(page, previous_titles: list[str], timeout: int = 180_000):
    """Return the dynamically labelled optional cell added by a disclosure."""
    page.wait_for_function(
        "previous => [...document.querySelectorAll('#notebookPanel article.cell .cell-label')].map(label => label.textContent.trim()).some(title => title.startsWith('Optional evidence · ') && !previous.includes(title))",
        arg=previous_titles,
        timeout=timeout,
    )
    titles = page.locator("#notebookPanel article.cell .cell-label").all_inner_texts()
    new_titles = [title.strip() for title in titles if title.strip().startswith("Optional evidence · ") and title.strip() not in previous_titles]
    if not new_titles:
        raise AssertionError("The optional evidence button did not add a labelled cell.")
    optional_title = new_titles[-1]
    return optional_title, wait_cell(page, optional_title, timeout)


def run_task(page, task_id: str, timeout: int = 180_000):
    card = page.locator(f"#routeStrip .route-card[data-task-id='{task_id}']")
    if card.count() != 1:
        raise AssertionError(f"Expected one route card for task ID {task_id!r}.")
    title = card.locator(".route-title").inner_text().strip()
    if card.is_disabled():
        raise AssertionError(f"Route task {task_id!r} ({title}) was disabled before its turn.")
    card.click()
    return wait_cell(page, title, timeout)


def run_route(page, expected: list[str], timeout: int = 180_000) -> None:
    for task_id in expected:
        run_task(page, task_id, timeout)
    if page.locator("#notebookPanel article.cell[data-status='error']").count():
        raise AssertionError("A route cell has an error status after the route completed.")
    if page.locator("#outputList .output-item[data-status='error']").count():
        raise AssertionError("The route report contains a Python error output.")


def assert_removed_controls(page) -> None:
    if page.locator(".appearance-select").count():
        raise AssertionError("System appearance selector was recreated in the ML page.")
    if page.locator("#notebookPanel article[data-teaching-role='conclusion']").count():
        raise AssertionError("A conclusion field was recreated in the notebook.")
    toolbar_text = page.locator(".notebook-actions").inner_text()
    for label in REMOVED_TEXT:
        if label in toolbar_text:
            raise AssertionError(f"Removed notebook control is still visible: {label}")
    if page.locator("#themeButton").count() != 1:
        raise AssertionError("The existing moon/sun theme toggle disappeared.")


def assert_final_latch(page, expected: list[str]) -> None:
    if expected[-1] != "final":
        raise AssertionError(f"Expected a final task in a supervised route, got {expected}.")
    if page.locator("#holdoutState").inner_text().strip() != "opened once":
        raise AssertionError("The final supervised task did not open the holdout exactly once.")
    final_card = page.locator("#routeStrip .route-card[data-task-id='final']")
    if not final_card.is_disabled() or final_card.get_attribute("data-state") != "done":
        raise AssertionError("The final route card was not latched after its one-time evaluation.")
    final_article = article_for_title(page, final_card.locator(".route-title").inner_text().strip())
    run_button = final_article.locator("button.cell-action.run")
    if run_button.count() != 1 or not run_button.is_disabled() or run_button.inner_text().strip() != "used once":
        raise AssertionError("The final cell did not become a one-use disabled editor.")


def assert_optional_edit_invalidates(page, expected: list[str]) -> None:
    task_id = expected[-1]
    final_card = page.locator(f"#routeStrip .route-card[data-task-id='{task_id}']")
    title = final_card.locator(".route-title").inner_text().strip()
    article = article_for_title(page, title)
    optional = article.locator("details.optional-route-code")
    if optional.count() != 1:
        raise AssertionError(f"Route task {task_id!r} has no optional evidence surface.")
    previous_titles = page.locator("#notebookPanel article.cell .cell-label").all_inner_texts()
    open_optional(optional)
    optional.locator("button.optional-route-run").click()
    optional_title, optional_article = wait_new_optional(page, previous_titles)
    editor = optional_article.locator("textarea")
    original = editor.input_value()
    editor.fill(original + '\noptional_table = pd.DataFrame({"edited_check": [True]})\noptional_table')
    # Editing invalidates the cell immediately.  The previous result remains
    # visible while the cell is stale, so wait for that state rather than
    # waiting for a second execution that this regression intentionally does
    # not trigger.
    page.wait_for_function(
        "title => [...document.querySelectorAll('#notebookPanel article.cell')].some(article => article.querySelector('.cell-label')?.textContent.trim() === title && article.dataset.status === 'stale')",
        arg=optional_title,
        timeout=30_000,
    )
    optional_article.locator("button.cell-action.run").click()
    optional_article = wait_cell(page, optional_title)
    result = output_for_title(page, optional_title)
    headers = result.locator(".result-table thead th").all_inner_texts()
    if headers != ["edited_check"]:
        raise AssertionError(f"The edited optional cell did not render its own last-expression table: {headers}")
    frame_card = page.locator("#routeStrip .route-card[data-task-id='frame']")
    if frame_card.get_attribute("data-state") == "done":
        raise AssertionError("Editing optional evidence left the suggested route falsely complete.")
    if page.locator("#notebookPanel article.cell[data-status='error']").count():
        raise AssertionError("Editing optional evidence introduced a Python error.")


def run(page, base_url: str) -> dict[str, object]:
    browser_errors: list[str] = []
    page.on("pageerror", lambda error: browser_errors.append(str(error)))
    page.on("console", lambda message: browser_errors.append(message.text) if message.type == "error" else None)

    page.goto(base_url, wait_until="domcontentloaded")
    wait_ready(page)
    assert_removed_controls(page)

    # The initial route is the default supervised workflow.  Its final task
    # proves the holdout latch and provides the primary final-result smoke.
    default_ids = route_ids(page)
    run_route(page, default_ids)
    assert_final_latch(page, default_ids)
    default_result = output_for_title(page, "Final test")
    if default_result.locator(".result-table").count() != 1:
        raise AssertionError("The default final cell did not render its final-result table.")

    car_ids = select_route(page, "car", "categorical", "one_r")
    if "diagnose" not in car_ids or "final" not in car_ids:
        raise AssertionError(f"Car One-R route is missing dynamic diagnostic/final tasks: {car_ids}")
    run_route(page, car_ids)
    car_diagnostic = output_for_title(page, "Inspect validation errors")
    if car_diagnostic.locator(".result-table").count() or car_diagnostic.locator(".chart-wrap").count() != 1:
        raise AssertionError("Car One-R primary diagnostic did not render its training-only evidence.")
    car_article = article_for_title(page, "Inspect validation errors")
    optional = car_article.locator("details.advanced-diagnostic-code")
    if optional.count() != 1:
        raise AssertionError("Car One-R named rule-table evidence was not exposed as advanced optional depth.")
    previous_titles = page.locator("#notebookPanel article.cell .cell-label").all_inner_texts()
    open_optional(optional)
    optional.locator("button.advanced-diagnostic-run").click()
    one_r_title, one_r_optional = wait_new_optional(page, previous_titles)
    one_r_output = output_for_title(page, one_r_title)
    if one_r_output.locator(".result-table thead th").all_inner_texts() != ["feature", "interval", "predicted_class", "training_rows"]:
        raise AssertionError("Car One-R optional evidence did not render the named rule table.")

    wine_ids = select_route(page, "wine", "continuous", "polynomial")
    if "tune" not in wine_ids:
        raise AssertionError(f"Wine polynomial route lost its tuning task: {wine_ids}")
    model_article = None
    for task_id in wine_ids:
        article = run_task(page, task_id, timeout=240_000)
        if task_id == "model":
            model_article = article
    if model_article is None or not all(token in model_article.locator("textarea").input_value() for token in ("PolynomialFeatures", '"polynomial"', '"scale"', '"model"')):
        raise AssertionError("Wine polynomial model cell did not expose one flattened pipeline.")
    if page.locator("#notebookPanel article.cell[data-status='error']").count():
        raise AssertionError("Wine polynomial route produced a Python error.")

    seoul_ids = select_route(page, "seoul", "simple", "simple_linear")
    seoul_split = None
    seoul_baseline = None
    for task_id in seoul_ids:
        article = run_task(page, task_id, timeout=240_000)
        if task_id == "split":
            seoul_split = article
        elif task_id == "baseline":
            seoul_baseline = article
    if seoul_split is None or "iloc[:split_at]" not in seoul_split.locator("textarea").input_value():
        raise AssertionError("Seoul did not preserve the chronological split in the visible cell.")
    if seoul_baseline is None or "TimeSeriesSplit" not in seoul_baseline.locator("textarea").input_value():
        raise AssertionError("Seoul did not use the time-aware validation splitter.")
    if page.locator("#notebookPanel article.cell[data-status='error']").count():
        raise AssertionError("Seoul time-regression route produced a Python error.")
    seoul_final = output_for_title(page, "Final test")
    if seoul_final.locator(".result-table").count() != 1:
        raise AssertionError("Seoul final test did not render its own result table.")

    hierarchy_ids = select_route(page, "breast", "continuous5", "hierarchical")
    if hierarchy_ids != ["frame", "explore", "prepare", "dendrogram", "compare", "fit", "profile", "visualise"]:
        raise AssertionError(f"Unexpected hierarchical task IDs: {hierarchy_ids}")
    run_route(page, hierarchy_ids, timeout=240_000)
    hierarchy_profile = output_for_title(page, "Explain the groups")
    if not all(token in hierarchy_profile.inner_text() for token in ("cluster", "original-unit", "sample")):
        raise AssertionError("Hierarchical profile output lost named sample/original-unit evidence.")

    pca_ids = select_route(page, "breast", "continuous5", "pca")
    if pca_ids != ["frame", "explore", "prepare", "variance", "select", "loadings", "project"]:
        raise AssertionError(f"Unexpected PCA task IDs: {pca_ids}")
    run_route(page, pca_ids, timeout=240_000)
    pca_project = output_for_title(page, "Project the rows")
    if "2D PCA projection" not in pca_project.inner_text() or "later components" not in pca_project.inner_text():
        raise AssertionError("PCA project output did not distinguish the two-dimensional view from later components.")
    assert_optional_edit_invalidates(page, pca_ids)

    if browser_errors:
        raise AssertionError("Browser/Pyodide errors:\n" + "\n".join(browser_errors))
    return {
        "default_route": default_ids,
        "car_one_r": car_ids,
        "wine_polynomial": wine_ids,
        "seoul_time": seoul_ids,
        "hierarchical": hierarchy_ids,
        "pca": pca_ids,
        "browser_errors": browser_errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
    args = parser.parse_args()

    with sync_playwright() as playwright:
        browser_type = getattr(playwright, args.engine)
        browser = browser_type.launch()
        context = browser.new_context(
            viewport={"width": 1440, "height": 1100},
            service_workers="block",
            base_url=args.base_url,
        )
        page = context.new_page()
        result = run(page, args.base_url)
        browser.close()
    print(f"Focused pinned Pyodide browser regression passed ({args.engine}): {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
