import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import fs from 'fs';
import path from 'path';

// Parse wiki structures to build sidebar and nav
const wikisDir = path.resolve(__dirname, '..');
const sidebar: Record<string, any[]> = {};
const nav: any[] = [];

/** Resolve markdown path for sidebar links (`path`, `file`, or `pages/{slug|id}.md`). */
function resolveWikiPagePath(page: any): string | undefined {
  if (typeof page?.path === 'string' && page.path.length > 0) {
    return page.path;
  }
  if (typeof page?.file === 'string' && page.file.length > 0) {
    return page.file;
  }
  const stem =
    page?.slug === 'README' && typeof page?.id === 'string'
      ? page.id
      : page?.slug || page?.id;
  if (typeof stem === 'string' && stem.length > 0) {
    return `pages/${stem}.md`;
  }
  return undefined;
}

try {
  const folders = fs.readdirSync(wikisDir, { withFileTypes: true });

  for (const folder of folders) {
    if (folder.isDirectory() && folder.name !== '.vitepress') {
      const wikiId = folder.name;
      const structurePath = path.join(wikisDir, wikiId, 'wiki-structure.json');
      
      if (fs.existsSync(structurePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(structurePath, 'utf8'));
          const projectName = data.projectName || wikiId;
          
          // Resolve first page link for nav (fallback to pages/overview)
          let firstPageLink = `/${wikiId}/pages/overview`;
          if (data.sections?.[0]?.pages?.[0]) {
            const firstPageId = data.sections[0].pages[0];
            const firstPage = typeof firstPageId === 'string'
              ? data.pages?.find((p: any) => p.id === firstPageId)
              : firstPageId;
            const firstPath = firstPage ? resolveWikiPagePath(firstPage) : undefined;
            if (firstPath) {
              firstPageLink = `/${wikiId}/${firstPath.replace(/\.md$/, '')}`;
            }
          }
          nav.push({ text: projectName, link: firstPageLink, activeMatch: `^/${wikiId}/` });
          
          // Build sidebar for this wiki
          const wikiSidebar: any[] = [];
          
          if (data.sections && Array.isArray(data.sections)) {
            for (const section of data.sections) {
              const items = section.pages.map((pageId: string) => {
                const page = data.pages?.find((p: any) => p.id === pageId);
                const pagePath = page ? resolveWikiPagePath(page) : undefined;
                if (page && typeof pagePath === 'string' && pagePath.length > 0) {
                  // Remove .md extension for link (wikis use either `path` or `file`)
                  const link = `/${wikiId}/${pagePath.replace(/\.md$/, '')}`;
                  return { text: page.title || page.id, link };
                }
                return null;
              }).filter(Boolean);
              
              wikiSidebar.push({
                text: section.title,
                collapsed: false,
                items
              });
            }
          } else if (data.pages && Array.isArray(data.pages)) {
            const items = data.pages
              .map((page: any) => {
                const pagePath = resolveWikiPagePath(page);
                if (!pagePath) {
                  return null;
                }
                const link = `/${wikiId}/${pagePath.replace(/\.md$/, '')}`;
                return { text: page.title || page.id, link };
              })
              .filter(Boolean);
            if (items.length > 0) {
              wikiSidebar.push({
                text: '目录',
                collapsed: false,
                items
              });
            }
          }
          
          sidebar[`/${wikiId}/`] = wikiSidebar;
        } catch(e) {
          console.error(`Error parsing ${structurePath}`, e);
        }
      }
    }
  }
} catch (e) {
  console.error("Error generating sidebar:", e);
}

const rawBase = process.env.VITEPRESS_BASE ?? "";
const base =
  rawBase.length > 0
    ? rawBase.endsWith("/")
      ? rawBase
      : `${rawBase}/`
    : "/";

export default withMermaid(defineConfig({
  base,
  title: "Awesome AI Repos · DeepWiki",
  description: "High-signal Chinese technical wikis for curated open-source AI projects",
  // Exclude heavy export files and skill files that contain raw code snippets
  // which break the Vue template compiler
  srcExclude: [
    '**/exports/**',
    '**/skills/**',
  ],
  markdown: {
    // Wrap the content inside <details> blocks with v-pre to prevent
    // Vue template compilation of code snippets that contain JSX/HTML-like syntax
    config: (md) => {
      const originalRender = md.render.bind(md);
      md.render = (src: string, env: any) => {
        // Strip <details class="source-snippets">...</details> blocks entirely
        // before Vue compilation. These contain raw source code that frequently
        // includes JSX/TSX/HTML tags which break the Vue template compiler.
        const cleaned = src.replace(
          /<details class="source-snippets">[\s\S]*?<\/details>/g,
          ''
        );
        return originalRender(cleaned, env);
      };
    },
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      ...nav
    ],
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dragonforce2010/awesome-ai-repos-deepwiki' }
    ],
    search: {
      provider: 'local'
    }
  },
  ignoreDeadLinks: true,  // Sources links point outside project-wiki tree; ignore all dead links
  mermaid: {
    // Mermaid plugin configuration
  }
}));

