import { Composition } from 'remotion'
import { Promo } from './Promo.tsx'

export function RemotionRoot() {
  return <Composition id="Promo" component={Promo} durationInFrames={360} fps={30} width={1080} height={1080} />
}
