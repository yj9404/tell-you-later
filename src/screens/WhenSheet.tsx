import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { dateClock, dayDate, fullDate, longDate, nextNewYear, oneYearLater } from '../lib/date.ts'
import { useModal } from './useModal.ts'
import { resolveWhen, type When } from './when.ts'
import s from './write.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// 이만큼 아래로 끌면 닫는다.
const DRAG_CLOSE = 90

interface Props {
  now: Date
  value: When
  onConfirm: (when: When) => void
  onClose: () => void
}

/** 날짜·시각 시트 (디자인: Write-when). 아래에서 올라오고, 밖을 누르거나 아래로 내리면 닫힌다. */
export function WhenSheet({ now, value, onConfirm, onClose }: Props) {
  const start = resolveWhen(value, now)
  // 빠른 선택을 고른 상태인지. 날짜·시각을 직접 고치면 풀린다.
  const [preset, setPreset] = useState<'newyear' | 'year' | null>(value.kind === 'custom' ? null : value.kind)
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

  const fill = (at: Date) => {
    setDate(isoDate(at))
    setPm(at.getHours() >= 12)
    setHourText(String(at.getHours() % 12 || 12))
    setMinText(pad(at.getMinutes()))
  }
  const pick = (kind: 'newyear' | 'year') => {
    setPreset(kind)
    fill(resolveWhen({ kind }, now))
  }

  const [y, m, d] = date.split('-').map(Number)
  const custom = new Date(y, m - 1, d, ((Number(hourText) || 12) % 12) + (pm ? 12 : 0), Number(minText) || 0)
  const at = preset ? resolveWhen({ kind: preset }, now) : custom
  const past = at.getTime() <= now.getTime()

  const typeHour = (raw: string) => {
    let t = raw.replace(/[^0-9]/g, '').slice(0, 2)
    if (t.length === 2 && Number(t) === 0) t = '12'
    else if (Number(t) > 12) t = '12'
    setHourText(t)
    setPreset(null)
    // 두 자리를 치면 분 칸으로 넘어간다.
    if (t.length === 2) {
      minInput.current?.focus()
      minInput.current?.select()
    }
  }
  const typeMin = (raw: string) => {
    const t = raw.replace(/[^0-9]/g, '').slice(0, 2)
    setMinText(Number(t) > 59 ? '59' : t)
    setPreset(null)
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
            언제 할까요
          </h2>
        </div>

        <div className={s.quick}>
          <button type="button" className={s.quickButton} aria-pressed={preset === 'newyear'} onClick={() => pick('newyear')}>
            <span className={s.quickName}>새해 0시</span>
            <span className={s.quickDate}>{fullDate(nextNewYear(now))}</span>
          </button>
          <button type="button" className={s.quickButton} aria-pressed={preset === 'year'} onClick={() => pick('year')}>
            <span className={s.quickName}>1년 뒤 지금</span>
            <span className={s.quickDate}>{dateClock(oneYearLater(now))}</span>
          </button>
        </div>

        <div className={s.custom}>
          <span className={s.customLabel}>아니면 직접</span>
          <label className={s.dateButton}>
            <span>{dayDate(custom)}</span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            {/* 기기 기본 달력을 쓴다. 투명한 입력칸을 버튼 위에 겹쳐 두고, 지원하는 브라우저에서는 showPicker로 연다. */}
            <input
              type="date"
              aria-label="날짜"
              className={s.dateInput}
              value={date}
              min={isoDate(now)}
              onChange={(e) => {
                if (!e.target.value || e.target.value < isoDate(now)) return
                setDate(e.target.value)
                setPreset(null)
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
            <div role="group" aria-label="오전 오후" className={s.ampm}>
              {[false, true].map((isPm) => (
                <button
                  key={String(isPm)}
                  type="button"
                  aria-pressed={pm === isPm}
                  onClick={() => {
                    setPm(isPm)
                    setPreset(null)
                  }}
                >
                  {isPm ? '오후' : '오전'}
                </button>
              ))}
            </div>
            <input
              aria-label="시"
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
              aria-label="분"
              inputMode="numeric"
              className={s.timeInput}
              value={minText}
              onFocus={(e) => e.target.select()}
              onChange={(e) => typeMin(e.target.value)}
              onBlur={() => setMinText(pad(Number(minText) || 0))}
            />
          </div>
          <span className={s.hint}>숫자를 눌러 바로 입력하세요.</span>
        </div>

        <div className={s.confirm}>
          <span className={s.summary} role="status">
            {past ? `이미 지난 시각입니다(${longDate(at)}). 지금보다 뒤로 정해 주세요.` : `${longDate(at)}에 열립니다.`}
          </span>
          <button type="button" className={s.confirmButton} disabled={past} onClick={() => onConfirm(preset ? { kind: preset } : { kind: 'custom', at: custom })}>
            이때로 정하기
          </button>
        </div>
      </div>
    </div>
  )
}
