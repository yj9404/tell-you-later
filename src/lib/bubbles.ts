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
 * 빈 줄로 구분된 문단이 한 줄이다. 문단이 fits(화면에서 두 줄 안에 들어가는지)를 넘으면 이렇게 나눈다.
 * 1. 구두점(쉼표·마침표·물음표·느낌표 등) 뒤와 줄바꿈에서 끊은 구절을 들어가는 만큼 한 줄에 묶는다.
 *    다음 구절이 더 들어가지 않으면 구두점 자리에서 끊는다(단어를 더 채울 수 있어도).
 * 2. 구절 하나가 두 줄보다 길 때만(그 안에 끊을 구두점이 없을 때만) 단어 단위로 채울 만큼 채우고, 단어 하나가 넘치면 글자 단위로 자른다.
 *    이렇게 채운 끝에 단어(어절) 하나만 남으면 앞 줄 끝 단어를 옮겨 붙인다(avoidOrphan).
 * fits는 글자 폭을 아는 화면이 준다.
 */
export function lyricLines(text: string, fits: (line: string) => boolean): string[] {
  const out: string[] = []
  for (const para of paragraphs(text)) {
    const flat = para.replace(/\s+/g, ' ')
    if (fits(flat)) {
      out.push(flat)
      continue
    }
    // lines[i] 앞에서 어떻게 끊었는지: 구절 경계 / 단어 사이(채우다 넘침) / 단어 중간(글자 단위)
    const lines: string[] = []
    const breaks: Break[] = []
    let cur = ''
    let curBreak: Break = 'clause'
    const finish = (next: Break) => {
      if (cur) {
        lines.push(cur)
        breaks.push(curBreak)
        avoidOrphan(lines, breaks, fits)
      }
      cur = ''
      curBreak = next
    }
    const tryAdd = (piece: string, sep: string) => {
      const joined = cur ? `${cur}${sep}${piece}` : piece
      return fits(joined) && ((cur = joined), true)
    }
    for (const clause of clauses(para)) {
      if (tryAdd(clause, ' ')) continue
      // 구두점 자리에서 끊는다. 다음 구절이 한 줄에 들어가면 그대로 새 줄이 된다.
      finish('clause')
      if (fits(clause)) {
        cur = clause
        continue
      }
      // 구두점 없이 두 줄보다 긴 구절: 새 줄부터 단어 단위로 채운다.
      for (const word of clause.split(' ')) {
        if (tryAdd(word, ' ')) continue
        if (fits(word)) {
          finish('space')
          cur = word
          continue
        }
        // 단어 하나가 두 줄보다 길다: 새 줄에서 글자 단위로 자른다.
        finish('space')
        for (const ch of word) {
          if (tryAdd(ch, '')) continue
          finish('char')
          cur = ch
        }
      }
    }
    finish('clause')
    out.push(...lines)
  }
  return out
}

type Break = 'clause' | 'space' | 'char'

// 구절을 끊는 구두점과 뒤따르는 닫는 따옴표·괄호, 그 뒤의 공백.
// 정규식 뒤보기((?<=…))는 iOS 16.3 이하 Safari에서 문법 오류라 쓰지 않고, 끊을 자리를 줄바꿈으로 바꿔 나눈다.
const CLAUSE_END = /([,.!?…;:、。，！？]["')\]”’]*)[ \t]+/g

/** 줄바꿈과, 공백이 뒤따르는 구두점에서 끊은 구절. 공백은 하나로 줄인다. */
function clauses(paragraph: string): string[] {
  return paragraph
    .replace(CLAUSE_END, '$1\n')
    .split('\n')
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter((c) => c.length > 0)
}

/**
 * 방금 끝낸 줄이 단어 하나뿐이고 단어 단위로 채우다 넘어온 줄이면, 앞 줄의 끝 단어를 옮겨 두 단어로 만든다.
 * 구두점 자리에서 끊은 줄(우선 규칙)이나 글자 단위로 자른 자리, 옮기면 넘치는 경우, 앞 줄이 단어 하나뿐이면 그대로 둔다.
 */
function avoidOrphan(lines: string[], breaks: Break[], fits: (line: string) => boolean): void {
  const n = lines.length
  if (n < 2 || breaks[n - 1] !== 'space') return
  const last = lines[n - 1]
  if (last.includes(' ')) return
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
