const fs = require('fs')
const glob = require('glob')

const files = glob.sync('src/**/*.tsx', { cwd: '/Users/phyothant/Desktop/loc-jobs' })

for (const f of files) {
  const fp = `/Users/phyothant/Desktop/loc-jobs/${f}`
  let content = fs.readFileSync(fp, 'utf-8')
  const before = content

  // Remove lines like "color: Brand.text," or "color: Brand.textSecondary," or "color: Brand.primary,"
  // but only inside StyleSheet.create blocks (we check if line matches the pattern)
  content = content.replace(/^\s+color: Brand\.(text|textSecondary|primary),?$/gm, '')

  if (content !== before) {
    fs.writeFileSync(fp, content)
    console.log(f)
  }
}
