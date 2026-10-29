import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const EASE = 'expo.out';
export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

let lenis: Lenis | null = null;
export function startSmoothScroll() {
  if (lenis || reduced() || isTouch() || navigator.webdriver) return;
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export function stopSmoothScroll() {
  lenis?.destroy();
  lenis = null;
}
export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
export function scrollTopSmooth() {
  if (lenis) lenis.scrollTo(0, { duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
}
export function scrollLock(lock: boolean) {
  if (lenis) (lock ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}
