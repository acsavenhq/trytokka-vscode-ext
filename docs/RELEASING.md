# Releasing (maintainers)

Marketplace updates are **manual uploads** (no VSCE_PAT / Actions publish).

1. Bump `version` in `package.json` and add a CHANGELOG entry.
2. Commit and push `main`.
3. Package locally:

```bash
npm run compile
npx @vscode/vsce package --allow-missing-repository
```

This writes `scout-ai-spend-tracker-<version>.vsix` — the default name, which is what every
release in this folder is called. Do not pass `-o extension.vsix`: it produces a file whose
name says nothing about which version it holds, and the folder already contains a dozen
releases that need telling apart.

4. Upload `scout-ai-spend-tracker-<version>.vsix` in [Marketplace → Manage](https://marketplace.visualstudio.com/manage/publishers/trytokka) (same flow you use today).

Optional: attach the `.vsix` to a GitHub Release for yourself (`gh release create vX.Y.Z extension.vsix`).

CI still compiles + dry-run packages on every push/PR so breaks are caught early. It does **not** publish.
