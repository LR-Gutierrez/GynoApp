import { createAnimation } from '@ionic/angular';

let pendingDirection: 'forward' | 'back' = 'forward';

export function setNavDirection(dir: 'forward' | 'back') {
  pendingDirection = dir;
}

export function customNavAnimation(_baseEl: HTMLElement, opts?: any) {
  const enteringEl = opts?.enteringEl;
  const leavingEl = opts?.leavingEl;
  const dir = pendingDirection;
  pendingDirection = 'forward';

  if (!enteringEl || !leavingEl) {
    return createAnimation();
  }

  const isForward = dir === 'forward';
  const DURATION = 300;

  const entering = createAnimation()
    .addElement(enteringEl)
    .fromTo('transform', `translateX(${isForward ? '100%' : '-30%'})`, 'translateX(0)')
    .fromTo('opacity', isForward ? 1 : 0.4, 1);

  const leaving = createAnimation()
    .addElement(leavingEl)
    .fromTo('transform', 'translateX(0)', `translateX(${isForward ? '-30%' : '100%'})`)
    .fromTo('opacity', 1, isForward ? 0.5 : 1);

  return createAnimation()
    .addAnimation([entering, leaving])
    .duration(DURATION)
    .easing('cubic-bezier(0.32, 0.72, 0, 1)');
}
