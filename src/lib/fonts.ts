/** Google Fonts를 필요한 것만 불러온다. 같은 조합은 한 번만 붙인다. */
export function loadFonts(families: readonly string[]): void {
  if (families.length === 0) return
  const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
