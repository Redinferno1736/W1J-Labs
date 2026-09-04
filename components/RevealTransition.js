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
// step's transform transition technically ends
const SETTLE_MS = 700; // nav: pure transform+opacity — compositor only

// If you land mid-way and nothing else happens within this window,
// the remaining step(s) auto-play in the same direction — this is
// what stops a single scroll from ever feeling "stuck" waiting for a
// second one. A genuine second scroll arriving before this fires
// cancels it and takes over normally.
const AUTO_CONTINUE_MS = 300;

const scaleForStep = (step) => {
  if (step <= 0) return 1;
  if (step >= STEPS) return COVER_SCALE;
  return 1 + (COVER_SCALE - 1) * (step / STEPS);
};

export default function RevealTransition() {
  const boxRef = useRef(null);
  const stepRef = useRef(0); // 0 (closed) .. STEPS (fully open)
  const animatingRef = useRef(false);
  const lastDirRef = useRef(1);
  const autoTimerRef = useRef(null);
  const [contentVisible, setContentVisible] = useState(false);
  const [navSettled, setNavSettled] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    box.style.transition = `transform ${STEP_MS}ms cubic-bezier(0.4,0,0.2,1)`;

    const clearAutoContinue = () => {
      if (autoTimerRef.current != null) {
        window.clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };

    const advance = (dir) => {
      const current = stepRef.current;
      const next = current + dir;
      if (next < 0 || next > STEPS) return; // already fully closed/open
      animatingRef.current = true;
      lastDirRef.current = dir;

      const targetScale = scaleForStep(next);

      const onStepEnd = (e) => {
        if (e.propertyName !== "transform") return;
        box.removeEventListener("transitionend", onStepEnd);
        stepRef.current = next;
        animatingRef.current = false;

        // Landed mid-way (not fully closed or open) — schedule the
        // fallback so this never just sits there unfinished.
        if (next > 0 && next < STEPS) {
          autoTimerRef.current = window.setTimeout(() => {
            autoTimerRef.current = null;
            advance(lastDirRef.current);
          }, AUTO_CONTINUE_MS);
        }
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
        clearAutoContinue(); // a real scroll arrived — it drives this step, not the fallback
        advance(1);
      } else if (e.deltaY < -4 && stepRef.current > 0) {
        e.preventDefault();
        clearAutoContinue();
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
        clearAutoContinue();
        advance(1);
        touchStartY = e.touches[0].clientY;
      } else if (delta < -12 && stepRef.current > 0) {
        e.preventDefault();
        clearAutoContinue();
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
      clearAutoContinue();
    };
  }, []);

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