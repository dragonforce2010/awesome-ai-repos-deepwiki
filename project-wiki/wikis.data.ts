import fs from 'fs'
import path from 'path'

export default {
  load() {
    const wikisDir = path.resolve(__dirname)
    const wikis = []
    
    try {
      const folders = fs.readdirSync(wikisDir, { withFileTypes: true })
      
      for (const folder of folders) {
        if (folder.isDirectory() && folder.name !== '.vitepress') {
          const wikiId = folder.name
          const structurePath = path.join(wikisDir, wikiId, 'wiki-structure.json')
          
          if (fs.existsSync(structurePath)) {
            const data = JSON.parse(fs.readFileSync(structurePath, 'utf8'))
            // Resolve first page path for card link
            let firstPageLink = `/${wikiId}/pages/overview`
            if (data.sections?.[0]?.pages?.[0] && data.pages) {
              const firstId = data.sections[0].pages[0]
              const firstPage = typeof firstId === 'string'
                ? data.pages.find((p: any) => p.id === firstId)
                : firstId
              const fp = firstPage?.path || firstPage?.file
              if (fp) {
                firstPageLink = `/${wikiId}/${fp.replace(/\.md$/, '')}`
              }
            }
            wikis.push({
              id: wikiId,
              projectName: data.projectName || wikiId,
              description: data.description || '',
              pagesCount: data.pages ? data.pages.length : 0,
              firstPageLink
            })
          }
        }
      }
      return wikis
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
