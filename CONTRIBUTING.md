# Contributing

Thanks for helping out! There are two main ways to contribute.

## Share a theme

**Easy way:** open a [Theme submission](../../issues/new?template=theme_submission.yml) issue and attach your exported file.

**Pull request:**

1. In the studio, save your theme as a profile, then go to **Export → Download backup**.
2. Fork this repo and create `themes/<your-theme-name>/` (lowercase, dashes, e.g. `ocean-glass`).
3. Inside it, add:
   - `<your-theme-name>.json`: your backup, renamed. Keep only the profile for this theme in the `profiles` list, set its `id` to your folder name, and add a `meta` block at the top:
     ```json
     "meta": {
       "name": "Ocean Glass",
       "description": "One line about the look.",
       "author": "your-github-username",
       "tags": ["dark", "glass"],
       "added": "2026-11-28"
     }
     ```
   - `preview.png` (optional but recommended): a screenshot of YouTube with your theme on. 1280×800 or similar works best. You can also use `.jpg`, `.webp` or `.gif`.
4. Run `node scripts/validate-themes.js` and make sure it passes.
5. Open a PR. You don't need to edit any README: once it's merged, a GitHub Action adds your theme to the showcase automatically.

> Keep theme files under 5 MB. Uploaded video or image backgrounds are stored inside the JSON and make it huge, so prefer gradient backgrounds for shared themes.

## Work on the extension

1. Clone the repo.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `extension/` folder.
3. Make your change, then click the reload icon on the extension card and refresh YouTube.
4. Add a line under **Unreleased** in `CHANGELOG.md`.

### Project layout

| File | What it does |
|---|---|
| `schema.js` | Every theme setting, its default and its valid values. Start here. |
| `theme.js` | Turns settings into the CSS injected into YouTube. |
| `selectors.js` | YouTube element selectors. Update this when YouTube changes its markup. |
| `content.js`, `runtime.js` | Content script that applies the theme to youtube.com. |
| `studio.html/js/css` | The editor page. |
| `preview*.js` | The sandboxed YouTube mock used for the live preview. |
| `effects.js`, `companion.js`, `search-popup.js` | Optional visual effects. |
