/**
 * parseRich — 把含内联标签的串解析为 segment 数组（不用 v-html，避免 XSS）。
 *
 * 支持标签: <b> 加粗 / <em> 次级 / <n> 数字 accent / <crit> 危险色。
 * 用于 cd-9 Admin stream desc / alert since 等富文本片段。
 *
 * @param {string} html 含 <b>/<em>/<n>/<crit> 的串
 * @returns {Array<{ text: string, tag: ''|'b'|'em'|'n'|'crit' }>}
 */
export function parseRich(html) {
  const text = String(html ?? '')
  const parts = []
  const re = /<(b|em|n|crit)>(.*?)<\/\1>/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), tag: '' })
    parts.push({ text: m[2], tag: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), tag: '' })
  return parts.length ? parts : [{ text, tag: '' }]
}
