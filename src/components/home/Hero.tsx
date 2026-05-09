import MobileHero from "./MobileHero";
import HeroLegendsRotator from "./HeroLegendsRotator";

/**
 * Hybrid Hero — renders BOTH heroes; CSS visibility classes ensure only
 * one is shown per breakpoint. No JS branching → no hydration mismatch,
 * no flash on resize, no SSR/CSR divergence.
 *
 *   • Mobile (<768px) → <MobileHero /> — static globe + 3 jerseys + CTA
 *   • Desktop (md+)   → <HeroLegendsRotator /> — Higgsfield video rotator
 *
 * The visibility class is on each child's outer <section> (md:hidden vs
 * hidden md:block) so the layout stays clean.
 */
export default function Hero() {
  return (
    <>
      <MobileHero />
      <HeroLegendsRotator />
    </>
  );
}
