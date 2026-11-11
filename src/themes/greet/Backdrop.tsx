import { st } from '../shared.tsx'

// 좋은 하루 테마의 배경. 화면 내용과 분리해 두었으므로, 나중에 사진 배경으로 바꿀 때는
// 이 컴포넌트만 바꾸면 된다. 꽃은 디자인(M-greeting, M-open)의 SVG 그대로다.

export const BACKDROP_FILL = 'background:linear-gradient(180deg,#58B8FF 0%,#BFE8FF 48%,#FFD9EC 100%)'

const PA = 'M0 0 C-15 -9 -19 -34 -7 -47 C-4 -44 -2 -43 0 -41 C3 -44 5 -45 8 -47 C19 -33 14 -10 0 0 Z'
const PB = 'M0 0 C-12 -12 -17 -30 -4 -44 C2 -50 10 -44 13 -36 C17 -24 10 -8 0 0 Z'

/** full: 잠김 화면의 꽃 전부 / light: 열림 화면의 줄인 꽃 */
export function Backdrop({ variant }: { variant: 'full' | 'light' }) {
  const full = variant === 'full'
  const id = (name: string) => `greet-${variant}-${name}`
  const use = (name: string) => `#${id(name)}`
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={st('position:absolute;left:0;top:0;width:100%;height:100%;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));pointer-events:none')}
    >
      <defs>
        <path id={id('pa')} d={PA} />
        <path id={id('pb')} d={PB} />
        <g id={id('leaf')}>
          <path d="M0 0 C14 -17 42 -19 60 -4 C42 11 14 12 0 0 Z" fill="#1E8E3E" />
          {full && <path d="M2 0 C20 -5 40 -6 58 -4" fill="none" stroke="#0F6B2B" strokeWidth="1.5" />}
        </g>
        <g id={id('flower')}>
          <g fill="currentColor">
            <use href={use('pa')} />
            <use href={use('pb')} transform="rotate(52) scale(0.92)" />
            <use href={use('pa')} transform="rotate(101)" />
            <use href={use('pb')} transform="rotate(158) scale(1.06)" />
            <use href={use('pa')} transform="rotate(205) scale(0.9)" />
            <use href={use('pb')} transform="rotate(259)" />
            <use href={use('pa')} transform="rotate(311) scale(1.04)" />
          </g>
          {full && (
            <g fill="#000000" opacity="0.13" transform="rotate(27) scale(0.56)">
              <use href={use('pb')} />
              <use href={use('pa')} transform="rotate(70)" />
              <use href={use('pb')} transform="rotate(148)" />
              <use href={use('pa')} transform="rotate(215)" />
              <use href={use('pb')} transform="rotate(290)" />
            </g>
          )}
          <circle r="9" fill="#FFD400" />
          {full && (
            <>
              <circle cx="-3" cy="-2" r="1.6" fill="#B97A00" />
              <circle cx="3" cy="-3" r="1.4" fill="#B97A00" />
              <circle cx="1" cy="4" r="1.6" fill="#B97A00" />
              <circle cx="-4" cy="3" r="1.2" fill="#B97A00" />
            </>
          )}
        </g>
      </defs>

      <use href={use('leaf')} transform="translate(40 58) rotate(38) scale(1.3)" />
      {full && <use href={use('leaf')} transform="translate(70 30) rotate(-12) scale(1.1)" />}
      <use href={use('flower')} style={{ color: '#FF3B7F' }} transform="translate(32 38) rotate(12) scale(1.4)" />
      <use href={use('flower')} style={{ color: '#FFB7D2' }} transform="translate(98 16) rotate(-30) scale(0.78)" />
      {full && <use href={use('flower')} style={{ color: '#FF6FA5' }} transform="translate(12 112) rotate(60) scale(0.66)" />}

      <use href={use('leaf')} transform="translate(352 236) rotate(150) scale(1.15)" />
      <use href={use('flower')} style={{ color: '#FFFFFF' }} transform="translate(372 196) rotate(-18) scale(1.22)" />
      {full && <use href={use('flower')} style={{ color: '#FFB300' }} transform="translate(346 262) rotate(40) scale(0.62)" />}

      {full ? (
        <>
          <use href={use('leaf')} transform="translate(22 498) rotate(70) scale(1.2)" />
          <use href={use('flower')} style={{ color: '#B14DFF' }} transform="translate(8 458) rotate(25) scale(1.28)" />
          <use href={use('flower')} style={{ color: '#FF3B7F' }} transform="translate(44 528) rotate(-50) scale(0.6)" />
          <use href={use('leaf')} transform="translate(360 640) rotate(200) scale(1.0)" />
          <use href={use('flower')} style={{ color: '#E3001B' }} transform="translate(378 606) rotate(8) scale(0.92)" />
        </>
      ) : (
        <use href={use('flower')} style={{ color: '#B14DFF' }} transform="translate(8 640) rotate(25) scale(1.1)" />
      )}
    </svg>
  )
}
