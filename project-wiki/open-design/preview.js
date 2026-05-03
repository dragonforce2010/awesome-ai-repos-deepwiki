const fs = require('fs');

// 1. 读取 wiki 结构
const structure = JSON.parse(fs.readFileSync('wiki-structure.json', 'utf8'));

// 2. 生成 _sidebar.md
let sidebar = `* [首页](README.md)\n`;
structure.sections.forEach(sec => {
  sidebar += `\n* **${sec.title}**\n`;
  sec.pages.forEach(pageId => {
    const page = structure.pages.find(p => p.id === pageId);
    if (page) {
      sidebar += `  * [${page.title}](${page.path})\n`;
    }
  });
});

if (fs.existsSync('skills')) {
  sidebar += `\n* **Skills**\n`;
  const skills = fs.readdirSync('skills');
  skills.forEach(skill => {
    if (fs.existsSync(`skills/${skill}/SKILL.md`)) {
      sidebar += `  * [${skill}](skills/${skill}/SKILL.md)\n`;
    }
  });
}

sidebar += `\n* **导出**\n  * [完整 Wiki](exports/full-wiki.md)\n`;

fs.writeFileSync('_sidebar.md', sidebar);

// 3. 生成 docsify index.html (支持 mermaid)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${structure.projectName} - DeepWiki</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify/lib/themes/vue.css">
</head>
<body>
  <div id="app"></div>
  <script>
    window.$docsify = {
      name: '${structure.projectName}',
      repo: '${structure.repoUrl}',
      loadSidebar: true,
      subMaxLevel: 2,
      markdown: {
        renderer: {
          code: function(code, lang) {
            if (lang === "mermaid") {
              return '<div class="mermaid">' + code + '</div>';
            }
            return this.origin.code.apply(this, arguments);
          }
        }
      }
    }
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify/lib/docsify.min.js"></script>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true });
    window.mermaid = mermaid;
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify-mermaid@2.0.1/dist/docsify-mermaid.js"></script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('✅ Docsify 配置已生成！');
console.log('运行以下命令启动预览：');
console.log('npx docsify-cli serve . -p 3000');
