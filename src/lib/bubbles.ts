// 편지를 말풍선으로 나누는 규칙 (dm, msg 테마)
// - 빈 줄로 구분된 문단 하나가 말풍선 하나다. 줄바꿈 하나는 같은 말풍선 안의 줄바꿈이다.
// - 문단이 길면(빈 줄 없이 쓴 긴 글 포함) 문장 단위로 묶어 말풍선 하나가 대략 80~120자가 되게 한다.

const BUBBLE_MAX = 120

/** 문장 끝 부호(와 뒤따르는 공백)까지를 한 문장으로 자른다. 줄바꿈도 문장의 끝이다. */
function sentences(paragraph: string): string[] {
  return paragraph.match(/[^.!?…。\n]*(?:[.!?…。]+["')\]”’]*[ \t]*|\n|$)/g)?.filter((s) => s.length > 0) ?? []
}

/** 문장 부호가 없는 긴 글은 공백에서 자른다. 공백도 없으면 글자 수로 자른다. */
function hardSplit(text: string): string[] {
  const out: string[] = []
  let rest = text
  while (rest.length > BUBBLE_MAX) {
    const space = rest.lastIndexOf(' ', BUBBLE_MAX)
    const at = space > BUBBLE_MAX / 2 ? space + 1 : BUBBLE_MAX
    out.push(rest.slice(0, at))
    rest = rest.slice(at)
  }
  out.push(rest)
  return out
}

function splitLong(paragraph: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const s of sentences(paragraph).flatMap(hardSplit)) {
    if (cur && cur.length + s.length > BUBBLE_MAX) {
      out.push(cur)
      cur = ''
    }
    cur += s
  }
  if (cur) out.push(cur)
  return out
}

export function splitBubbles(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .flatMap((p) => (p.trim().length > BUBBLE_MAX ? splitLong(p.trim()) : [p]))
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
}

/**
 * 가사처럼 한 줄씩 보여줄 때 쓰는 나누기 (player 테마).
 * 줄바꿈과 문장 끝에서 나누고, 그래도 max자를 넘으면 공백에서 자른다.
 */
export function splitLines(text: string, max: number): string[] {
  const out: string[] = []
  for (const s of text.replace(/\r\n?/g, '\n').split('\n').flatMap(sentences)) {
    let rest = s.trim()
    while (rest.length > max) {
      const space = rest.lastIndexOf(' ', max)
      const at = space > max / 3 ? space : max
      out.push(rest.slice(0, at).trim())
      rest = rest.slice(at).trim()
    }
    if (rest) out.push(rest)
  }
  return out
}

/** 빈 줄로 구분된 문단. 문단 안의 줄바꿈은 그대로 둔다. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}
