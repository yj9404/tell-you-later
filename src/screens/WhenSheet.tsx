import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { daysBetween, nextNewYear, oneYearLater } from '../lib/date.ts'
import { useStrings } from '../i18n/index.ts'
import { useModal } from './useModal.ts'
import { customStart, resolveWhen, type When } from './when.ts'
import s from './write.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// 이만큼 아래로 끌면 닫는다.
const DRAG_CLOSE = 90

type Choice = When['kind']

interface Props {
  now: Date
  value: When
  onConfirm: (when: When) => void
  onClose: () => void
}

/**
 * 여는 날 시트 (디자인: Write-when 3차). 직접 고르기 / 새해 0시 / 1년 뒤 지금 중 하나를 고르고 "이때로 정하기"로 확정한다.
 * 직접 고르기가 기본값(내일 이 시각)이라 맨 위에 둔다.
 * 날짜·시각 칸은 직접 고르기를 골랐을 때만 펼쳐진다. 아래에서 올라오고, 밖을 누르거나 아래로 내리면 닫힌다.
 */
export function WhenSheet({ now, value, onConfirm, onClose }: Props) {
  const t = useStrings()
  const { dayClock } = t.when
  // 직접 고르기 칸의 처음 값: 이미 직접 고른 시각이 있으면 그것, 아니면 내일 이 시각(customStart).
  // 프리셋을 오가도 적어 둔 값은 그대로 둔다.
  const start = customStart(value, now)
  const [choice, setChoice] = useState<Choice>(value.kind)
  const [date, setDate] = useState(isoDate(start))
  const [pm, setPm] = useState(start.getHours() >= 12)
  const [hourText, setHourText] = useState(String(start.getHours() % 12 || 12))
  const [minText, setMinText] = useState(pad(start.getMinutes()))
  const [drag, setDrag] = useState(0)
  const dragFrom = useRef<number | null>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const minInput = useRef<HTMLInputElement>(null)

  // 열 때 시트로 포커스를 옮기고, 닫을 때 열기 전 자리(쓰기 화면의 날짜 버튼)로 돌려준다.
  useModal(onClose)
  useEffect(() => sheet.current?.focus({ preventScroll: true }), [])

  const [y, m, d] = date.split('-').map(Number)
  const custom = new Date(y, m - 1, d, ((Number(hourText) || 12) % 12) + (pm ? 12 : 0), Number(minText) || 0)
  const at = choice === 'custom' ? custom : resolveWhen({ kind: choice }, now)
  const past = at.getTime() <= now.getTime()
  const days = daysBetween(now, at)

  const typeHour = (raw: string) => {
    let t = raw.replace(/[^0-9]/g, '').slice(0, 2)
    if (t.length === 2 && Number(t) === 0) t = '12'
    else if (Number(t) > 12) t = '12'
    setHourText(t)
    // 두 자리를 치면 분 칸으로 넘어간다.
    if (t.length === 2) {
      minInput.current?.focus()
      minInput.current?.select()
    }
  }
  const typeMin = (raw: string) => {
    const t = raw.replace(/[^0-9]/g, '').slice(0, 2)
    setMinText(Number(t) > 59 ? '59' : t)
  }

  const onDragStart = (e: PointerEvent) => {
    dragFrom.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: PointerEvent) => {
    if (dragFrom.current !== null) setDrag(Math.max(0, e.clientY - dragFrom.current))
  }
  const onDragEnd = () => {
    if (dragFrom.current === null) return
    dragFrom.current = null
    if (drag > DRAG_CLOSE) onClose()
    else setDrag(0)
  }

  const option = (kind: Choice, name: string, sub?: string) => (
    <label className={s.option}>
      <input type="radio" name="when" className={s.radio} checked={choice === kind} onChange={() => setChoice(kind)} />
      <span aria-hidden="true" className={s.radioDot} />
      <span className={s.optionText}>
        <span className={s.optionName}>{name}</span>
        {sub && <span className={s.optionSub}>{sub}</span>}
      </span>
    </label>
  )

  const ampm = (
    <div role="group" aria-label={t.when.ampm} className={s.ampm}>
      {[false, true].map((isPm) => (
        <button key={String(isPm)} type="button" aria-pressed={pm === isPm} onClick={() => setPm(isPm)}>
          {isPm ? t.when.pm : t.when.am}
        </button>
      ))}
    </div>
  )

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div
        ref={sheet}
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whenTitle"
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.grab} onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
          <div aria-hidden="true" className={s.grabBar} />
          <h2 id="whenTitle" className={s.sheetTitle}>
            {t.when.title}
          </h2>
        </div>

        <div role="radiogroup" aria-labelledby="whenTitle" className={s.options}>
          <div className={s.customOption}>
            {option('custom', t.when.custom)}
            {choice === 'custom' && (
              <div className={s.custom}>
                <label className={s.dateButton}>
                  <span>{t.date.dayDate(custom)}</span>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                  {/* 기기 기본 달력을 쓴다. 투명한 입력칸을 버튼 위에 겹쳐 두고, 지원하는 브라우저에서는 showPicker로 연다. */}
                  <input
                    type="date"
                    aria-label={t.when.date}
                    className={s.dateInput}
                    value={date}
                    min={isoDate(now)}
                    onChange={(e) => {
                      if (!e.target.value || e.target.value < isoDate(now)) return
                                        setDate(e.target.value)
                    }}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker()
                      } catch {
                        // showPicker가 없거나 막힌 브라우저는 입력칸 기본 동작으로 열린다.
                      }
                    }}
                  />
                </label>

                <div className={s.time}>
                  {/* 오전·오후는 한국어에서는 시각 앞, 영어에서는 시각 뒤(11:30 PM)에 둔다. */}
                  {!t.when.ampmAfter && ampm}
                  <input
                    aria-label={t.when.hour}
                    inputMode="numeric"
                    className={s.timeInput}
                    value={hourText}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => typeHour(e.target.value)}
                    onBlur={() => setHourText(String(Number(hourText) || 12))}
                  />
                  <span className={s.colon}>:</span>
                  <input
                    ref={minInput}
                    aria-label={t.when.minute}
                    inputMode="numeric"
                    className={s.timeInput}
                    value={minText}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => typeMin(e.target.value)}
                    onBlur={() => setMinText(pad(Number(minText) || 0))}
                  />
                  {t.when.ampmAfter && ampm}
                </div>
              </div>
            )}
          </div>
          {option('newyear', t.when.newyear, dayClock(nextNewYear(now)))}
          {option('year', t.when.year, dayClock(oneYearLater(now)))}
        </div>

        <p className={s.summary} role="status">
          {past ? t.when.past(dayClock(at)) : t.when.opens(dayClock(at), days)}
        </p>
        <button type="button" className={s.confirmButton} disabled={past} onClick={() => onConfirm(choice === 'custom' ? { kind: 'custom', at: custom } : { kind: choice })}>
          {t.when.confirm}
        </button>
      </div>
    </div>
  )
}
