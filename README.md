# DeepWiki

Static documentation hub (VitePress) for multiple repository wikis under `project-wiki/`.

## GitHub Pages

After enabling **Settings → Pages → Build and deployment → Source: GitHub Actions**, pushes to `master` deploy the site to:

**https://dragonforce2010.github.io/deepwiki/**

Local preview (root path, same as old Netlify root):

```bash
pnpm install
pnpm run dev
```

Preview the same asset paths as production (`/deepwiki/` base):

```bash
VITEPRESS_BASE=/deepwiki/ pnpm run build
VITEPRESS_BASE=/deepwiki/ pnpm exec vitepress serve project-wiki
```

## Repository layout

- `project-wiki/<wiki-id>/` — generated wiki pages and `wiki-structure.json`
- `project-repos/` — optional sibling checkout of analyzed repositories (not required for build)
