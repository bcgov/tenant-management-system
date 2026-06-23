# CSTAR Documentation Site

This folder contains the Docusaurus documentation site for CSTAR.

The documentation content is written in Markdown under `docs-site/docs`. Docusaurus builds the Markdown into static files that can be hosted by GitHub Pages.

## Local preview

From the repository root:

```powershell
cd docs-site
npm install
npm run start
```

Open:

```text
http://localhost:4150
```

## Build for GitHub Pages

For this repository, build with the GitHub Pages base path:

```powershell
cd docs-site
npm ci
$env:DOCS_URL = 'https://bcgov.github.io'
$env:DOCS_BASE_URL = '/tenant-management-system/'
npm run build
```

The generated site is written to:

```text
docs-site/build
```

## Preview the built site

```powershell
npm run serve
```

## Deploy to GitHub Pages

GitHub Pages should publish the contents of:

```text
docs-site/build
```

The GitHub Actions job only needs to:

```bash
cd docs-site
npm ci
DOCS_URL="https://bcgov.github.io" DOCS_BASE_URL="/tenant-management-system/" npm run build
```

Then upload `docs-site/build` as the Pages artifact.

Expected site URL:

```text
https://bcgov.github.io/tenant-management-system/
```

Reference: Docusaurus builds static files into `build`, and GitHub Pages can host those static files.
