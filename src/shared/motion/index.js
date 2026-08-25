export const motionDuration = Object.freeze({
  fast: 0.14,
  base: 0.18,
  layout: 0.24,
});

export const motionEase = Object.freeze([0.16, 1, 0.3, 1]);

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionDuration.fast, ease: motionEase },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.985, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.985, y: 2 },
  transition: { duration: motionDuration.base, ease: motionEase },
};

export const slideFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: motionDuration.base, ease: motionEase },
};

export function reducedMotionTransition(reducedMotion, transition = {}) {
  return reducedMotion ? { duration: 0 } : transition;
}
