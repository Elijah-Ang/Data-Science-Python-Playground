# Native device QA harness

This folder contains the reusable XCUITest source used to validate the packaged
Capacitor app on a real iPhone or iPad. The app under test remains
`com.elijahang.datascienceplayground`; tests do not uninstall it or clear its
data. The temporary draft test uses a unique marker and attempts to remove the
temporary custom cell afterward.

The project itself stays disposable because the generated Capacitor project has
no product UI-test target. The working project used on 5 September 2026 was
`/tmp/ds-device-qa.jDQS5f/ios/ios/App/App.xcodeproj`. It contains a
`DeviceUITests` target linked to the app target and signed by the existing
Apple Development team. Copy or regenerate that disposable project when the
native project changes, then replace its
`DeviceUITests/DeviceSmokeTests.swift` with the tracked source here.

The payload guard must run before every device test:

```sh
tests/native-device-qa/refresh-and-verify-current-payload.sh \
  "$PWD" /tmp/ds-device-qa.jDQS5f/ios/ios/App/App/public \
  "$(node -e 'process.stdout.write(require("./dist/build-info.json").contentId)')"
```

Run one test method against a connected device with the wrapper:

```sh
DEVICE_ID=00008150-001A0C260208401C \
TEST_METHOD=testFinalLandingControlsAndTourPlacement \
tests/native-device-qa/run-device-qa.sh

DEVICE_ID=00008132-001E382201D9001C \
TEST_METHOD=testMachineLearningInitialRouteRun \
tests/native-device-qa/run-device-qa.sh
```

The connected devices recorded in the dated evidence are Elijah's iPhone Air
(`00008150-001A0C260208401C`) and Lavesh's iPad Pro 13-inch (M4)
(`00008132-001E382201D9001C`). Confirm current pairing with
`xcrun devicectl list devices` before running.

Available focused tests include:

- `testFinalLandingControlsAndTourPlacement`: removed landing labels and
  duplicate captions are absent; the retained tour is small and top-right.
- `testPlaygroundNavigationAndReturnHome`: Data workspace, inspector, compact
  route, and Home return.
- `testMachineLearningNavigation`: ML workspace, inspector, theme control,
  and compact first route.
- `testPortraitAndLandscapeSurfaces`: real-device portrait and landscape
  foreground/screenshot checks.
- `testDataStartsEmptyAfterRelaunch`: custom `print(2 + 2`,
  result `4`, then background/relaunch and an empty notebook after Python becomes ready. This replaces the former Data draft-restoration contract.
- `testCleanupDeviceQATemporaryCells`: removes only the exact temporary
  markers created by the device harness, then relaunch-verifies that no marked
  cell remains.
- `testMachineLearningInitialRouteRun`: first ML route step executes.
- `testThemeSwitchUsesNativeAccessibilityControl`: theme action label changes
  and persists across Data to ML navigation.
- `testChartShareSheetCanBeCancelled`: per-figure chart sharing presents the
  native share UI and dismisses it; iOS 26 exposes it as
  `ShareSheet.RemoteContainerView` with a `Close` header action.
- `testAXWorkspaceDump` and `testAXAboutBuildDump`: accessibility/build
  identity evidence.
