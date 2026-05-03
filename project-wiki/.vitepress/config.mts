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
          
          // Add Exports link if exists
          wikiSidebar.push({
            text: 'Exports',
            collapsed: false,
            items: [
              { text: 'Full Wiki', link: `/${wikiId}/exports/full-wiki` }
            ]
          });
          
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
  mermaid: {
    // Mermaid plugin configuration
  }
}));
