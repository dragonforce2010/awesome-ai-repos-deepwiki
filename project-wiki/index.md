---
layout: home

hero:
  name: "Awesome AI Repos"
  text: "DeepWiki"
  tagline: "高信噪中文技术维基 — 精选开源 AI / Agent 项目，源码可溯源，面向全球华语开发者与爱好者。"
  actions:
    - theme: brand
      text: 浏览全部项目
      link: /patoles-agent-flow/pages/overview

features:
  - title: 策展与深度
    details: 不止 README，聚焦架构决策、主流程与扩展点；每份 wiki 尽量可追溯至具体源文件与提交。
  - title: 一体化索引
    details: 通过各子目录 wiki-structure.json 自动生成导航与侧栏，统一检索入口。
  - title: 图文并茂
    details: 广泛使用 Mermaid 表达架构与状态，中文讲解与图示并列，便于自学与内部分享。
---

## Available Projects

<script setup>
import { data as wikis } from './wikis.data.ts'
</script>

<div class="wiki-grid">
  <a v-for="wiki in wikis" :key="wiki.id" :href="wiki.firstPageLink || `/${wiki.id}/pages/overview`" class="wiki-card">
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
