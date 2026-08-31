"""Headless browser smoke test for representative Pyodide routes."""

from __future__ import annotations

import argparse
import re

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
        "index => ['done', 'error'].includes(document.querySelectorAll('#notebookPanel article.cell')[index]?.dataset.status)",
        arg=index,
        timeout=timeout,
    )
    status = page.locator("#notebookPanel article.cell").nth(index).get_attribute("data-status")
    if status != "done":
        output = page.locator("#outputList .output-item").last.inner_text()
        raise AssertionError(f"Browser cell {index + 1} failed:\n{output}")


def assert_no_matplotlib_deprecation(page) -> None:
    """A supported Matplotlib call must not reintroduce the known deprecation."""

    outputs = page.locator(
        "#outputList .output-item[data-warnings='true'], "
        "#notebookPanel .output-item[data-warnings='true']"
    ).all_inner_texts()
    for output in outputs:
        if re.search(r"matplotlib.*deprecat|deprecat.*matplotlib", output, re.IGNORECASE):
            raise AssertionError(f"A Matplotlib deprecation warning reached the learner output:\n{output}")


def assert_onehot_warning_is_explained(page) -> None:
    """If fold-local unknown categories warn, retain the learner-facing reason."""

    outputs = page.locator(
        "#outputList .output-item[data-warnings='true'], "
        "#notebookPanel .output-item[data-warnings='true']"
    ).all_inner_texts()
    for output in outputs:
        if re.search(r"OneHotEncoder|unknown categor", output, re.IGNORECASE) and "unknown-category" not in output.lower():
            raise AssertionError(f"Unknown-category warning lost its methodology explanation:\n{output}")


def assert_primary_surface(page, article_index: int, forbidden: tuple[str, ...] = ()) -> None:
    """Keep the visible diagnostic editor concise and free of evidence plumbing."""

    article = page.locator("#notebookPanel article.cell").nth(article_index)
    editor = article.locator("textarea")
    if editor.count() != 1:
        raise AssertionError(f"No editable primary Python surface was rendered for cell {article_index + 1}.")
    code = editor.input_value()
    if len(code.splitlines()) > 35:
        raise AssertionError(
            f"Primary diagnostic cell {article_index + 1} exceeds the 35-line hard maximum "
            f"({len(code.splitlines())} lines)."
        )
    for token in forbidden:
        if token in code:
            raise AssertionError(f"Primary diagnostic cell {article_index + 1} exposed diagnostic plumbing {token!r}.")
    if re.search(r"\.support_\b|\.tree_(?:children_left|children_right|feature|threshold)\b", code):
        raise AssertionError(f"Primary diagnostic cell {article_index + 1} exposed internal estimator traversal.")
    # Advanced evidence construction, if a route provides it, is an optional
    # disclosure.  It must not be open by default or become the main cell.
    open_advanced = page.locator("details").evaluate_all(
        "nodes => nodes.filter(node => /advanced/i.test(node.querySelector('summary')?.textContent || '') && node.open).length"
    )
    if open_advanced:
        raise AssertionError("Advanced diagnostic construction was expanded on the beginner surface by default.")


def article_output(page, article_index: int):
    """Return the output card whether the viewport uses the desktop report or inline mobile output."""

    inline = page.locator("#notebookPanel .cell-stack").nth(article_index).locator(".cell-inline-output .output-item")
    return inline if inline.count() else page.locator("#outputList .output-item").nth(article_index)


def run_steps(page, count: int, start: int = 0, timeout: int = 120_000) -> None:
    for index in range(start, start + count):
        button = page.locator("#routeStrip .route-card").nth(index)
        button.wait_for(state="visible", timeout=15_000)
        if button.is_disabled():
            raise AssertionError(f"Route step {index + 1} was disabled unexpectedly.")
        button.click()
        wait_for_cell(page, index, timeout=timeout)
        if page.locator("#outputList .output-item[data-status='error']").count():
            raise AssertionError(f"Route step {index + 1} produced a Python error.")


def assert_notebook_toolbar(page) -> None:
    toolbar = page.locator(".notebook-bar .notebook-actions")
    if toolbar.count() != 1:
        raise AssertionError("The ML notebook toolbar is missing.")
    buttons = toolbar.locator("button")
    expected = ["＋ Explore", "＋ Add cell", "▶ Run all", "↺ Reset data"]
    labels = [label.strip() for label in buttons.all_inner_texts()]
    if buttons.count() != len(expected) or labels != expected:
        raise AssertionError(f"ML notebook toolbar changed unexpectedly: {labels}")
    for selector in ("#guidedModeButton", "#practiceModeButton", "#practiceModeNote", "#exploreButton"):
        if page.locator(selector).count():
            if selector == "#practiceModeNote" and not page.locator(selector).is_hidden():
                raise AssertionError("Practice mode note should start hidden in Guided mode.")


def select_route(page, dataset: str, scenario: str, model: str, expected_steps: int) -> None:
    page.select_option("#datasetSelect", dataset)
    wait_for_ready(page)
    page.select_option("#scenarioSelect", scenario)
    wait_for_ready(page)
    page.select_option("#modelSelect", model)
    wait_for_ready(page)
    wait_for_route(page, expected_steps)


def assert_model_teaching(page, tokens: tuple[str, ...]) -> None:
    assert_primary_surface(
        page,
        7,
        (
            "named_steps",
            "fit_indices",
            "validation_indices",
            "meshgrid",
            "region_codes",
            "tree_transformed",
            "mlp_oof_model",
            "nb_quantity_rows",
            "coefs_",
            "np.matmul",
            "np.dot",
            "inverse_transform",
        ),
    )
    assert_no_matplotlib_deprecation(page)
    block = page.locator("#notebookPanel article").nth(7).locator("[data-teaching-role='model-specific']")
    if block.count() != 1:
        raise AssertionError("Step 8 did not render the model-specific interpretation block.")
    text = block.inner_text().lower()
    missing = [token for token in tokens if token.lower() not in text]
    if missing:
        raise AssertionError(f"Step 8 model-specific teaching is missing {missing}: {block.inner_text()}")


def assert_mlp_step8(page, model: str, tokens: tuple[str, ...]) -> None:
    assert_primary_surface(
        page,
        7,
        (
            "named_steps",
            "fit_indices",
            "validation_indices",
            "mlp_oof_model",
            "coefs_",
            "np.matmul",
            "np.dot",
            "transformer_",
            "inverse_transform",
        ),
    )
    assert_no_matplotlib_deprecation(page)
    assert_model_teaching(page, ("weights", "nonlinear", "training loss", "generalization"))
    diagnostic = page.locator("#outputList .output-item").nth(7)
    text = diagnostic.inner_text()
    missing = [token for token in tokens if token not in text]
    if missing:
        raise AssertionError(f"{model} Step 8 is missing {missing}: {text}")
    if "coefs_" in text or "transformer_" in text or "inverse_transform" in text:
        raise AssertionError(f"{model} Step 8 exposed implementation plumbing in the learner output: {text}")
    if page.locator("#holdoutState").text_content().strip() != "sealed":
        raise AssertionError(f"{model} Step 8 opened the final test set unexpectedly.")


def preview_headers(page) -> list[str]:
    return page.locator("#preview table thead th").all_inner_texts()


def assert_unsupervised_preview_hidden(page, target: str) -> None:
    headers = preview_headers(page)
    if target in headers:
        raise AssertionError(f"Unsupervised Inspector preview exposed the reference target {target!r}: {headers}")
    for selector in ("#problemTags", "#datasetDescription", "#datasetQuestion", "#sourceNote", "#routeDescription"):
        if target.lower() in page.locator(selector).inner_text().lower():
            raise AssertionError(f"Unsupervised discovery copy exposed the reference target {target!r} in {selector}.")


def assert_unsupervised_guidance(page, article_index: int, question: str, cue: str) -> None:
    article = page.locator("#notebookPanel article").nth(article_index)
    question_node = article.locator("[data-teaching-role='question']")
    cue_node = article.locator("[data-teaching-role='reading-cue']")
    if question_node.count() != 1 or question.lower() not in question_node.inner_text().lower():
        raise AssertionError(f"Unsupervised question was not visible beside step {article_index + 1}.")
    if cue_node.count() != 1 or cue.lower() not in cue_node.inner_text().lower():
        raise AssertionError(f"Unsupervised reading cue was not visible beside step {article_index + 1}.")


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

        assert_notebook_toolbar(page)
        if page.locator("#runAllButton").is_disabled():
            raise AssertionError("Run All was unavailable after the Python runtime became ready.")
        if page.locator("#holdoutState").text_content().strip() != "sealed":
            raise AssertionError("The supervised route did not start with a sealed test set.")

        # The removed mode controls leave the browser in the internal default
        # Guided state, so the workflow reference should show its exact route
        # code without requiring a toolbar mode switch.
        page.locator("#guideButton").click()
        page.locator("#guideWindow").wait_for(state="visible", timeout=10_000)
        if page.locator("#guideBody .workflow-code").count() == 0:
            raise AssertionError("Default Guided Workflow Reference did not show exact route code.")
        page.locator("#guideClose").click()

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

        page.locator("#addCellButton").click()
        warning_editor = page.locator("#notebookPanel textarea").last
        warning_editor.fill(
            "import warnings\n"
            "warnings.warn('This is a harmless teaching warning', UserWarning)\n"
            "print('warning cell completed')"
        )
        page.locator("#notebookPanel article").last.locator("button.run").click()
        warning_index = page.locator("#notebookPanel article").count() - 1
        wait_for_cell(page, warning_index)
        if page.locator("#notebookPanel article").nth(warning_index).get_attribute("data-status") != "done":
            raise AssertionError("A harmless Python warning incorrectly failed its cell.")
        warning_item = page.locator("#outputList .output-item[data-warnings='true']").last
        if warning_item.count() != 1 or "This is a harmless teaching warning" not in warning_item.inner_text():
            raise AssertionError("The browser did not render the captured Python warning.")
        if page.locator("#outputList .output-item[data-status='error']").count():
            raise AssertionError("A harmless Python warning produced a red/error result.")
        next_route = page.locator("#routeStrip .route-card").nth(1)
        if next_route.is_disabled():
            raise AssertionError("A warning cell incorrectly blocked the next guided route step.")
        next_route.click()
        next_route_index = page.locator("#notebookPanel article").count() - 1
        wait_for_cell(page, next_route_index)

        page.locator("#addCellButton").click()
        error_editor = page.locator("#notebookPanel textarea").last
        error_editor.fill(
            "import warnings\n"
            "warnings.warn('warning before exception', UserWarning)\n"
            "raise ValueError('intentional error rendering check')"
        )
        page.locator("#notebookPanel article").last.locator("button.run").click()
        error_index = page.locator("#notebookPanel article").count() - 1
        page.wait_for_function(
        "index => ['done', 'error'].includes(document.querySelectorAll('#notebookPanel article.cell')[index]?.dataset.status)",
            arg=error_index,
            timeout=120_000,
        )
        if page.locator("#notebookPanel article").nth(error_index).get_attribute("data-status") != "error":
            raise AssertionError("A genuine exception did not fail its cell.")
        error_item = page.locator("#outputList .output-item[data-status='error']").last
        if error_item.count() != 1 or "intentional error rendering check" not in error_item.inner_text():
            raise AssertionError("The browser did not render the genuine exception as an error.")
        if error_item.locator(".console-output.warning").count():
            raise AssertionError("A warning emitted before an exception was rendered as a successful warning.")

        select_route(page, "wine", "continuous", "multiple_linear", 9)
        if "diagnosis" not in preview_headers(page):
            if "quality" not in preview_headers(page):
                raise AssertionError("Supervised Inspector preview did not show the reference target before clustering.")
        page.select_option("#modelSelect", "kmeans")
        wait_for_ready(page)
        wait_for_route(page, 8)
        assert_unsupervised_preview_hidden(page, "quality")
        page.select_option("#modelSelect", "multiple_linear")
        wait_for_ready(page)
        wait_for_route(page, 9)
        if "quality" not in preview_headers(page):
            raise AssertionError("Switching back to a supervised model did not restore the target preview.")

        select_route(page, "breast", "continuous5", "kmeans", 8)
        assert_unsupervised_preview_hidden(page, "diagnosis")
        run_steps(page, 8)
        assert_unsupervised_guidance(page, 0, "what structure", "reference labels")
        assert_unsupervised_guidance(page, 3, "candidate values of k", "elbow")
        assert_unsupervised_guidance(page, 4, "runnable starting k", "edit selected_k")
        kmeans_compare = page.locator("#outputList .output-item").nth(3)
        if "Mechanical silhouette suggestion (not a final answer)" not in kmeans_compare.inner_text():
            raise AssertionError("K-Means did not label silhouette argmax as a non-decisive suggestion.")
        kmeans_fit = page.locator("#outputList .output-item").nth(4)
        if "selected_k" not in kmeans_fit.inner_text() or "silhouette" not in kmeans_fit.inner_text():
            raise AssertionError("K-Means selected solution evidence was not rendered.")
        kmeans_diagnostic = page.locator("#outputList .output-item").nth(5)
        kmeans_article = page.locator("#notebookPanel article").nth(5)
        if kmeans_article.locator("[data-teaching-role='model-specific']").count() != 1 or not all(
            token.lower() in kmeans_article.inner_text().lower()
            for token in ("centroid", "PCA", "WHAT IT LEARNED")
        ) or "Very tiny clusters" not in kmeans_diagnostic.inner_text():
            raise AssertionError("K-Means model-specific interpretation was not rendered beside its evidence.")
        kmeans_profile = page.locator("#outputList .output-item").nth(6)
        if not all(token.lower() in kmeans_profile.inner_text().lower() for token in ("cluster", "radius_mean", "centroid")):
            raise AssertionError("K-Means original-unit profile/centroid evidence was not rendered.")
        kmeans_map = page.locator("#outputList .output-item").nth(7)
        if "all selected prepared dimensions" not in kmeans_map.inner_text():
            raise AssertionError("K-Means PCA projection warning was not rendered.")
        if page.locator("#holdoutState").text_content().strip() == "opened once":
            raise AssertionError("K-Means discovery opened the supervised holdout.")

        select_route(page, "penguins", "continuous", "kmeans", 8)
        assert_unsupervised_preview_hidden(page, "species")
        run_steps(page, 8)
        penguins_kmeans_text = page.locator("#outputList").inner_text()
        if "inertia" not in penguins_kmeans_text or "silhouette" not in penguins_kmeans_text or "PCA" not in penguins_kmeans_text:
            raise AssertionError("Penguins K-Means did not render the shared clustering evidence.")

        select_route(page, "breast", "continuous5", "hierarchical", 8)
        assert_unsupervised_preview_hidden(page, "diagnosis")
        run_steps(page, 8)
        assert_unsupervised_guidance(page, 2, "reproducible sample", "sample size")
        assert_unsupervised_guidance(page, 3, "leaves, joins", "horizontal cut")
        hierarchical_prepare = page.locator("#outputList .output-item").nth(2)
        if not all(token in hierarchical_prepare.inner_text() for token in ("dataset_rows", "sampled_rows", "500")):
            raise AssertionError("Hierarchical sample-size evidence was not rendered.")
        hierarchical_dendrogram = page.locator("#outputList .output-item").nth(3)
        if not all(token in hierarchical_dendrogram.inner_text() for token in ("Ward merge height", "merge_height", "Leaves represent")):
            raise AssertionError("Hierarchical dendrogram evidence did not explain merge heights.")
        hierarchical_compare = page.locator("#outputList .output-item").nth(4)
        if "Mechanical silhouette suggestion (not a final answer)" not in hierarchical_compare.inner_text():
            raise AssertionError("Hierarchical clustering still presented silhouette argmax as the final cut.")
        hierarchical_fit = page.locator("#outputList .output-item").nth(5)
        if "runnable starting cut" not in page.locator("#notebookPanel article").nth(5).inner_text().lower() or "selected_k" not in page.locator("#notebookPanel article").nth(5).inner_text():
            raise AssertionError("Hierarchical neutral cut teaching was not rendered.")
        hierarchical_profile = page.locator("#outputList .output-item").nth(6)
        hierarchical_profile_article = page.locator("#notebookPanel article").nth(6)
        if hierarchical_profile_article.locator("[data-teaching-role='model-specific']").count() != 1 or "WHAT IT LEARNED" not in hierarchical_profile_article.inner_text() or not all(token in hierarchical_profile.inner_text() for token in ("cluster", "radius_mean")):
            raise AssertionError("Hierarchical original-unit profile was not rendered.")
        hierarchical_map = page.locator("#outputList .output-item").nth(7)
        if "two-dimensional projection" not in hierarchical_map.inner_text():
            raise AssertionError("Hierarchical PCA projection limitation was not rendered.")
        if page.locator("#holdoutState").text_content().strip() == "opened once":
            raise AssertionError("Hierarchical discovery opened the supervised holdout.")

        select_route(page, "wine", "continuous", "hierarchical", 8)
        assert_unsupervised_preview_hidden(page, "quality")
        run_steps(page, 8, timeout=180_000)
        if "reference target" in page.locator("#problemTags").inner_text().lower() or "quality" in page.locator("#preview").inner_text().lower():
            raise AssertionError("Wine hierarchical discovery exposed its numeric reference target.")

        select_route(page, "breast", "continuous5", "knn_cls", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("nearby prepared training examples", "out-of-fold", "cannot vote for itself"))
        knn_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in knn_diagnostic.inner_text() for value in ("Selected out-of-fold row", "Actual class", "Prediction", "Selected k", "neighbor_class", "distance_after_preprocessing")):
            raise AssertionError("KNN Step 8 did not show the selected row, fitted neighbour evidence, and prediction.")
        if knn_diagnostic.locator("table").count() != 1:
            raise AssertionError("KNN Step 8 neighbour table was not rendered.")
        first_teaching = page.locator("#notebookPanel article").nth(0).locator("[data-teaching-role='question']")
        first_cue = page.locator("#notebookPanel article").nth(0).locator("[data-teaching-role='reading-cue']")
        if first_teaching.count() != 1 or "what are we trying to predict" not in first_teaching.inner_text().lower():
            raise AssertionError("Classification journey did not show the guided learner question beside Step 1.")
        if first_cue.count() != 1 or "X contains" not in first_cue.inner_text():
            raise AssertionError("Classification journey did not show the Step 1 reading cue.")
        frame_concept_text = page.locator("#notebookPanel article").nth(0).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in frame_concept_text for value in ("FEATURE / TARGET", "X / y", "one tumour sample")):
            raise AssertionError("Classification Step 1 did not explain feature/target/X/y and row meaning.")
        split_concept_text = page.locator("#notebookPanel article").nth(1).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in split_concept_text for value in ("TRAINING / FINAL TEST", "80 / 20", "random_state=42", "stratify=y")):
            raise AssertionError("Classification Step 2 did not explain training/test, reproducibility, and stratification.")
        prepare_concept_text = page.locator("#notebookPanel article").nth(3).locator("[data-teaching-role='concept']").inner_text()
        if "KNN compares distances" not in prepare_concept_text or "scaled" not in prepare_concept_text:
            raise AssertionError("KNN preparation did not explain why scaling is used.")
        model_concept_text = page.locator("#notebookPanel article").nth(4).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in model_concept_text for value in ("PIPELINE", "fit()", "predict()", "validation rows do not leak")):
            raise AssertionError("Pipeline/fit/predict teaching was not visible beside the model cell.")
        cv_concept_text = page.locator("#notebookPanel article").nth(5).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in cv_concept_text for value in ("FOLD", "trains on 4 parts", "final test set is not involved", "Stratified folds")):
            raise AssertionError("Classification cross-validation mechanics were not explained.")
        tune_concept_text = page.locator("#notebookPanel article").nth(6).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in tune_concept_text for value in ("n_neighbors (k)", "GridSearchCV", "final test set stays untouched")):
            raise AssertionError("KNN hyperparameter/GridSearchCV teaching was not visible.")
        classification_baseline = page.locator("#outputList .output-item").nth(5)
        if classification_baseline.locator("table").count() != 1:
            raise AssertionError("The classification fold table disappeared when the CV teaching summary was added.")
        if classification_baseline.locator("[data-teaching-result='cv-summary']").count() != 1:
            raise AssertionError("Classification CV summary was not rendered.")
        if page.locator("#notebookPanel article").nth(5).locator("[data-teaching-role='metric']").count() != 1 or "Macro F1" not in page.locator("#notebookPanel article").nth(5).inner_text():
            raise AssertionError("Classification metric meaning was not rendered at first use.")
        classification_final = page.locator("#outputList .output-item").nth(8)
        if classification_final.locator("[data-teaching-result='final-comparison']").count() != 1:
            raise AssertionError("Classification final output did not compare against prior CV evidence.")
        final_comparison_text = classification_final.locator("[data-teaching-result='final-comparison']").inner_text()
        if not all(label in final_comparison_text for label in ("Mean CV", "CV range", "Final test")):
            raise AssertionError("Classification final comparison is missing one of its evidence rows.")

        select_route(page, "gapminder", "simple", "simple_linear", 9)
        run_steps(page, 3)
        gapminder_frame = page.locator("#notebookPanel article").nth(0).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in gapminder_frame for value in ("GDP per person", "life expectancy", "one country in 2007", "X / y")):
            raise AssertionError("Gapminder did not explain its feature, target, row, and X/y objects.")
        gapminder_split = page.locator("#notebookPanel article").nth(1).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in gapminder_split for value in ("Training data", "final test set", "80%", "random_state=42")):
            raise AssertionError("Gapminder split concepts were not visible.")
        describe_text = page.locator("#outputList .output-item").last.inner_text()
        if "gdpPercap" not in describe_text:
            raise AssertionError("Regression describe().T output did not preserve the feature name gdpPercap.")
        run_steps(page, 6, start=3)
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
        if page.locator("#outputList .output-item").nth(5).locator("[data-teaching-result='cv-summary']").count() != 1:
            raise AssertionError("Regression CV summary was not rendered.")
        regression_final_comparison = page.locator("#outputList .output-item").nth(8).locator("[data-teaching-result='final-comparison']")
        if regression_final_comparison.count() != 1 or "RMSE" not in regression_final_comparison.inner_text() or "MAE" not in page.locator("#outputList .output-item").nth(8).inner_text():
            raise AssertionError("Regression final output did not include metric teaching and CV comparison.")
        if page.locator("#holdoutState").text_content().strip() != "opened once":
            raise AssertionError("The final supervised step did not open the saved test set exactly once.")
        if not page.locator("#routeStrip .route-card").nth(8).is_disabled():
            raise AssertionError("The final supervised route remained rerunnable after using the test set.")
        if not page.locator("#notebookPanel article").nth(8).locator("button.run").is_disabled():
            raise AssertionError("The final notebook cell remained rerunnable after using the test set.")

        gapminder_model = page.locator("#notebookPanel article").nth(4).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in gapminder_model for value in ("PIPELINE", "fit()", "predict()", "numeric values")):
            raise AssertionError("Gapminder Pipeline/fit/predict teaching was incomplete.")
        if "keeps the model's current/default settings" not in page.locator("#notebookPanel article").nth(6).locator("[data-teaching-role='concept']").inner_text():
            raise AssertionError("Gapminder keep-defaults teaching was missing.")
        assert_model_teaching(page, ("straight-line", "fitted line", "intercept", "association"))
        simple_diagnostic = page.locator("#outputList .output-item").nth(7)
        if simple_diagnostic.locator(".chart-wrap").count() < 2 or not all(value in simple_diagnostic.inner_text() for value in ("feature", "slope_per_original_unit", "predicted_change_for_meaningful_change")):
            raise AssertionError("Simple-linear Step 8 did not render the fitted line and slope interpretation.")

        select_route(page, "gapminder", "simple", "polynomial", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("bend", "fitted curve", "noise"))
        polynomial_diagnostic = page.locator("#outputList .output-item").nth(7)
        if polynomial_diagnostic.locator(".chart-wrap").count() < 2 or not all(value in polynomial_diagnostic.inner_text() for value in ("feature", "degree", "curve_points")):
            raise AssertionError("Polynomial Step 8 did not render the fitted curve and degree summary.")

        select_route(page, "breast", "continuous5", "logistic", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("score", "probabilities", "prepared feature scales"))
        logistic_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in logistic_diagnostic.inner_text() for value in ("Positive/referenced class", "feature", "pushes_model_toward")) or logistic_diagnostic.locator("table").count() != 1:
            raise AssertionError("Logistic Step 8 did not name the binary class direction or weight table.")

        select_route(page, "breast", "continuous5", "svm_cls", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("boundary", "margin", "support vectors", "gamma"))
        svm_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in svm_diagnostic.inner_text() for value in ("Support vectors per class", "Selected out-of-fold row", "Decision score", "Actual class", "Predicted class")):
            raise AssertionError("Binary SVM Step 8 did not show support-vector and decision-score evidence.")
        if svm_diagnostic.locator("table").count() != 1:
            raise AssertionError("Binary SVM support-vector examples were not rendered as a table.")

        select_route(page, "penguins", "continuous", "svm_cls", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("multiple class-separation decisions", "no single universal boundary"))
        multiclass_svm_diagnostic = page.locator("#outputList .output-item").nth(7)
        if "Multiclass SVM combines multiple class-separation decisions" not in multiclass_svm_diagnostic.inner_text() or "no single universal boundary" not in multiclass_svm_diagnostic.inner_text():
            raise AssertionError("Multiclass SVM Step 8 used unsafe single-boundary wording.")

        select_route(page, "breast", "continuous5", "lda", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("class", "shared spread/shape", "straight decision boundaries"))
        lda_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in lda_diagnostic.inner_text() for value in ("Class centres", "fitted means in prepared feature units", "shared spread/shape", "Selected out-of-fold row", "Predicted class probabilities")):
            raise AssertionError("LDA Step 8 did not show class centres, shared spread, and a prediction story.")
        if lda_diagnostic.locator("table").count() != 1:
            raise AssertionError("LDA class-centre evidence was not rendered as a table.")

        select_route(page, "breast", "continuous5", "qda", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("separate spread/shape", "curve", "more data"))
        qda_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in qda_diagnostic.inner_text() for value in ("Per-feature spread by class", "The table shows each class's centre and per-feature spread.", "vary together within each class", "covariance/shape", "boundary can curve", "QDA regularisation parameter", "Predicted class probabilities")):
            raise AssertionError("QDA Step 8 did not show precise spread/covariance and prediction evidence.")
        if qda_diagnostic.locator("table").count() != 1:
            raise AssertionError("QDA class-centre evidence was not rendered as a table.")

        select_route(page, "breast", "continuous5", "naive_bayes", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("prior", "density", "posterior", "independent"))
        gaussian_nb_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in gaussian_nb_diagnostic.inner_text() for value in ("Gaussian Naive Bayes", "Prior probability", "Class-conditional density", "Posterior probability", "not the probability of one exact continuous value", "independence assumption")):
            raise AssertionError("Gaussian Naive Bayes Step 8 did not show typed prior, density, and posterior evidence.")
        gaussian_headers = gaussian_nb_diagnostic.locator("table thead th").all_inner_texts()
        if gaussian_headers != ["quantity_type", "class", "feature", "quantity_label", "quantity_value"]:
            raise AssertionError(f"Gaussian Naive Bayes evidence table has ambiguous columns: {gaussian_headers}")
        gaussian_density_values = []
        for row_text in gaussian_nb_diagnostic.locator("table tbody tr").all_inner_texts():
            if "Class-conditional density" in row_text:
                try:
                    gaussian_density_values.append(float(row_text.split()[-1]))
                except ValueError:
                    pass
        if not gaussian_density_values or max(gaussian_density_values) <= 1:
            raise AssertionError("Gaussian Naive Bayes browser output did not retain a valid density above 1.")

        select_route(page, "car", "categorical", "naive_bayes", 9)
        run_steps(page, 8)
        assert_model_teaching(page, ("prior", "likelihood", "posterior", "independent"))
        categorical_nb_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in categorical_nb_diagnostic.inner_text() for value in ("Bernoulli Naive Bayes", "buying=low", "Class-conditional probability", "P(buying=", "independence assumption")):
            raise AssertionError("Categorical Naive Bayes Step 8 did not preserve original category probability labels.")
        categorical_headers = categorical_nb_diagnostic.locator("table thead th").all_inner_texts()
        if categorical_headers != ["quantity_type", "class", "feature", "quantity_label", "quantity_value"]:
            raise AssertionError(f"Categorical Naive Bayes evidence table has ambiguous columns: {categorical_headers}")
        assert_onehot_warning_is_explained(page)

        select_route(page, "breast", "continuous5", "mlp_cls", 9)
        run_steps(page, 8)
        assert_mlp_step8(page, "Breast Cancer MLP classification", ("Fitted network structure", "prepared_inputs", "hidden_layers", "class probabilities", "training_iterations", "early_stopping", "Training loss during optimization", "Selected out-of-fold row", "Predicted probabilities by class", "actual_class", "predicted_class", "probability_"))
        breast_mlp_article = page.locator("#notebookPanel article").nth(4)
        breast_mlp_model = breast_mlp_article.locator("[data-teaching-role='concept']").inner_text().lower()
        if "internal part" not in breast_mlp_model or "early_stopping=true" not in breast_mlp_article.inner_text().lower():
            raise AssertionError(f"Ordinary MLP classification did not explain built-in early stopping: {breast_mlp_article.inner_text()}")
        breast_mlp_diagnostic = page.locator("#outputList .output-item").nth(7)
        if breast_mlp_diagnostic.locator(".chart-wrap").count() < 2:
            raise AssertionError("Breast Cancer MLP classification did not render both the confusion matrix and loss curve.")

        select_route(page, "penguins", "all_types", "mlp_cls", 9)
        run_steps(page, 8)
        assert_mlp_step8(page, "Penguins mixed-feature MLP classification", ("prepared inputs", "class probabilities", "Predicted probabilities by class", "actual_class", "predicted_class"))
        penguins_mlp_diagnostic = page.locator("#outputList .output-item").nth(7)
        if "Fitted network structure" not in penguins_mlp_diagnostic.inner_text() or penguins_mlp_diagnostic.locator("table").count() < 1:
            raise AssertionError("Penguins mixed-feature MLP classification did not render architecture and probability evidence.")

        select_route(page, "wine", "continuous", "mlp_reg", 9)
        run_steps(page, 8)
        assert_mlp_step8(page, "Wine MLP regression", ("Fitted network structure", "numeric wine quality prediction in original target units", "Training loss during optimization", "scaled target", "transformed target space", "original target units", "Selected out-of-fold row", "actual_target_original_units", "predicted_target_original_units", "absolute_error_original_units"))
        wine_mlp_article = page.locator("#notebookPanel article").nth(4)
        wine_mlp_model = wine_mlp_article.locator("[data-teaching-role='concept']").inner_text().lower()
        if "internal part" not in wine_mlp_model or "early_stopping=true" not in wine_mlp_article.inner_text().lower():
            raise AssertionError(f"Ordinary MLP regression did not explain built-in early stopping: {wine_mlp_article.inner_text()}")
        wine_mlp_diagnostic = page.locator("#outputList .output-item").nth(7)
        if wine_mlp_diagnostic.locator(".chart-wrap").count() < 2:
            raise AssertionError("Wine MLP regression did not render both the residual evidence and loss curve.")

        select_route(page, "seoul", "continuous", "mlp_reg", 9)
        run_steps(page, 8, timeout=300_000)
        assert_mlp_step8(page, "Seoul time-aware MLP regression", ("numeric bike-rental demand prediction in original target units", "transformed target space", "Selected out-of-fold row", "absolute_error_original_units", "last validation window"))
        seoul_mlp_model = page.locator("#notebookPanel article").nth(4).locator("[data-teaching-role='concept']").inner_text().lower()
        if not all(value in seoul_mlp_model for value in ("disabled", "not time-aware", "outer timeseriessplit", "normal convergence criterion")):
            raise AssertionError("Seoul MLP regression did not explain why built-in early stopping is disabled.")
        seoul_mlp_diagnostic = page.locator("#outputList .output-item").nth(7)
        if "early_stopping" not in seoul_mlp_diagnostic.inner_text() or "off" not in seoul_mlp_diagnostic.inner_text().lower():
            raise AssertionError("Seoul MLP architecture did not show built-in early stopping as off.")
        if "early stopping: on" in seoul_mlp_diagnostic.inner_text().lower():
            raise AssertionError("Seoul MLP diagnostic incorrectly claims built-in early stopping is on.")
        if "ordered" not in seoul_mlp_diagnostic.inner_text().lower() and "time" not in seoul_mlp_diagnostic.inner_text().lower():
            raise AssertionError("Seoul MLP regression did not retain time-aware diagnostic wording.")

        select_route(page, "breast", "continuous5", "classification_tree", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("if/then", "actual and predicted class", "generalize"))
        classification_tree_diagnostic = page.locator("#outputList .output-item").nth(7)
        if not all(value in classification_tree_diagnostic.inner_text() for value in ("Training-only example row", "Actual class", "Predicted class", "condition", "next_branch")) or classification_tree_diagnostic.locator("table").count() != 1:
            raise AssertionError("Classification-tree Step 8 did not show the fitted row path and class prediction.")

        select_route(page, "penguins", "all_types", "logistic", 9)
        run_steps(page, 9)
        penguins_prepare = page.locator("#notebookPanel article").nth(3).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in penguins_prepare for value in ("ColumnTransformer", "scale", "one-hot encode")):
            raise AssertionError("Mixed Penguins preprocessing did not explain the ColumnTransformer plan.")
        penguins_model = page.locator("#notebookPanel article").nth(4).locator("[data-teaching-role='concept']").inner_text()
        if "validation rows do not leak" not in penguins_model:
            raise AssertionError("Mixed Penguins Pipeline leakage explanation was missing.")

        select_route(page, "car", "categorical", "naive_bayes", 9)
        run_steps(page, 5)
        car_prepare = page.locator("#notebookPanel article").nth(3).locator("[data-teaching-role='concept']").inner_text()
        if not all(value in car_prepare for value in ("one-hot encoding", "SAFE PREDICTION")):
            raise AssertionError("Car categorical preprocessing did not explain one-hot encoding and unknown categories.")
        car_model = page.locator("#notebookPanel article").nth(4).locator("[data-teaching-role='concept']").inner_text()
        if "class labels" not in car_model:
            raise AssertionError("Classification predict teaching did not identify class labels.")

        select_route(page, "car", "categorical", "one_r", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("individual features", "exact fitted values", "majority baseline"))
        one_r_item = page.locator("#outputList .output-item").nth(7)
        if not all(value in one_r_item.inner_text() for value in ("Chosen feature", "Training-only comparison", "Majority class", "One-R")):
            raise AssertionError("Car One-R Step 8 did not show the selected feature and majority baseline comparison.")
        one_r_table = one_r_item.locator("table")
        headers = one_r_table.locator("thead th").all_inner_texts()
        if headers != ["feature", "interval", "predicted_class", "training_rows"]:
            raise AssertionError(f"Car One-R rule table has unexpected columns: {headers}")
        row_nodes = one_r_table.locator("tbody tr")
        if not row_nodes.count():
            raise AssertionError("Car One-R diagnostic did not render any rules.")
        categories = {
            "buying": {"low", "med", "high", "vhigh"},
            "maintenance": {"low", "med", "high", "vhigh"},
            "doors": {"2", "3", "4", "5more"},
            "persons": {"2", "4", "more"},
            "luggage_boot": {"small", "med", "big"},
            "safety": {"low", "med", "high"},
        }
        parsed_rows = [
            dict(zip(headers, row_nodes.nth(index).locator("td").all_inner_texts()))
            for index in range(row_nodes.count())
        ]
        selected_feature = parsed_rows[0]["feature"]
        if selected_feature not in categories:
            raise AssertionError(f"Car One-R selected an unknown feature: {selected_feature}")
        displayed_values = {row["interval"] for row in parsed_rows}
        if not displayed_values <= categories[selected_feature] or any("[" in value for value in displayed_values):
            raise AssertionError(f"Car One-R displayed a false or numeric interval for {selected_feature}: {parsed_rows}")
        if sum(int(row["training_rows"]) for row in parsed_rows) != 1382:
            raise AssertionError(f"Car One-R rule counts do not sum to the 1,382 training rows: {parsed_rows}")

        page.locator("#addCellButton").click()
        count_check_editor = page.locator("#notebookPanel textarea").last
        count_check_editor.fill(
            "selected_feature = feature_names[fitted.best_feature_]\n"
            "rule_count_check = (\n"
            "    set(one_r_rules['interval']) == set(X_train[selected_feature].astype(str).unique())\n"
            "    and int(one_r_rules['training_rows'].sum()) == len(X_train)\n"
            "    and all(\n"
            "        int(row.training_rows) == int((X_train[selected_feature].astype(str) == row.interval).sum())\n"
            "        for row in one_r_rules.itertuples()\n"
            "    )\n"
            ")\n"
            "rule_count_check"
        )
        page.locator("#notebookPanel article").last.locator("button.run").click()
        count_check_index = page.locator("#notebookPanel article").count() - 1
        wait_for_cell(page, count_check_index)
        if "True" not in page.locator("#outputList .output-item").last.inner_text():
            raise AssertionError("Car One-R rule counts did not match original category membership.")

        select_route(page, "wine", "continuous", "multiple_linear", 9)
        run_steps(page, 9)
        assert_model_teaching(page, ("additive", "other included features are kept fixed", "own unit"))
        multiple_diagnostic = page.locator("#outputList .output-item").nth(7)
        multiple_headers = multiple_diagnostic.locator("table thead th").all_inner_texts()
        if multiple_headers != ["feature", "coefficient", "meaningful_unit", "direction", "plain_english"]:
            raise AssertionError(f"Multiple-linear Step 8 has unexpected coefficient columns: {multiple_headers}")

        select_route(page, "seoul", "simple", "simple_linear", 9)
        run_steps(page, 6)
        seoul_baseline = page.locator("#outputList .output-item").nth(5)
        seoul_split_text = page.locator("#notebookPanel article").nth(1).locator("[data-teaching-role='concept']").inner_text()
        if "CHRONOLOGICAL SPLIT" not in seoul_split_text or "random_state=42" in seoul_split_text:
            raise AssertionError("Seoul split teaching did not distinguish chronological evaluation from random splitting.")
        seoul_cv_concept_text = page.locator("#notebookPanel article").nth(5).locator("[data-teaching-role='concept']").inner_text()
        if "training window grows" not in seoul_cv_concept_text or "shuffle=True" in seoul_cv_concept_text:
            raise AssertionError("Seoul TimeSeriesSplit mechanics were not explained correctly.")
        seoul_summary = seoul_baseline.locator("[data-teaching-result='cv-summary']")
        if seoul_summary.count() != 1 or seoul_summary.get_attribute("data-summary-time-series") != "true":
            raise AssertionError("Seoul did not render a time-series CV summary.")
        seoul_summary_text = seoul_summary.inner_text()
        if "ordered windows" not in seoul_summary_text or "random folds" in seoul_summary_text:
            raise AssertionError("Seoul CV teaching incorrectly described time windows as random folds.")

        select_route(page, "breast", "continuous5", "pca", 7)
        assert_unsupervised_preview_hidden(page, "diagnosis")
        run_steps(page, 7)
        assert_no_matplotlib_deprecation(page)
        assert_unsupervised_guidance(page, 0, "new axes", "reference label")
        assert_unsupervised_guidance(page, 2, "scale", "common scale")
        assert_unsupervised_guidance(page, 3, "how much variation", "variance-retention target")
        assert_unsupervised_guidance(page, 5, "which original features", "absolute loading")
        assert_unsupervised_guidance(page, 6, "where do rows", "row coordinates")
        pca_variance = page.locator("#outputList .output-item").nth(3)
        pca_variance_text = pca_variance.inner_text()
        if not all(value in pca_variance_text for value in ("explained_variance_ratio", "cumulative_explained_variance", "variance explained by each component", "Cumulative variance retained")):
            raise AssertionError("PCA variance output did not use precise, learner-readable labels.")
        pca_select = page.locator("#outputList .output-item").nth(4)
        if "components_for_target" not in pca_select.inner_text() or "90% target is a chosen rule of thumb" not in pca_select.inner_text():
            raise AssertionError("PCA did not expose the active 90% criterion as a chosen rule of thumb.")
        loadings_item = page.locator("#outputList .output-item").nth(5)
        loadings_text = loadings_item.inner_text()
        if not all(value in loadings_text for value in ("feature", "radius_mean", "strongest_component", "max_absolute_loading")):
            raise AssertionError("PCA loadings output did not preserve feature labels and contribution evidence.")
        pca_project = page.locator("#outputList .output-item").nth(6)
        if not all(value in pca_project.inner_text() for value in ("2D PCA projection", "PC1 and PC2 show", "later components", "labels were added only after")):
            raise AssertionError("PCA projection output did not distinguish the 2D view from later variance or post-fit labels.")
        pca_model_teaching = page.locator("#notebookPanel article").nth(6).locator("[data-teaching-role='model-specific']")
        if pca_model_teaching.count() != 1 or not all(value in pca_model_teaching.inner_text().lower() for value in ("linear", "prediction usefulness", "later components", "loading", "score")):
            raise AssertionError("PCA model-specific teaching was not rendered beside the projection evidence.")
        page.locator("#addCellButton").click()
        custom_editor = page.locator("#notebookPanel textarea").last
        custom_editor.fill("type(full_pca).__name__")
        page.locator("#notebookPanel article").last.locator("button.run").click()
        wait_for_cell(page, page.locator("#notebookPanel article").count() - 1)
        if "PCA" not in page.locator("#outputList .output-item").last.inner_text():
            raise AssertionError("The fitted PCA object was not available after the browser route step.")

        select_route(page, "breast", "continuous30", "pca", 7)
        assert_unsupervised_preview_hidden(page, "diagnosis")
        run_steps(page, 7)
        pca30_explore = page.locator("#outputList .output-item").nth(1)
        pca30_headers = pca30_explore.locator("table thead th").all_inner_texts()
        if pca30_explore.locator(".chart-wrap").count() or pca30_headers != ["feature_a", "feature_b", "correlation", "absolute_correlation"]:
            raise AssertionError("Breast Cancer continuous30 PCA did not render the compact redundancy summary.")
        pca30_loadings = page.locator("#outputList .output-item").nth(5).inner_text()
        if "radius_mean" not in pca30_loadings:
            raise AssertionError("Breast Cancer continuous30 PCA loading evidence did not retain source feature labels.")

        select_route(page, "penguins", "continuous", "pca", 7)
        assert_unsupervised_preview_hidden(page, "species")
        run_steps(page, 7)
        penguins_pca_project = page.locator("#outputList .output-item").nth(6).inner_text()
        if "reference" not in penguins_pca_project or "Adelie" not in penguins_pca_project:
            raise AssertionError("Penguins PCA did not add descriptive reference classes after fitting.")

        select_route(page, "wine", "continuous", "pca", 7)
        assert_unsupervised_preview_hidden(page, "quality")
        run_steps(page, 7, timeout=180_000)
        wine_pca_project = page.locator("#outputList .output-item").nth(6).inner_text()
        if "2D PCA projection" not in wine_pca_project or "PC1 and PC2 show" not in wine_pca_project:
            raise AssertionError("Wine PCA did not render its numeric post-fit projection interpretation.")

        select_route(page, "wine", "continuous", "multiple_linear", 9)
        if "quality" not in preview_headers(page):
            raise AssertionError("Supervised preview did not restore the reference target after PCA.")

        # Practice mode keeps the same route source and runtime, but asks for
        # selected predictions and a small amount of real Python before the
        # downstream evidence can be reached.
        practice_errors: list[str] = []
        practice_page = browser.new_page(viewport={"width": 390, "height": 844})
        practice_page.on("pageerror", lambda error: practice_errors.append(str(error)))
        practice_page.on(
            "console",
            lambda message: practice_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        practice_page.goto(args.base_url, wait_until="domcontentloaded")
        wait_for_ready(practice_page)
        if not practice_page.locator("#runAllButton").is_enabled():
            raise AssertionError("Guided mode did not make Run All available on the practice journey.")
        practice_page.locator("#guideButton").click()
        practice_page.locator("#guideWindow").wait_for(state="visible", timeout=10_000)
        if practice_page.locator("#guideBody .workflow-code").count() == 0:
            raise AssertionError("Guided Workflow Reference did not show the exact route code.")
        practice_page.locator("#guideClose").click()
        practice_page.locator("#practiceModeButton").click()
        practice_page.wait_for_function("document.querySelector('#practiceModeButton')?.getAttribute('aria-pressed') === 'true'")
        if not practice_page.locator("#runAllButton").is_disabled():
            raise AssertionError("Practice mode left Run All available.")
        practice_page.locator("#guideButton").click()
        practice_page.locator("#guideWindow").wait_for(state="visible", timeout=10_000)
        if practice_page.locator("#guideBody .workflow-code").count():
            raise AssertionError("Practice Workflow Reference exposed exact code before reveal.")
        reveal = practice_page.get_by_role("button", name="Reveal code").first
        reveal.click()
        if practice_page.locator("#guideBody .workflow-code").count() == 0:
            raise AssertionError("Practice Workflow Reference did not reveal code on demand.")
        revealed_practice_code = practice_page.locator("#guideBody .workflow-code").all_inner_texts()
        for token in ("fit_indices", "validation_indices", "meshgrid", "region_codes", "tree_transformed", "nb_quantity_rows", "mlp_oof_model"):
            if any(token in code for code in revealed_practice_code):
                raise AssertionError(f"Practice reference reveal exposed advanced diagnostic plumbing {token!r}.")
        practice_page.locator("#guideClose").click()

        select_route(practice_page, "breast", "continuous5", "knn_cls", 9)
        # Step 1 is a normal scaffold-free frame cell.
        practice_page.locator("#routeStrip .route-card").nth(0).click()
        wait_for_cell(practice_page, 0)
        # Commit the split prediction before attempting Step 2.
        practice_page.locator("#routeStrip .route-card").nth(1).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 2")
        split_prompt = practice_page.locator("#notebookPanel article.cell").nth(1).locator("[data-practice-role='before-run']")
        split_prompt.locator("input[type='radio']").first.check()
        split_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#routeStrip .route-card").nth(1).click()
        wait_for_cell(practice_page, 1)
        # Prepare has another prediction gate.
        practice_page.locator("#routeStrip .route-card").nth(2).click()
        wait_for_cell(practice_page, 2)
        practice_page.locator("#routeStrip .route-card").nth(3).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 4")
        prepare_prompt = practice_page.locator("#notebookPanel article.cell").nth(3).locator("[data-practice-role='before-run']")
        prepare_prompt.locator("input[type='radio']").first.check()
        prepare_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#routeStrip .route-card").nth(3).click()
        wait_for_cell(practice_page, 3)
        # The model cell is scaffolded. Fill the real Python line, then run it
        # after committing the prediction.
        model_card = practice_page.locator("#routeStrip .route-card").nth(4)
        model_card.click()
        model_index = 4
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 5")
        model_editor = practice_page.locator("#notebookPanel article.cell").nth(model_index).locator("textarea")
        model_editor.fill(
            model_editor.input_value().replace(
                "# TODO: connect preprocessor and model in a Pipeline",
                "pipeline = Pipeline([\n    (\"prepare\", preprocessor),\n    (\"model\", model)\n])",
            )
        )
        model_prompt = practice_page.locator("#notebookPanel article.cell").nth(model_index).locator("[data-practice-role='before-run']")
        model_prompt.locator("input[type='radio']").first.check()
        model_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#notebookPanel article.cell").nth(model_index).locator("button.run").click()
        wait_for_cell(practice_page, model_index)
        if practice_page.locator("#notebookPanel article.cell").nth(model_index).locator("[data-practice-role='exercise-status']").get_attribute("data-tone") != "success":
            raise AssertionError("The completed KNN Pipeline scaffold did not pass its semantic check.")

        apply = practice_page.get_by_role("button", name="Apply experiment")
        if apply.count() != 1:
            raise AssertionError("KNN Practice did not offer its one-variable experiment.")
        apply.click()
        if practice_page.locator("[data-practice-role='experiment-comparison']").count():
            raise AssertionError("KNN experiment reflection appeared before its CV evidence reran.")
        if "Rerun Check the baseline" not in practice_page.locator("#notebookPanel").inner_text():
            raise AssertionError("KNN experiment did not point the learner to the baseline evidence target.")
        practice_page.locator("#routeStrip .route-card").nth(4).click()
        wait_for_cell(practice_page, model_index)
        # Baseline is the experiment's evidence target and is itself a
        # scaffolded CV task.
        practice_page.locator("#routeStrip .route-card").nth(5).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 6")
        baseline_prompt = practice_page.locator("#notebookPanel article.cell").nth(5).locator("[data-practice-role='before-run']")
        baseline_index = 5
        baseline_editor = practice_page.locator("#notebookPanel article.cell").nth(baseline_index).locator("textarea")
        baseline_editor.fill(
            baseline_editor.input_value().replace(
                "# TODO: create the cross-validation splitter described above",
                "cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)",
            )
        )
        # Complete the scaffold before the first run so this journey checks
        # the intended Practice flow without manufacturing an avoidable code
        # error merely to unlock the editor again.
        practice_page.wait_for_function(
            "index => document.querySelectorAll('#notebookPanel article.cell')[index]?.querySelector('textarea')?.value.includes('StratifiedKFold')",
            arg=baseline_index,
        )
        baseline_prompt = practice_page.locator("#notebookPanel article.cell").nth(baseline_index).locator("[data-practice-role='before-run']")
        baseline_prompt.locator("input[type='radio']").first.check()
        baseline_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#notebookPanel article.cell").nth(baseline_index).locator("button.run").click()
        wait_for_cell(practice_page, baseline_index)
        if practice_page.locator("[data-practice-role='experiment-comparison']").count() != 1:
            raise AssertionError("KNN experiment comparison did not appear after the baseline evidence reran.")
        if "BEFORE" not in practice_page.locator("[data-practice-role='experiment-comparison']").inner_text() or "AFTER" not in practice_page.locator("[data-practice-role='experiment-comparison']").inner_text():
            raise AssertionError("KNN before/after evidence cards were incomplete.")
        practice_page.get_by_role("button", name="Mark comparison complete").click()

        # Finish the route to expose the independent checkpoint without
        # bypassing the final-test prediction gate.
        practice_page.locator("#routeStrip .route-card").nth(6).click()
        wait_for_cell(practice_page, 6)
        # On the narrow viewport, results are attached to each cell so the
        # decision panel stays next to its evidence.
        tune_prompt = practice_page.locator("#notebookPanel .cell-stack").nth(6).locator(".output-item [data-practice-role='decision']")
        tune_prompt.locator("input[type='radio']").first.check()
        tune_prompt.get_by_role("button", name="Commit decision").click()
        practice_page.locator("#routeStrip .route-card").nth(6).click()
        wait_for_cell(practice_page, 6)
        practice_page.locator("#routeStrip .route-card").nth(7).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 8")
        diagnose_prompt = practice_page.locator("#notebookPanel article.cell").nth(7).locator("[data-practice-role='before-run']")
        diagnose_prompt.locator("input[type='radio']").first.check()
        diagnose_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#routeStrip .route-card").nth(7).click()
        wait_for_cell(practice_page, 7)
        assert_primary_surface(
            practice_page,
            7,
            ("knn_fit_indices", "fit_indices", "validation_indices", "knn_row_values", "knn_preparer", "named_steps"),
        )
        assert_no_matplotlib_deprecation(practice_page)
        knn_mobile_diagnostic = article_output(practice_page, 7)
        if knn_mobile_diagnostic.count() != 1 or not all(
            token in knn_mobile_diagnostic.inner_text()
            for token in ("Selected out-of-fold row", "neighbor_class", "distance_after_preprocessing", "Prediction")
        ):
            raise AssertionError("Mobile Practice KNN did not retain its fitted neighbour evidence.")
        if knn_mobile_diagnostic.locator("table").count() != 1:
            raise AssertionError("Mobile Practice KNN did not render its neighbour table.")
        practice_page.locator("#routeStrip .route-card").nth(8).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 9")
        final_prompt = practice_page.locator("#notebookPanel article.cell").nth(8).locator("[data-practice-role='before-run']")
        final_prompt.locator("input[type='radio']").first.check()
        final_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#routeStrip .route-card").nth(8).click()
        wait_for_cell(practice_page, 8)
        if practice_page.locator("[data-practice-role='independent-checkpoint']").count() != 1:
            raise AssertionError("Practice route completion did not expose the independent checkpoint.")
        checkpoint = practice_page.locator("#notebookPanel article.cell").last
        checkpoint.get_by_role("button", name="Reveal reference solution").click()
        checkpoint_reference = checkpoint.locator(".practice-reference pre").first.inner_text()
        if "checkpoint_pipeline" not in checkpoint_reference or "X_test" in checkpoint_reference or "y_test" in checkpoint_reference:
            raise AssertionError("The independent checkpoint reference exposed the holdout or omitted its training workflow.")
        checkpoint.locator("textarea").fill(checkpoint_reference)
        checkpoint.locator("button.run").click()
        checkpoint_index = practice_page.locator("#notebookPanel article.cell").count() - 1
        wait_for_cell(practice_page, checkpoint_index)
        if checkpoint.locator("[data-checkpoint-status]").get_attribute("data-tone") != "success":
            raise AssertionError("The independent checkpoint reference did not pass its semantic validator.")

        # Exercise the target-free semantic validator through the real mobile
        # Practice UI.  A harmless name/comment must pass; an exact target
        # column selector must run but fail the semantic check.
        select_route(practice_page, "breast", "continuous5", "pca", 7)
        for index in range(3):
            practice_page.locator("#routeStrip .route-card").nth(index).click()
            wait_for_cell(practice_page, index)
        practice_page.locator("#routeStrip .route-card").nth(3).click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 4")
        variance_prompt = practice_page.locator("#notebookPanel article.cell").nth(3).locator("[data-practice-role='before-run']")
        variance_prompt.locator("input[type='radio']").first.check()
        variance_prompt.get_by_role("button", name="Commit prediction").click()
        practice_page.locator("#routeStrip .route-card").nth(3).click()
        wait_for_cell(practice_page, 3)
        # On a narrow viewport the run result (and its post-run decision
        # panel) lives in the cell-stack's inline output sibling rather than
        # inside the article itself.
        variance_decision = practice_page.locator("#notebookPanel .cell-stack").nth(3).locator(".output-item [data-practice-role='decision']")
        variance_decision.locator("input[type='radio']").first.check()
        variance_decision.get_by_role("button", name="Commit decision").click()
        select_card = practice_page.locator("#routeStrip .route-card").nth(4)
        select_card.click()
        practice_page.wait_for_function("document.querySelectorAll('#notebookPanel article.cell').length >= 5")
        select_cell = practice_page.locator("#notebookPanel article.cell").nth(4)
        select_editor = select_cell.locator("textarea")
        scaffold = select_editor.input_value()
        todo = "# TODO: find the first component count that reaches variance_target"
        if todo not in scaffold:
            raise AssertionError("PCA Practice target-free scaffold did not expose its component-selection TODO.")
        harmless = scaffold.replace(
            todo,
            "cluster_quality = 0.8\n# inspect cluster quality\n"
            "components_for_target = int(np.flatnonzero(cumulative_explained_variance >= variance_target)[0] + 1)",
        )
        select_editor.fill(harmless)
        select_cell.locator("button.run").click()
        wait_for_cell(practice_page, 4)
        if select_cell.locator("[data-practice-role='exercise-status']").get_attribute("data-tone") != "success":
            raise AssertionError("Target-free Practice rejected a harmless variable/comment containing the target substring.")
        select_editor.fill(harmless + '\ndf["diagnosis"]')
        practice_page.wait_for_function(
            "document.querySelectorAll('#notebookPanel article.cell')[4]?.dataset.status === 'stale'"
        )
        select_cell.locator("button.run").click()
        wait_for_cell(practice_page, 4)
        if select_cell.locator("[data-practice-role='exercise-status']").get_attribute("data-tone") != "error":
            raise AssertionError("Target-free Practice accepted a genuine target-column selector.")
        if "reference target" not in select_cell.inner_text().lower():
            raise AssertionError("Target-column validator feedback did not explain the target-free requirement.")
        if not practice_page.locator("#runAllButton").is_disabled():
            raise AssertionError("Practice mode re-enabled Run All after route completion.")
        practice_page.locator("#guidedModeButton").click()
        if practice_page.locator("#runAllButton").is_disabled():
            raise AssertionError("Switching back to Guided mode did not restore Run All.")
        practice_page.close()

        # Keep the same Run All and reset guarantees on the default Guided route.
        select_route(page, "breast", "continuous5", "pca", 7)
        page.locator("#runAllButton").click()
        wait_for_cell(page, 6)
        statuses = page.locator("#notebookPanel article").evaluate_all(
            "articles => articles.map(article => article.dataset.status)"
        )
        if statuses != ["done"] * 7:
            raise AssertionError(f"Run All did not finish the PCA route: {statuses}")
        if page.locator("#holdoutState").text_content().strip() != "not applicable":
            raise AssertionError("PCA Run All incorrectly opened a supervised holdout.")
        clean_reference = page.locator("#outputList [data-teaching-result='clean-workflow-reference']")
        if clean_reference.count() != 1 or not all(token in clean_reference.inner_text() for token in ("PCA", "variance_target", "checkpoint_projection", "checkpoint_loadings")):
            raise AssertionError("Guided PCA completion did not render the compact clean-workflow reference.")
        page.locator("#resetButton").click()
        wait_for_ready(page)
        if page.locator("#notebookPanel article").count() != 0:
            raise AssertionError("Reset did not clear the PCA notebook cells.")
        run_steps(page, 5)
        if "variance_target = 0.90" not in page.locator("#notebookPanel article").nth(4).locator("textarea").input_value():
            raise AssertionError("Reset did not restore the default 90% PCA criterion.")

        select_route(page, "breast", "continuous5", "logistic", 9)
        select_route(page, "breast", "continuous5", "logistic", 9)

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
    if practice_errors:
        raise AssertionError("Practice browser journey reported errors:\n" + "\n".join(practice_errors))
    print(
        "Browser/Pyodide smoke test passed: Phase 1A evidence teaching, Phase 1B shared concepts, "
        "Phase 2A/2B-1/2B-2 model-specific interpretations, Phase 3A target isolation and clustering, "
        "neural-network classification/regression, Guided/Practice mode, scaffold validation, "
        "experiment evidence comparisons, independent checkpoint, "
        "classification/regression/mixed/categorical/time-aware "
        "journeys, invalidation, indexed tables, Car One-R rules, fitted PCA route, and reset recovery."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
