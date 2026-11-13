# CSTAR Documentation Site

This folder contains the Docusaurus site for the CSTAR documentation. The pages are written in Markdown under `docs-site/docs` and published to GitHub Pages.

Published site: https://bcgov.github.io/tenant-management-system/

## Run locally

```bash
cd docs-site
npm ci
npm run start
```

The site opens at http://localhost:4150 and reloads as pages are edited.

## Check before committing

```bash
npm run lint
```

This runs the TypeScript check and a full production build. The build fails on any broken link between pages.

## Publishing

The `gh-pages` workflow (`.github/workflows/gh-pages.yml`) builds and publishes the site on every push to `main`. It can also be run manually from the Actions tab. No manual deployment step is required.

To reproduce the published build locally:

```bash
DOCS_URL="https://bcgov.github.io" DOCS_BASE_URL="/tenant-management-system/" npm run build
npm run serve
```

## Adding a page

1. Create the Markdown file in the matching folder under `docs/`.
2. Add the page to `sidebars.ts`. Pages that are not listed there do not appear in the navigation.
3. Run `npm run lint`.

Avoid renaming or moving existing pages. Other teams link to them, and a changed path breaks those links.

## Writing style

All pages follow the same style so that the site reads as one document.

### Tone

- Formal and neutral, in the style of government technical documentation.
- Refer to the reader's system as "the connected service" or "the service". Use "you" only inside numbered steps.
- Do not use contractions. Write "does not", not "doesn't".
- Do not use casual phrases, rhetorical questions or filler openers such as "It is important to note" or "Simply".

### Sentences

- Keep sentences short, with one idea in each.
- Use the present tense and the active voice: "CSTAR returns the roles", not "the roles will be returned".
- State exactly what happens. Use "usually" or "may" only when the behaviour does vary.

### Page structure

- Open each page with one or two sentences that state what the page covers and who it is for.
- Use plain noun phrases for headings, such as "Prerequisites", "Request" or "Errors".
- Use numbered steps for procedures, bullet points for lists of facts and tables for information the reader looks up.
- Use bold only for a term on its first mention, or for the opening statement of each principle on the Core principles page. Do not use bold for emphasis.
- End the page with a "Related pages" list instead of a closing paragraph.
- Check every statement about behaviour against the backend code before publishing it.

### Terms

Use these terms in the same way on every page.

| Use | Do not use |
| --- | --- |
| connected service | shared service, app, application |
| connected-service role | service role, app role |
| CSTAR role | tenant role, admin role |
| tenant owner, user admin, service user, operations admin (lower case) | Tenant Owner, ops admin |
| associated with a tenant | linked to, enabled for, turned on for |

Write API paths, field names and values in `code` style.
