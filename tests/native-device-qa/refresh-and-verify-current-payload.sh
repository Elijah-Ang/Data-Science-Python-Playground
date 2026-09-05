#!/bin/zsh
set -euo pipefail

source_root="${1:?usage: $0 SOURCE_ROOT DESTINATION_PUBLIC}"
destination_public="${2:?usage: $0 SOURCE_ROOT DESTINATION_PUBLIC}"
expected_content_id="${3:?usage: $0 SOURCE_ROOT DESTINATION_PUBLIC EXPECTED_CONTENT_ID}"
source_payload="$source_root/dist"

if [[ ! -f "$source_payload/build-info.json" ]]; then
  echo "No built source payload at $source_payload; run the approved source sync first." >&2
  exit 2
fi

expected_commit="$(git -C "$source_root" rev-parse --short=12 HEAD)"
SOURCE_PAYLOAD="$source_payload" EXPECTED_COMMIT="$expected_commit" EXPECTED_CONTENT_ID="$expected_content_id" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const payload = process.env.SOURCE_PAYLOAD;
const expectedCommit = process.env.EXPECTED_COMMIT;
const expectedContentId = process.env.EXPECTED_CONTENT_ID;
const build = JSON.parse(fs.readFileSync(path.join(payload, 'build-info.json'), 'utf8'));
if (build.commit !== expectedCommit) {
  throw new Error(`build-info commit ${build.commit} does not match source HEAD ${expectedCommit}`);
}
if (build.contentId !== expectedContentId) {
  throw new Error(`build-info contentId ${build.contentId} does not match the finalized manifest ${expectedContentId}`);
}
if (!build.contentId || !build.builtAt) {
  throw new Error('build-info.json is missing contentId or builtAt provenance');
}
const required = [
  ['index.html', 'Take a short tour'],
  ['playground.html', 'id="inspectorTitle"'],
  ['ml.html', 'id="inspectorTitle"'],
  ['playground.html', 'id="themeButton"'],
  ['ml.html', 'id="themeButton"']
];
for (const [file, marker] of required) {
  const text = fs.readFileSync(path.join(payload, file), 'utf8');
  if (!text.includes(marker)) throw new Error(`${file} is missing required marker ${marker}`);
}
const landing = fs.readFileSync(path.join(payload, 'index.html'), 'utf8');
for (const marker of ['Start exploring data', 'Machine Learning', 'System appearance', 'Light appearance', 'Dark appearance', 'nav-label', 'appearance-select']) {
  if (landing.includes(marker)) throw new Error(`index.html still contains removed landing marker ${marker}`);
}
const appearance = fs.readFileSync(path.join(payload, 'appearance.js'), 'utf8');
for (const marker of ["createElement('select')", 'appearance-select', 'nav-label']) {
  if (appearance.includes(marker)) throw new Error(`appearance.js still constructs removed UI marker ${marker}`);
}
NODE

mkdir -p "$destination_public"
rsync -a --delete "$source_payload/" "$destination_public/"
cmp "$source_payload/build-info.json" "$destination_public/build-info.json"
echo "Refreshed verified payload ${expected_content_id:0:12} from commit $expected_commit into $destination_public"
