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
 * 빈 줄로 구분된 문단이 한 줄이다. 문단이 fits를 넘으면 문장(줄바꿈 포함) 단위로 들어가는 만큼
 * 묶고, 문장 하나가 넘치면 단어, 단어 하나가 넘치면 글자 단위로 자른다.
 * fits는 화면에서 두 줄 안에 들어가는지 재는 함수다(글자 폭은 화면이 안다).
 * 문단의 마지막 줄에 단어(어절) 하나만 남으면 앞 줄 끝 단어를 옮겨 붙인다(avoidOrphan).
 */
export function lyricLines(text: string, fits: (line: string) => boolean): string[] {
  const out: string[] = []
  for (const para of paragraphs(text)) {
    const flat = para.replace(/\s+/g, ' ')
    if (fits(flat)) {
      out.push(flat)
      continue
    }
    const start = out.length
    let cur = ''
    const push = () => {
      if (cur) out.push(cur)
      cur = ''
    }
    // cur에 이어 붙여 보고, 넘치면 cur를 내보낸 뒤 새로 시작한다. 새로 시작해도 넘치면 false.
    const add = (piece: string, sep: string) => {
      const joined = cur ? `${cur}${sep}${piece}` : piece
      if (fits(joined)) return ((cur = joined), true)
      push()
      return fits(piece) && ((cur = piece), true)
    }
    for (const s of sentences(para)) {
      const sentence = s.replace(/\s+/g, ' ').trim()
      if (!sentence || add(sentence, ' ')) continue
      for (const word of sentence.split(' ')) {
        if (add(word, ' ')) continue
        for (const ch of word) if (!add(ch, '')) cur = ch
      }
    }
    push()
    avoidOrphan(out, start, flat, fits)
  }
  return out
}

/**
 * 문단의 마지막 줄이 단어 하나뿐이면 앞 줄의 끝 단어를 옮겨 두 단어로 만든다.
 * 옮긴 줄이 fits를 넘거나, 앞 줄이 단어 하나뿐이거나, 두 줄 사이가 단어 중간(글자 단위로 자른 곳)이면 그대로 둔다.
 * lines[start..]는 flat(공백을 하나로 줄인 문단)을 순서대로 자른 것이라 마지막 줄은 flat의 끝부분이다.
 */
function avoidOrphan(lines: string[], start: number, flat: string, fits: (line: string) => boolean): void {
  const n = lines.length
  if (n - start < 2) return
  const last = lines[n - 1]
  if (last.includes(' ') || flat[flat.length - last.length - 1] !== ' ') return
  const prev = lines[n - 2]
  const cut = prev.lastIndexOf(' ')
  if (cut <= 0) return
  const next = `${prev.slice(cut + 1)} ${last}`
  if (!fits(next)) return
  lines[n - 2] = prev.slice(0, cut)
  lines[n - 1] = next
}

/** 빈 줄로 구분된 문단. 문단 안의 줄바꿈은 그대로 둔다. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}
