# Homepage asset notes

Created with the built-in image-generation tool for the homepage update. Original source images and animation assets remain unchanged. Treehouse edits are clipped to the local repair region by CSS.

Final assets:
- `assets/landing/treehouse-clean-desktop.png`
- `assets/landing/treehouse-clean-mobile.png`
- `assets/landing/welcome-blimp.png`

## Prompts

Desktop (reference: data-playground-desktop-source.webp):
> Precise object edit. Preserve this single landscape pixel-art scene exactly in size and all geometry. In the upper-left treehouse ONLY remove the white robot holding the blue book, the yellow five-point star to its upper right, and the white drinking mug on its right. Reconstruct matching dark green foliage behind star, tree trunk behind robot, and orange wooden floor behind mug and robot. Keep computer, books, string lights, railing and every other object and pixel location unchanged. No new items. Output one landscape image same framing.

Mobile (reference: treehouse-repair-mobile.png):
> Precise object edit of single portrait pixel-art garden. Remove ONLY the yellow five-point star at upper-left treehouse and the white drinking mug on that treehouse's wooden platform. Fill star with continuous matching dark green foliage; fill mug with continuous orange wood and railing. Preserve exact framing, dimensions, all surrounding objects, computer, lights, treehouse, and layout unchanged. No new items. One portrait image.

Blimp:
> Create one professional pixel-art airship/blimp UI illustration on a genuinely transparent background. Wide side-view horizontal blimp pointing right, cream ivory balloon with subtle gold shaded panels, dark navy stepped pixel outline, cyan fins on LEFT rear, small amber gondola hanging below. Fine crisp pixels, playful polished 16-bit garden-game aesthetic. The large main central cream body must be nearly blank and spacious, occupying 75 percent width and 65 percent height, suitable for overlaying two rows of HTML instructions later. No lettering, no symbols, no characters, no clouds, no scene, no drop shadow outside the airship. Centered entire blimp visible, minimal transparent margin. Aspect ratio about 3:2, balloon somewhat plump rather than narrow. Palette ivory cream, teal cyan, navy, warm gold.

## Plain envelope revision

Final homepage asset: `assets/landing/welcome-blimp-plain.png`, edited with the built-in image-generation tool from `welcome-blimp.png`.

Prompt:
> Precise object edit of this pixel-art blimp. Remove ALL gold vertical curved panel lines/bands/seams from the cream balloon body, including both pairs near its left and right sides. Make the entire cream envelope plain uninterrupted ivory with only very soft shading to suggest volume, no panel lines horizontal or vertical. Preserve exact same silhouette, size, framing, navy pixel outline, cyan tail fins, gold gondola and transparent background alpha. Do not add text or objects. Output transparent PNG.

## Animation and fabric polish (19 September)

Built-in image-generation edits, saved locally:
- `assets/landing/robot-slide-clean.png`: clean transparent sliding character, rendered using its opaque content bounds.
- `assets/landing/sandbox-background-desktop.png`: only the sandbox repair region is used, preserving the remaining scene.
- `assets/landing/wayfinding-fabric-flag.png`: mobile flag; text and links remain accessible HTML, ropes follow its actual eyelets.

Prompts:
> Edit this pixel-art robot into a clean production sprite with genuine transparent background, no checkerboard. Preserve pose, white robot with cyan smiling eyes and blue neck, both raised hands, legs and body, dark navy complete outlines. Remove the floating yellow excitement marks. Restore fully opaque white/blue arms and body, no holes or missing pixels, no greenery, no slide, no background. Entire character tightly framed with small transparent margin. Same character and pose, not redesigned.

> One pixel-art fabric pennant flag UI background, transparent background, front facing. A wide hanging ivory cloth banner, width to height 1.5, subtle gentle fabric wave, restrained gold hem and dark navy fine pixel outline, cyan reinforced upper hem with two small gold eyelets near upper left and upper right. Deep elegant swallowtail lower edge. Main central 75% must be plain ivory with almost no shading for readable overlaid text. Crisp small pixels, professional polished 16-bit aesthetic, no text no icons no imagery no ropes no pole no scenery. Complete flag visible with minimal transparent margins. Not a rectangular card or signboard: a light soft fabric flag with a slightly undulating silhouette.

> Precise local edit. In this exact landscape pixel-art garden remove ONLY the yellow cat robot seated in the lower-left sandbox, including its blue shovel. Reconstruct the clean yellow sand and any greenery behind the cat ears. Keep sandcastle, red flag, bucket, ball, sandbox wooden edges and every other object unchanged. Preserve exact 1672x941 layout and object positions; no resizing or reframing, no other edits. No replacement character. This is a clean background plate for animation.


## Desktop cat cleanup

- Asset: `assets/landing/robot-cat-clean.png`
- Mode: built-in image generation, background extraction from the mobile scene.
- Prompt: Extract ONLY the small yellow/orange robot cat seated in the sandbox at lower left of the reference. Preserve this exact character identity, seated pose, white rim black face with cyan eyes, orange triangular ears, red collar, orange body, two dark paw soles, and raised hand holding blue sand shovel. Create a clean standalone pixel-art sprite on genuinely transparent background with tight framing and modest transparent margins. Remove ALL sand, sandbox, castle, bushes, bucket and surrounding objects, including stray fragments around back of head and seated hips. Preserve crisp dark silhouette with no missing body parts, no halo, no scenery attached. No redesign, no text, no new props.
- Desktop only: seated on clear sand with a small stationary contact shadow, outside the castles across its sway range. Mobile scene unchanged.

### Cat arm correction
- Final asset: `assets/landing/robot-cat-clean-v2.png` (built-in image generation, precise-object-edit).
- Prompt: Fix ONLY the malformed arms on this pixel-art robot cat sprite. Both arms must be clearly complete with visible shoulder, upper arm, elbow, forearm, wrist and distinct rounded white mitten paw connected continuously to body. On viewer LEFT (cat's right arm), replace the malformed white slash/triangular shape on its belly with a proper rounded white paw resting on its thigh, attached to an orange bent arm at its side; the paw must have a clear dark outline separate from torso and leg. On viewer RIGHT, ensure an intact orange arm and rounded white paw visibly gripping the existing blue shovel by its handle, no transparent holes or disconnected pieces. Preserve exact face, ears, colours, red collar, seated pose, two feet with paw pads and pixel-art style. Keep truly transparent background and clean silhouette. Do not crop any part. No scenery, no additional props, no text. Both arms should be unambiguous even when reduced to a 120px sprite.

### Rounded robot arms (final revision)
Asset: `assets/landing/robot-cat-clean-v3.png`. Built-in image generation, precise object edit of v2.
Prompt: Change only the two arms. Remove orange wing-like elbow silhouettes entirely. Replace with simple smooth chunky white robot capsule arms outlined dark navy. Viewer-left: short arm hangs naturally down from shoulder with round mitten beside knee. Viewer-right: thick white capsule connects shoulder to hand holding existing shovel. No acute elbows, triangular points, pinched joints, scenery or shadow. Preserve head, face, ears, red collar, orange torso, feet, shovel, seated pose, pixel-art style and transparent background.

## Mobile sandbox cleanup
Asset: `assets/landing/sandbox-background-mobile.png`, built-in image generation.
Prompt: Remove only the orange robot cat and blue shovel from the mobile source scene. Reconstruct clean golden sand, wooden rear rim and grass behind it. Preserve dimensions, framing, bucket, castles, flag, duck, balls and all surrounding objects. Crisp pixel-art texture; no blur, smearing, cat remnants or shadow. Used only within the old cat repair rectangle; the rest of the original scene is retained.
