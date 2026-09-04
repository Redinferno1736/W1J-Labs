"use client";

import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Shop", href: "#shop" },
  { label: "Exhibit", href: "#exhibit" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

// Solid red mark, 1:3 ratio (matches the supplied logo — 533x1600px).
const LOGO_WIDTH = 32;
const LOGO_HEIGHT = 96;
const COVER_SCALE = 46;

const STEPS = 2; // number of separate scrolls/swipes needed to fully reveal
const STEP_MS = 420; // each individual step's grow/shrink duration
const OVERLAP_MS = 140; // nav starts settling in slightly before the final
// step's transform transition technically ends — same idea as before, just
// scoped to the last step instead of one long single animation
const SETTLE_MS = 700; // nav: pure transform+opacity — compositor only

const scaleForStep = (step) => {
  if (step <= 0) return 1;
  if (step >= STEPS) return COVER_SCALE;
  return 1 + (COVER_SCALE - 1) * (step / STEPS);
};

/**
 * Same box-grows / nav-mounts-after mechanism as before, but the grow
 * (and shrink) now happens across STEPS separate scroll/swipe inputs
 * instead of one continuous animation triggered by a single gesture.
 * Each qualifying wheel/touch input advances (or reverses) exactly
 * one step; further input is ignored until that step's own
 * transition genuinely finishes (`transitionend`), so steps can't
 * stack or skip.
 */
export default function RevealTransition() {
  const boxRef = useRef(null);
  const stepRef = useRef(0); // 0 (closed) .. STEPS (fully open)
  const animatingRef = useRef(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [navSettled, setNavSettled] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    box.style.transition = `transform ${STEP_MS}ms cubic-bezier(0.4,0,0.2,1)`;

    const advance = (dir) => {
      const current = stepRef.current;
      const next = current + dir;
      if (next < 0 || next > STEPS) return; // already fully closed/open
      animatingRef.current = true;

      const targetScale = scaleForStep(next);

      const onStepEnd = (e) => {
        if (e.propertyName !== "transform") return;
        box.removeEventListener("transitionend", onStepEnd);
        stepRef.current = next;
        animatingRef.current = false;
      };
      box.addEventListener("transitionend", onStepEnd);

      // Leaving the fully-open state — unmount the nav first, and wait
      // two paints so that's actually committed before the box moves.
      if (current === STEPS && dir === -1) {
        setNavSettled(false);
        setContentVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            box.style.transform = `translateX(-50%) scale(${targetScale})`;
          });
        });
        return;
      }

      box.style.transform = `translateX(-50%) scale(${targetScale})`;

      // Reaching fully-open on this step — mount the nav slightly
      // before this step's transition technically ends.
      if (next === STEPS) {
        window.setTimeout(() => {
          setContentVisible(true);
        }, Math.max(STEP_MS - OVERLAP_MS, 0));
      }
    };

    const onWheel = (e) => {
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      if (e.deltaY > 4 && stepRef.current < STEPS) {
        e.preventDefault();
        advance(1);
      } else if (e.deltaY < -4 && stepRef.current > 0) {
        e.preventDefault();
        advance(-1);
      }
    };

    let touchStartY = null;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      if (touchStartY == null) return;
      const delta = touchStartY - e.touches[0].clientY;
      if (delta > 12 && stepRef.current < STEPS) {
        e.preventDefault();
        advance(1);
        touchStartY = e.touches[0].clientY; // reset so the next chunk of the same swipe can trigger the next step
      } else if (delta < -12 && stepRef.current > 0) {
        e.preventDefault();
        advance(-1);
        touchStartY = e.touches[0].clientY;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // Once the nav mounts, let it paint once in its "unsettled" state
  // before flipping to "settled" — that flip is the scale/fade the
  // browser actually animates.
  useEffect(() => {
    if (!contentVisible) {
      setNavSettled(false);
      return;
    }
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setNavSettled(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [contentVisible]);

  return (
    <>
      {/* Layer 1 — the growing mark. Pure transform, GPU compositor only. */}
      <div
        ref={boxRef}
        className="fixed left-1/2 top-6 z-30 bg-brand-red will-change-transform sm:top-8"
        style={{
          width: LOGO_WIDTH,
          height: LOGO_HEIGHT,
          transform: "translateX(-50%) scale(1)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Layer 2 — real Page 2 content. */}
      {contentVisible && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-brand-red">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-brand-redDeep/40 blur-3xl" />

          <span className="font-display absolute top-8 left-1/2 -translate-x-1/2 select-none text-2xl tracking-wide text-white sm:top-10 sm:text-3xl">
            W1J.LABS
          </span>

          <nav
            aria-label="Primary"
            className={`liquid-glass relative z-10 flex w-[86%] max-w-md flex-col items-center gap-3 rounded-[2rem] px-10 py-14 transition-[transform,opacity] ease-out sm:w-[24rem] ${
              navSettled ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
            style={{ transitionDuration: `${SETTLE_MS}ms` }}
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link font-display text-3xl uppercase tracking-wide text-white transition-colors duration-300 hover:text-brand-ink sm:text-4xl"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}