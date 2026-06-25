const fs = require('fs')
const path = require('path')

const FILES = [
  'src/app/(tabs)/index.tsx', 'src/app/(tabs)/explore.tsx',
  'src/app/(tabs)/chat.tsx', 'src/app/(tabs)/my-jobs.tsx',
  'src/app/job/[id].tsx', 'src/app/post.tsx',
  'src/app/chat/[jobId]/[otherUserId].tsx',
  'src/app/user/[id]/index.tsx', 'src/app/user/[id]/jobs.tsx',
  'src/app/search-users.tsx', 'src/app/notifications.tsx',
  'src/app/edit-profile.tsx', 'src/app/onboarding.tsx',
  'src/app/reviews/[userId].tsx',
  'src/app/(auth)/login.tsx', 'src/app/(auth)/register.tsx',
  'src/app/(auth)/forgot-password.tsx', 'src/app/(auth)/reset-password.tsx',
  'src/app/(auth)/verify-email.tsx',
  'src/components/review-card.tsx', 'src/components/picker-modal.tsx',
  'src/components/skeleton.tsx',
]

const BRAND_COLORS = [
  'Brand.white', 'Brand.bg', 'Brand.borderLight', 'Brand.border',
]

const COLOR_PROPERTIES = [
  'backgroundColor', 'borderColor', 'borderBottomColor', 'borderTopColor',
  'borderLeftColor', 'borderRightColor',
]

// Maps style names to properties to add inline
const styleMap = new Map()

for (const relPath of FILES) {
  const fullPath = path.join('/Users/phyothant/Desktop/loc-jobs', relPath)
  let content = fs.readFileSync(fullPath, 'utf-8')

  // Find all StyleSheet.create blocks and extract style names with Brand colors
  const styleSheetRegex = /StyleSheet\.create\(\{([\s\S]*?)\}\);/g
  let match

  while ((match = styleSheetRegex.exec(content)) !== null) {
    const block = match[1]
    const styleRegex = /(\w+):\s*\{([\s\S]*?)\},/g
    let smatch
    while ((smatch = styleRegex.exec(block)) !== null) {
      const name = smatch[1]
      const body = smatch[2]
      for (const prop of COLOR_PROPERTIES) {
        for (const color of BRAND_COLORS) {
          const regex = new RegExp(`\\s+${prop}:\\s*${color},?`, 'g')
          if (regex.test(body)) {
            if (!styleMap.has(name)) styleMap.set(name, [])
            styleMap.get(name).push(`${prop}: ${color}`)
          }
        }
      }
    }
  }

  // Remove the Brand colors from StyleSheet.create styles
  let newContent = content
  for (const prop of COLOR_PROPERTIES) {
    for (const color of BRAND_COLORS) {
      const regex = new RegExp(`(\\s+)${prop}:\\s*${color},?\\n`, 'g')
      newContent = newContent.replace(regex, '\n')
    }
  }

  // Add inline overrides for each style usage
  for (const [styleName, props] of styleMap) {
    // Build the inline override string
    const inlineParts = props.map(p => {
      const [prop, color] = p.split(': ')
      return `${prop}: ${color}`
    })
    const inlineStr = `{ ${inlineParts.join(', ')} }`

    // Replace style={styles.xxx} with style={[styles.xxx, { ... }]}
    const usageRegex = new RegExp(`style=\\{styles\\.${styleName}\\}`, 'g')
    newContent = newContent.replace(usageRegex, `style={[styles.${styleName}, ${inlineStr}]}`)
  }

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent)
    console.log(`Fixed: ${relPath} (${styleMap.size} styles patched)`)
  }
  styleMap.clear()
}

console.log('Done. Run npx tsc --noEmit to verify.')
