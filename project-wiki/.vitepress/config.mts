import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import fs from 'fs';
import path from 'path';

// Parse wiki structures to build sidebar and nav
const wikisDir = path.resolve(__dirname, '..');
const sidebar: Record<string, any[]> = {};
const nav: any[] = [];

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
          
          // Add to nav
          nav.push({ text: projectName, link: `/${wikiId}/pages/overview`, activeMatch: `^/${wikiId}/` });
          
          // Build sidebar for this wiki
          const wikiSidebar = [];
          
          if (data.sections && Array.isArray(data.sections)) {
            for (const section of data.sections) {
              const items = section.pages.map((pageId: string) => {
                const page = data.pages?.find((p: any) => p.id === pageId);
                if (page && page.path) {
                  // Remove .md extension for link
                  const link = `/${wikiId}/${page.path.replace(/\.md$/, '')}`;
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

export default withMermaid(defineConfig({
  title: "DeepWiki",
  description: "Unified Documentation Workspace",
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
      { icon: 'github', link: 'https://github.com/nexu-io/open-design' }
    ],
    search: {
      provider: 'local'
    }
  },
  ignoreDeadLinks: true,
  mermaid: {
    // Mermaid plugin configuration
  }
}));

