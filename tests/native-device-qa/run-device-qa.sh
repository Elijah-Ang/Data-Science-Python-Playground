#!/bin/zsh
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
qa_root="${QA_ROOT:-/tmp/ds-device-qa.jDQS5f}"
project="${QA_PROJECT:-$qa_root/ios/ios/App/App.xcodeproj}"
scheme="${QA_SCHEME:-DeviceUITests}"
derived_data="${QA_DERIVED_DATA:-$qa_root/DerivedData-Final-iPhone}"
source_root="${SOURCE_ROOT:-$repo_root}"
device_id="${DEVICE_ID:-}"
test_method="${TEST_METHOD:-testFinalLandingControlsAndTourPlacement}"
content_id="${CONTENT_ID:-}"

if [[ -z "$device_id" ]]; then
  echo "Set DEVICE_ID to one physical CoreDevice UDID." >&2
  exit 2
fi
if [[ ! -d "$project" ]]; then
  echo "QA project is missing: $project" >&2
  echo "Use the disposable XCUITest project described in tests/native-device-qa/README.md." >&2
  exit 2
fi
if [[ -z "$content_id" ]]; then
  content_id="$(SOURCE_ROOT="$source_root" node -e 'const fs=require("node:fs"); const p=process.env.SOURCE_ROOT+"/dist/build-info.json"; const b=JSON.parse(fs.readFileSync(p,"utf8")); process.stdout.write(b.contentId);')"
fi

"$repo_root/tests/native-device-qa/refresh-and-verify-current-payload.sh" "$source_root" "$qa_root/ios/ios/App/App/public" "$content_id"
cp "$repo_root/tests/native-device-qa/DeviceSmokeTests.swift" "$qa_root/ios/ios/App/DeviceUITests/DeviceSmokeTests.swift"

DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
export DEVELOPER_DIR
xcodebuild -quiet build-for-testing \
  -project "$project" \
  -scheme "$scheme" \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$derived_data"

xctestrun="$(find "$derived_data/Build/Products" -maxdepth 1 -name 'DeviceUITests_*.xctestrun' -print -quit)"
if [[ -z "$xctestrun" ]]; then
  echo "No DeviceUITests .xctestrun was produced under $derived_data/Build/Products." >&2
  exit 3
fi

stamp="$(date +%Y%m%d-%H%M%S)"
result_bundle="$qa_root/Test-$test_method-$stamp.xcresult"
xcodebuild test-without-building \
  -xctestrun "$xctestrun" \
  -destination "id=$device_id" \
  -resultBundlePath "$result_bundle" \
  -only-testing:"DeviceUITests/DeviceSmokeTests/$test_method"
