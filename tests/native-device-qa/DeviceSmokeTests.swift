import XCTest

final class DeviceSmokeTests: XCTestCase {
    private let bundleIdentifier = "com.elijahang.datascienceplayground"
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication(bundleIdentifier: bundleIdentifier)
        app.launchArguments += ["-device-qa"]
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "Data Playground did not reach the foreground")
    }

    override func tearDownWithError() throws {
        if app?.state != .notRunning {
            app.terminate()
        }
    }

    private func attachScreen(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func waitForText(_ text: String, timeout: TimeInterval = 30) -> XCUIElement {
        let element = app.descendants(matching: .any)
            .containing(NSPredicate(format: "label CONTAINS[c] %@", text))
            .firstMatch
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "Expected text was not exposed: \(text)")
        return element
    }

    private func assertNoExactLabel(_ label: String, file: StaticString = #filePath, line: UInt = #line) {
        let matches = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label == %@", label))
        XCTAssertEqual(matches.count, 0, "Unexpected exposed label: \(label)", file: file, line: line)
    }

    private func assertNoDeprecatedControls(file: StaticString = #filePath, line: UInt = #line) {
        // These are control labels, so match the accessible control tree rather
        // than explanatory privacy copy that may mention local draft policy.
        let markers = [
            "Save notebook",
            "Open saved notebook",
            "Export last executed report",
            "Delete saved drafts",
            "Conclusion"
        ]
        for marker in markers {
            let predicate = NSPredicate(format: "label CONTAINS[c] %@", marker)
            let count = app.buttons.matching(predicate).count
                + app.links.matching(predicate).count
                + app.textFields.matching(predicate).count
                + app.otherElements.matching(predicate).count
            XCTAssertEqual(count, 0, "Deprecated control is still exposed: \(marker)", file: file, line: line)
        }
    }

    private func assertNoAppearancePicker(file: StaticString = #filePath, line: UInt = #line) {
        for label in ["Appearance", "System appearance", "Light appearance", "Dark appearance"] {
            assertNoExactLabel(label, file: file, line: line)
        }
    }

    private func assertNoDuplicateModeCaptions(file: StaticString = #filePath, line: UInt = #line) {
        // The image based mode buttons keep their accessible names, but the
        // visible captions injected below the artwork must not be present.
        for caption in ["Home", "Data Playground", "Machine Learning"] {
            let visible = app.staticTexts.matching(NSPredicate(format: "label == %@", caption))
                .allElementsBoundByIndex
                .filter { $0.isHittable }
            XCTAssertEqual(visible.count, 0, "Duplicate visible mode caption remains: \(caption)", file: file, line: line)
        }
    }

    private func assertThemeButtonAndWorkspaceInspector(file: StaticString = #filePath, line: UInt = #line) {
        let themeButton = app.buttons.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme"))
            .firstMatch
        let themeSwitch = app.switches.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme"))
            .firstMatch
        let theme: XCUIElement
        if themeButton.waitForExistence(timeout: 2) {
            theme = themeButton
        } else if themeSwitch.waitForExistence(timeout: 10) {
            // WKWebView exposes an aria-labelled button as a Switch on iOS.
            theme = themeSwitch
        } else {
            let buttons = app.buttons.allElementsBoundByIndex.map { "button=\($0.label.debugDescription) id=\($0.identifier.debugDescription) hittable=\($0.isHittable)" }
            let switches = app.switches.allElementsBoundByIndex.map { "switch=\($0.label.debugDescription) id=\($0.identifier.debugDescription) hittable=\($0.isHittable)" }
            let links = app.links.allElementsBoundByIndex.map { "link=\($0.label.debugDescription) id=\($0.identifier.debugDescription) hittable=\($0.isHittable)" }
            print("DEVICE_QA_AX_BUTTONS " + buttons.joined(separator: " | "))
            print("DEVICE_QA_AX_SWITCHES " + switches.joined(separator: " | "))
            print("DEVICE_QA_AX_LINKS " + links.joined(separator: " | "))
            XCTFail("The compact moon/sun theme control was not exposed", file: file, line: line)
            return
        }
        XCTAssertTrue(theme.exists, "The compact moon/sun theme control was not exposed", file: file, line: line)

        let inspector = app.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] %@", "Inspector")).firstMatch
        XCTAssertTrue(inspector.waitForExistence(timeout: 15), "Dataset inspector heading was not exposed", file: file, line: line)
        XCTAssertTrue(inspector.isHittable, "Dataset inspector is not visible in the workspace", file: file, line: line)
        let preview = app.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] %@", "First look")).firstMatch
        XCTAssertTrue(preview.waitForExistence(timeout: 15), "Always visible inspector preview was not exposed", file: file, line: line)
        // On compact screens the preview remains rendered by default below
        // the inspector summary. Scroll the workspace to verify that it is
        // present and reachable without requiring a disclosure toggle.
        if !preview.isHittable {
            let webView = app.webViews.firstMatch
            for _ in 0..<12 where !preview.isHittable {
                if webView.exists {
                    webView.swipeUp()
                } else {
                    app.swipeUp()
                }
                Thread.sleep(forTimeInterval: 0.25)
            }
        }
        XCTAssertTrue(preview.isHittable, "Dataset inspector preview is not visible in the workspace", file: file, line: line)
        assertNoAppearancePicker(file: file, line: line)
        assertNoDeprecatedControls(file: file, line: line)
    }

    private func assertCompactDataRoute(file: StaticString = #filePath, line: UInt = #line) {
        let route = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Preview rows")).firstMatch
        XCTAssertTrue(route.waitForExistence(timeout: 15), "The first compact data route button was not exposed", file: file, line: line)
        XCTAssertLessThanOrEqual(route.frame.height, 82, "The data route button has regressed to an oversized layout", file: file, line: line)
        XCTAssertGreaterThanOrEqual(route.frame.width, 120, "The data route button is too narrow to be usable", file: file, line: line)
    }

    private func assertCompactMachineLearningRoute(file: StaticString = #filePath, line: UInt = #line) {
        let route = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Choose what to predict")).firstMatch
        XCTAssertTrue(route.waitForExistence(timeout: 15), "The first compact ML route button was not exposed", file: file, line: line)
        XCTAssertLessThanOrEqual(route.frame.height, 82, "The ML route button has regressed to an oversized layout", file: file, line: line)
        // The compact mobile layout is 142pt wide at the iPhone viewport;
        // keep the same practical lower bound as the Data route assertion.
        XCTAssertGreaterThanOrEqual(route.frame.width, 120, "The ML route button is too narrow to be usable", file: file, line: line)
    }

    private func openDataPlayground() {
        let notebook = app.otherElements
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python notebook"))
            .firstMatch
        if notebook.waitForExistence(timeout: 4) {
            return
        }
        func scrollLandingPage() {
            let scrollView = app.scrollViews.firstMatch
            let webView = app.webViews.firstMatch
            let container = webView.exists ? webView : scrollView
            if container.exists {
                let start = container.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.82))
                let end = container.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.20))
                start.press(forDuration: 0.1, thenDragTo: end)
            } else {
                app.swipeUp()
            }
            Thread.sleep(forTimeInterval: 0.35)
        }
        func tapIfVisible(_ element: XCUIElement) -> Bool {
            if element.isHittable {
                element.tap()
                return true
            }
            let screen = app.windows.firstMatch.frame
            let frame = element.frame
            guard frame.midX >= screen.minX, frame.midX <= screen.maxX,
                  frame.midY >= screen.minY, frame.midY <= screen.maxY,
                  screen.width > 0, screen.height > 0 else { return false }
            let offset = CGVector(dx: (frame.midX - screen.minX) / screen.width,
                                  dy: (frame.midY - screen.minY) / screen.height)
            app.coordinate(withNormalizedOffset: offset).tap()
            return true
        }
        let playground = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Enter Data Playground"))
            .firstMatch
        if playground.waitForExistence(timeout: 10) {
            var tapped = false
            for _ in 0..<12 {
                if tapIfVisible(playground) {
                    tapped = true
                    break
                }
                scrollLandingPage()
            }
            XCTAssertTrue(tapped, "The Enter Data Playground gate never became tappable after bounded page scrolling")
        } else {
            let dataNav = app.links
                .containing(NSPredicate(format: "label CONTAINS[c] %@", "Data Playground"))
                .firstMatch
            XCTAssertTrue(dataNav.waitForExistence(timeout: 10), "Could not find Data Playground navigation")
            dataNav.tap()
        }
        XCTAssertTrue(notebook.waitForExistence(timeout: 30), "Data Playground notebook did not load")
    }

    private func openMachineLearning() {
        let machineLearning = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Machine Learning"))
            .firstMatch
        if !machineLearning.waitForExistence(timeout: 3) {
            // The corrected landing screen has no duplicate ML CTA. Enter via
            // the Data Playground artwork, then use the image based mode rail.
            openDataPlayground()
        }
        let route = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Machine Learning"))
            .firstMatch
        XCTAssertTrue(route.waitForExistence(timeout: 15), "Could not find the Machine Learning mode route")
        route.tap()

        let notebook = app.otherElements
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python notebook"))
            .firstMatch
        XCTAssertTrue(notebook.waitForExistence(timeout: 30), "Machine Learning Playground did not load its notebook surface")
    }

    private func firstCodeEditor() -> XCUIElement {
        let editors = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python code"))
        XCTAssertGreaterThan(editors.count, 0, "No editable Python code editor was exposed")
        return editors.element(boundBy: editors.count - 1)
    }

    private func appendToEditor(_ editor: XCUIElement, code: String) {
        for _ in 0..<12 where !editor.isHittable {
            app.swipeUp()
        }
        XCTAssertTrue(editor.isHittable, "The target editor is not visible for physical input")
        editor.tap()
        editor.typeText("\n\(code)")
        Thread.sleep(forTimeInterval: 1)
        let value = String(describing: editor.value ?? "")
        XCTAssertTrue(value.localizedCaseInsensitiveContains(code), "Editor did not accept the temporary device-QA code")
    }

    private func addTemporaryCell() {
        let addCell = app.buttons
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Add cell"))
            .firstMatch
        XCTAssertTrue(addCell.waitForExistence(timeout: 15), "Playground did not expose Add cell")
        for _ in 0..<12 where !addCell.isHittable {
            app.swipeUp()
        }
        XCTAssertTrue(addCell.isHittable, "Add cell was not visible after scrolling")
        addCell.tap()
    }

    private func runLastDataCellAndWait() {
        let runs = app.buttons.matching(NSPredicate(format: "label == %@", "Run"))
        XCTAssertGreaterThan(runs.count, 0, "No Data Playground Run button was exposed")
        runs.element(boundBy: runs.count - 1).tap()
        waitForText("ran successfully", timeout: 60)
    }

    private func isDeviceQATemporaryCode(_ value: String) -> Bool {
        // These exact strings were introduced by this harness. A user's
        // ordinary notebook code must never be selected for cleanup.
        value.contains("device_qa_20260906")
            || value.contains("device QA chart")
            || value.contains("\\(marker)")
    }

    private func tapDeleteButton(for editor: XCUIElement) -> Bool {
        let editorFrame = editor.frame
        let deletes = app.buttons
            .matching(NSPredicate(format: "label == %@", "Delete Custom question"))
            .allElementsBoundByIndex
        guard let target = deletes.min(by: {
            abs($0.frame.midY - (editorFrame.minY - 45)) < abs($1.frame.midY - (editorFrame.minY - 45))
        }) else { return false }

        print("DEVICE_QA_CLEANUP_TARGET markerEditor=\(editorFrame) deleteButton=\(target.frame)")
        let screen = app.windows.firstMatch.frame
        for _ in 0..<24 {
            if target.isHittable {
                target.tap()
                Thread.sleep(forTimeInterval: 0.6)
                return true
            }
            let frame = target.frame
            if frame.minY > screen.maxY {
                app.webViews.firstMatch.swipeUp()
            } else if frame.maxY < screen.minY {
                app.webViews.firstMatch.swipeDown()
            } else {
                let offset = CGVector(dx: frame.midX / max(screen.width, 1), dy: frame.midY / max(screen.height, 1))
                app.coordinate(withNormalizedOffset: offset).tap()
                Thread.sleep(forTimeInterval: 0.6)
                return true
            }
            Thread.sleep(forTimeInterval: 0.35)
        }
        return false
    }

    func testLandingScreenAndTourRoute() throws {
        let heading = app.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Data Science Python Playground"))
            .firstMatch
        XCTAssertTrue(heading.waitForExistence(timeout: 30), "Landing heading was not exposed by the WebView")
        attachScreen("landing")

        for forbidden in ["Start exploring data", "Machine Learning", "System appearance", "Light appearance", "Dark appearance"] {
            assertNoExactLabel(forbidden)
        }
        for duplicate in ["Home", "Data Playground", "Machine Learning"] {
            let links = app.links.matching(NSPredicate(format: "label == %@", duplicate))
            XCTAssertEqual(links.count, 0, "Landing page still exposes the removed duplicate navigation caption: \(duplicate)")
        }

        let tour = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Take a short tour"))
            .firstMatch
        XCTAssertTrue(tour.waitForExistence(timeout: 10), "Landing page does not expose the Take a short tour link")
        XCTAssertLessThanOrEqual(tour.frame.height, 72, "The retained tour control is not a small button")
        XCTAssertLessThan(tour.frame.width, app.windows.firstMatch.frame.width * 0.55, "The retained tour control is too wide")
        XCTAssertGreaterThan(tour.frame.midX, app.windows.firstMatch.frame.midX, "The retained tour control is not in the top-right corner")
        XCTAssertLessThan(tour.frame.minY, app.windows.firstMatch.frame.height * 0.30, "The retained tour control is not near the top of the page")
        tour.tap()

        // The tour's five-minute description is intentionally screen-reader
        // only. Confirm the visible first chapter after navigation instead of
        // waiting for hidden descriptive copy.
        let tutorialHeadline = app.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Start with a question"))
            .firstMatch
        let tutorialFeature = app.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "FEATURE 01 / 07"))
            .firstMatch
        let tutorialReady = tutorialHeadline.waitForExistence(timeout: 10)
            || tutorialFeature.waitForExistence(timeout: 10)
        XCTAssertTrue(tutorialReady, "Tour link did not navigate to the tutorial")
        attachScreen("tutorial")
    }

    func testPlaygroundNavigationAndReturnHome() throws {
        let playground = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Enter Data Playground"))
            .firstMatch
        XCTAssertTrue(playground.waitForExistence(timeout: 15), "Landing page does not expose the Data Playground gate")
        playground.tap()

        let notebook = app.otherElements
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python notebook"))
            .firstMatch
        XCTAssertTrue(notebook.waitForExistence(timeout: 30), "Data Playground did not load its notebook surface")
        assertThemeButtonAndWorkspaceInspector()
        assertCompactDataRoute()
        attachScreen("data-playground")

        let home = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Home"))
            .firstMatch
        XCTAssertTrue(home.waitForExistence(timeout: 10), "Data Playground does not expose a Home navigation control")
        home.tap()
        let heading = app.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Data Science Python Playground"))
            .firstMatch
        XCTAssertTrue(heading.waitForExistence(timeout: 20), "Home navigation did not return to the landing screen")
        attachScreen("landing-after-return")
    }

    func testMachineLearningNavigation() throws {
        openMachineLearning()
        assertThemeButtonAndWorkspaceInspector()
        assertCompactMachineLearningRoute()
        attachScreen("machine-learning")
    }

    func testFinalLandingControlsAndTourPlacement() throws {
        let heading = waitForText("Data Science Python Playground")
        XCTAssertTrue(heading.exists)

        for forbidden in ["Start exploring data", "Machine Learning", "System appearance", "Light appearance", "Dark appearance"] {
            assertNoExactLabel(forbidden)
        }
        assertNoDuplicateModeCaptions()

        let tour = app.links
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Take a short tour"))
            .firstMatch
        XCTAssertTrue(tour.waitForExistence(timeout: 10), "Landing page does not expose the retained tour control")
        let screen = app.windows.firstMatch.frame
        XCTAssertGreaterThan(tour.frame.midX, screen.midX, "Tour control is not in the top-right half of the landing screen")
        XCTAssertLessThan(tour.frame.minY, screen.height * 0.30, "Tour control is not near the top of the landing screen")
        XCTAssertLessThanOrEqual(tour.frame.height, 72, "The retained tour control is not a small button")
        attachScreen("final-landing-controls")
    }

    func testPortraitAndLandscapeSurfaces() throws {
        let device = XCUIDevice.shared
        defer {
            device.orientation = .portrait
        }

        device.orientation = .portrait
        Thread.sleep(forTimeInterval: 1)
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        attachScreen("portrait")

        device.orientation = .landscapeLeft
        Thread.sleep(forTimeInterval: 2)
        XCTAssertEqual(device.orientation, .landscapeLeft, "The physical device did not accept landscape orientation")
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5), "App left the foreground after rotation")
        let frame = app.windows.firstMatch.frame
        XCTAssertGreaterThan(frame.width, 0)
        XCTAssertGreaterThan(frame.height, 0)
        attachScreen("landscape-left")
    }

    func testDataStartsEmptyAfterRelaunch() throws {
        openDataPlayground()
        waitForText("Python ready", timeout: 60)
        assertThemeButtonAndWorkspaceInspector()
        assertCompactDataRoute()

        XCTAssertEqual(app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python code")).count, 0, "Data must initially open empty after Python is ready")
        addTemporaryCell()

        let editor = firstCodeEditor()
        let marker = "device_qa_20260906"
        attachScreen("data-editor-before")
        appendToEditor(editor, code: "# \(marker)\nprint(2 + 2)")
        XCTAssertTrue(String(describing: editor.value ?? "").contains(marker), "The temporary device-QA marker was not present in the edited cell before execution")
        attachScreen("data-editor-after")
        runLastDataCellAndWait()

        let four = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label == %@", "4"))
            .firstMatch
        XCTAssertTrue(four.waitForExistence(timeout: 20), "The custom Python cell did not expose the expected value 4")
        attachScreen("data-custom-cell")

        Thread.sleep(forTimeInterval: 1)
        XCUIDevice.shared.press(.home)
        Thread.sleep(forTimeInterval: 1)
        // Reopening Data starts a fresh notebook, including after termination.
        app.terminate()
        app.launchArguments += ["-device-qa"]
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30))
        openDataPlayground()
        waitForText("Python ready", timeout: 60)
        let restoredEditors = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python code"))
            .allElementsBoundByIndex
        XCTAssertEqual(restoredEditors.count, 0, "Data must reopen empty after Python is ready")
        attachScreen("data-empty-after-relaunch")

    }

    func testCleanupDeviceQATemporaryCells() throws {
        openDataPlayground()
        waitForText("Python ready", timeout: 60)

        var removed = 0
        for _ in 0..<12 {
            let editors = app.descendants(matching: .any)
                .matching(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python code"))
                .allElementsBoundByIndex
            guard let editor = editors.first(where: {
                isDeviceQATemporaryCode(String(describing: $0.value ?? ""))
            }) else { break }
            XCTAssertTrue(tapDeleteButton(for: editor), "Could not reach the Delete button paired with a marked device-QA cell")
            removed += 1
            Thread.sleep(forTimeInterval: 0.5)
        }
        print("DEVICE_QA_CLEANUP_REMOVED \(removed)")

        // deleteCell persists through the normal pagehide path. Relaunch once
        // to verify the exact marker search after persistence, while keeping
        // all unrelated notebook cells untouched.
        XCUIDevice.shared.press(.home)
        Thread.sleep(forTimeInterval: 1)
        app.terminate()
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30))
        openDataPlayground()
        waitForText("Python ready", timeout: 60)
        let remaining = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Editable Python code"))
            .allElementsBoundByIndex
            .filter { isDeviceQATemporaryCode(String(describing: $0.value ?? "")) }
        XCTAssertEqual(remaining.count, 0, "A marked device-QA temporary cell remained after scoped cleanup")
        attachScreen("data-qa-cleanup-verified")
    }

    func testMachineLearningInitialRouteRun() throws {
        openMachineLearning()
        waitForText("Suggested route", timeout: 30)
        waitForText("Pyodide 0.26.4 ready", timeout: 60)
        assertThemeButtonAndWorkspaceInspector()
        assertCompactMachineLearningRoute()
        let firstRoute = app.buttons
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Choose what to predict"))
            .firstMatch
        XCTAssertTrue(firstRoute.waitForExistence(timeout: 30), "Machine Learning did not expose the first route step")
        XCTAssertTrue(firstRoute.isEnabled, "The first ML route step is unexpectedly disabled")
        for _ in 0..<12 where !firstRoute.isHittable {
            let webView = app.webViews.firstMatch
            if webView.exists {
                let start = webView.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.82))
                let end = webView.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.20))
                start.press(forDuration: 0.1, thenDragTo: end)
            } else {
                app.swipeUp()
            }
            Thread.sleep(forTimeInterval: 0.35)
        }
        XCTAssertTrue(firstRoute.isHittable, "The enabled first ML route step remained offscreen after bounded scrolling")
        firstRoute.tap()
        let firstRouteReady = app.staticTexts
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Choose what to predict · ready"))
            .firstMatch
        let nextSplitRoute = app.buttons
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Split data and save the test set"))
            .firstMatch
        let deadline = Date().addingTimeInterval(90)
        while !firstRouteReady.exists && !(nextSplitRoute.exists && nextSplitRoute.isEnabled) && Date() < deadline {
            Thread.sleep(forTimeInterval: 0.5)
        }
        XCTAssertTrue(firstRouteReady.exists || (nextSplitRoute.exists && nextSplitRoute.isEnabled), "The first ML route step did not expose its ready output or enable the next split step")
        attachScreen("machine-learning-first-route")
    }

    func testChartShareSheetCanBeCancelled() throws {
        openDataPlayground()
        waitForText("Python ready", timeout: 60)
        addTemporaryCell()
        let editor = firstCodeEditor()
        appendToEditor(editor, code: "import matplotlib.pyplot as plt\nplt.plot([1, 2], [1, 4])\nplt.title('device QA chart')")
        runLastDataCellAndWait()

        // The per-figure share affordance is the exact download link in the
        // newly rendered chart output. The fixed toolbar button has a generic
        // chart label and may remain above the current viewport, so matching it
        // here can produce a false visibility failure.
        let chart = app.links
            .matching(NSPredicate(format: "label == %@", "Download this figure (last executed code)"))
            .firstMatch
        XCTAssertTrue(chart.waitForExistence(timeout: 30), "Per-figure sharing link was not exposed after a chart run")
        for _ in 0..<16 where !chart.isHittable {
            let screen = app.windows.firstMatch.frame
            let frame = chart.frame
            if frame.minY > screen.maxY {
                app.webViews.firstMatch.swipeUp()
            } else if frame.maxY < screen.minY {
                app.webViews.firstMatch.swipeDown()
            } else {
                app.swipeUp()
            }
            Thread.sleep(forTimeInterval: 0.35)
        }
        XCTAssertTrue(chart.isHittable, "Chart sharing control was not visible after scrolling")
        XCTAssertTrue(chart.isEnabled, "Chart sharing control remained disabled after a chart run")
        chart.tap()

        let shareSheet = app.sheets.firstMatch
        // iOS 26 exposes UIActivityViewController through an `Other` remote
        // container rather than XCUIElementTypeSheet. Keep both forms so the
        // assertion tests the native presentation, not an AX type detail.
        let shareContainer = app.otherElements
            .matching(NSPredicate(format: "identifier == %@", "ShareSheet.RemoteContainerView"))
            .firstMatch
        if shareSheet.waitForExistence(timeout: 20) || shareContainer.waitForExistence(timeout: 20) {
            attachScreen("chart-share-sheet")
            let cancel = app.buttons
                .matching(NSPredicate(format: "label == %@ OR label == %@", "Cancel", "Close"))
                .firstMatch
            if cancel.waitForExistence(timeout: 5) {
                cancel.tap()
            } else {
                app.swipeDown()
            }
            XCTAssertFalse(shareSheet.exists || shareContainer.exists, "Chart share sheet did not dismiss after cancellation")
        } else {
            attachScreen("chart-share-no-sheet")
            print("DEVICE_QA_POST_SHARE_AX_BEGIN")
            print(app.debugDescription)
            print("DEVICE_QA_POST_SHARE_AX_END")
            XCTFail("Chart sharing did not present a native share sheet")
        }

        let deletes = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Delete Custom question"))
        if deletes.count > 0 {
            deletes.element(boundBy: deletes.count - 1).tap()
        }
    }

    func testAXWorkspaceDump() throws {
        openDataPlayground()
        Thread.sleep(forTimeInterval: 2)
        print("DEVICE_QA_AX_WORKSPACE_BEGIN")
        print(app.debugDescription)
        print("DEVICE_QA_AX_BUTTONS " + app.buttons.allElementsBoundByIndex.map { "label=\($0.label.debugDescription) id=\($0.identifier.debugDescription) frame=\($0.frame) hittable=\($0.isHittable)" }.joined(separator: " | "))
        print("DEVICE_QA_AX_OTHER " + app.otherElements.allElementsBoundByIndex.map { "label=\($0.label.debugDescription) id=\($0.identifier.debugDescription) frame=\($0.frame) hittable=\($0.isHittable)" }.joined(separator: " | "))
        print("DEVICE_QA_AX_WORKSPACE_END")
        attachScreen("ax-workspace")
    }

    func testAXAboutBuildDump() throws {
        let tour = app.links.containing(NSPredicate(format: "label CONTAINS[c] %@", "Take a short tour")).firstMatch
        XCTAssertTrue(tour.waitForExistence(timeout: 15), "Tour link not exposed")
        tour.tap()
        let about = app.links.containing(NSPredicate(format: "label CONTAINS[c] %@", "About")).firstMatch
        XCTAssertTrue(about.waitForExistence(timeout: 15), "About link not exposed")
        about.tap()
        let marker = app.staticTexts.containing(NSPredicate(format: "label MATCHES %@", "Build [0-9a-f]{12}.*")).firstMatch
        print("DEVICE_QA_ABOUT_LABELS " + app.staticTexts.allElementsBoundByIndex.map { $0.label.debugDescription }.joined(separator: " | "))
        XCTAssertTrue(marker.waitForExistence(timeout: 15), "Native build identity was not visible in About")
        let expectedPrefix = ProcessInfo.processInfo.environment["DEVICE_QA_EXPECTED_BUILD_PREFIX"]
        if let expectedPrefix, !expectedPrefix.isEmpty {
            XCTAssertTrue(marker.label.contains("Build \(expectedPrefix)"), "About build identity \(marker.label) did not match expected payload \(expectedPrefix)")
        }
        attachScreen("about-build")
    }

    func testThemeSwitchUsesNativeAccessibilityControl() throws {
        openDataPlayground()
        let theme = app.switches.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme")).firstMatch
        XCTAssertTrue(theme.waitForExistence(timeout: 15), "The WebView theme button was not exposed as an iOS accessibility switch")
        // The AX node appears before the page's inline listener is attached on
        // a cold native WebView load.
        Thread.sleep(forTimeInterval: 2)
        let before = theme.label
        theme.tap()
        let after = app.switches.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme")).firstMatch
        XCTAssertTrue(after.waitForExistence(timeout: 10), "Theme switch disappeared after activation")
        let deadline = Date().addingTimeInterval(10)
        while after.label == before && Date() < deadline {
            Thread.sleep(forTimeInterval: 0.25)
        }
        XCTAssertNotEqual(after.label, before, "Theme switch did not update its accessible label")
        let expected = before.localizedCaseInsensitiveContains("dark") ? "Switch to light theme" : "Switch to dark theme"
        XCTAssertEqual(after.label, expected, "Theme switch exposes the wrong next-theme label")

        openMachineLearning()
        let mlSwitch = app.switches.matching(NSPredicate(format: "label == %@", expected)).firstMatch
        let mlButton = app.buttons.matching(NSPredicate(format: "label == %@", expected)).firstMatch
        let mlTheme: XCUIElement
        if mlSwitch.waitForExistence(timeout: 3) {
            mlTheme = mlSwitch
        } else if mlButton.waitForExistence(timeout: 10) {
            mlTheme = mlButton
        } else {
            print("DEVICE_QA_ML_THEME_SWITCHES " + app.switches.allElementsBoundByIndex.map { $0.label.debugDescription }.joined(separator: " | "))
            print("DEVICE_QA_ML_THEME_BUTTONS " + app.buttons.allElementsBoundByIndex.map { $0.label.debugDescription }.joined(separator: " | "))
            XCTFail("Theme preference did not persist when navigating to Machine Learning", file: #filePath, line: #line)
            return
        }
        XCTAssertTrue(mlTheme.exists, "Theme preference did not persist when navigating to Machine Learning")
        attachScreen("theme-persisted-machine-learning")
    }

    func testThemeSwitchAXToggleDump() throws {
        openDataPlayground()
        let theme = app.switches.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme")).firstMatch
        XCTAssertTrue(theme.waitForExistence(timeout: 15))
        print("DEVICE_QA_THEME_BEFORE label=\(theme.label.debugDescription) value=\(String(describing: theme.value)) hittable=\(theme.isHittable)")
        theme.tap()
        Thread.sleep(forTimeInterval: 2)
        print("DEVICE_QA_THEME_AFTER_SWITCHES " + app.switches.allElementsBoundByIndex.map { "label=\($0.label.debugDescription) value=\(String(describing: $0.value)) hittable=\($0.isHittable)" }.joined(separator: " | "))
        print("DEVICE_QA_THEME_AFTER_BUTTONS " + app.buttons.allElementsBoundByIndex.map { "label=\($0.label.debugDescription) value=\(String(describing: $0.value)) hittable=\($0.isHittable)" }.joined(separator: " | "))
        attachScreen("theme-after-toggle")
    }

    func testNativeSafeAreaTracksLightAndDark() throws {
        openDataPlayground()
        waitForText("Python ready", timeout: 60)
        let theme = app.switches.matching(NSPredicate(format: "label MATCHES[c] %@", "Switch to (dark|light) theme")).firstMatch
        XCTAssertTrue(theme.waitForExistence(timeout: 15), "The WebView theme button was not exposed as an iOS accessibility switch")

        // Normalize the simulator to light mode first so the two screenshots
        // are comparable even when an earlier test left a dark preference.
        if !theme.label.localizedCaseInsensitiveContains("dark") {
            theme.tap()
            let light = app.switches.matching(NSPredicate(format: "label == %@", "Switch to dark theme")).firstMatch
            XCTAssertTrue(light.waitForExistence(timeout: 10), "Theme control did not return to light mode")
        }
        Thread.sleep(forTimeInterval: 1)
        attachScreen("safe-area-light")

        let lightTheme = app.switches.matching(NSPredicate(format: "label == %@", "Switch to dark theme")).firstMatch
        XCTAssertTrue(lightTheme.waitForExistence(timeout: 5), "Light-mode theme control was not available")
        lightTheme.tap()
        let dark = app.switches.matching(NSPredicate(format: "label == %@", "Switch to light theme")).firstMatch
        let deadline = Date().addingTimeInterval(30)
        while !dark.exists && Date() < deadline {
            Thread.sleep(forTimeInterval: 0.5)
        }
        XCTAssertTrue(dark.exists, "Theme control did not switch to dark mode")
        Thread.sleep(forTimeInterval: 1)
        attachScreen("safe-area-dark")
    }
}
