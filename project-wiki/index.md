---
layout: home

hero:
  name: "DeepWiki"
  text: "Unified Workspace"
  tagline: "Explore all your AI agent and project wikis in one beautiful place."
  actions:
    - theme: brand
      text: Browse Projects
      link: /open-design/pages/overview

features:
  - title: 10+ Projects
    details: Automatically indexed from wiki-structure.json files across your workspace.
  - title: Local First
    details: Lightning fast rendering, built natively for local multi-repo documentation.
  - title: Mermaid Powered
    details: Rich architecture and flow diagrams rendered seamlessly on the client side.
---

## Available Projects

<script setup>
import { data as wikis } from './wikis.data.ts'
</script>

<div class="wiki-grid">
  <a v-for="wiki in wikis" :key="wiki.id" :href="`/${wiki.id}/pages/overview`" class="wiki-card">
    <h3>{{ wiki.projectName }}</h3>
    <p>{{ wiki.description || 'No description available' }}</p>
    <div class="meta">
      <span>📚 {{ wiki.pagesCount }} pages</span>
    </div>
  </a>
</div>

<style>
.wiki-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.wiki-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: border-color 0.25s, background-color 0.25s;
  text-decoration: none !important;
  color: inherit;
}
.wiki-card:hover {
  border-color: var(--vp-c-brand-1);
}
.wiki-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.wiki-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  margin-top: 1.2rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  display: flex;
  justify-content: flex-start;
}
</style>
