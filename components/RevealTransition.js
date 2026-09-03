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

const GROW_MS = 800; // box: pure transform scale — GPU compositor only
const OVERLAP_MS = 190; // how much earlier the nav starts settling in, before
// the box's grow is technically finished — by this point in the easing
// curve the box already visually fills the screen, so starting the nav
// here reads as one continuous handoff instead of a stop-then-go pause
const SETTLE_MS = 700; // nav: pure transform+opacity — also compositor only

/**
 * Sequencing, driven by real events/paints, never guessed timers:
 *
 * FORWARD:
 *   1. box grows via transform: scale (only thing animating)
 *   2. nav mounts a little before the box technically finishes
 *      (OVERLAP_MS early) — the easing curve means the box already
 *      visually fills the screen by then, so this blends the two
 *      motions instead of a stop-then-go handoff
 *   3. nav starts in an "unsettled" state (scale-90, opacity-0)
 *   4. two requestAnimationFrame calls guarantee that unsettled
 *      state is actually painted first
 *   5. only then do we flip to "settled" (scale-100, opacity-100),
 *      which is what the browser actually animates between
 *
 * REVERSE: nav unmounts instantly, two paints confirm it's gone,
 * then the box shrinks back to the logo mark.
 */
export default function RevealTransition() {
  const boxRef = useRef(null);
  const stateRef = useRef("closed"); // closed | open
  const animatingRef = useRef(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [navSettled, setNavSettled] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    box.style.transition = `transform ${GROW_MS}ms cubic-bezier(0.65,0,0.35,1)`;

    const open = () => {
      animatingRef.current = true;

      const onGrowEnd = (e) => {
        if (e.propertyName !== "transform") return;
        box.removeEventListener("transitionend", onGrowEnd);
        stateRef.current = "open";
        animatingRef.current = false;
      };
      box.addEventListener("transitionend", onGrowEnd);

      box.style.transform = `translateX(-50%) scale(${COVER_SCALE})`;

      // Mount the nav a little before the box's grow technically ends —
      // creates the overlap described above, instead of waiting for the
      // hard stop of transitionend.
      window.setTimeout(() => {
        setContentVisible(true);
      }, Math.max(GROW_MS - OVERLAP_MS, 0));
    };

    const close = () => {
      animatingRef.current = true;
      setNavSettled(false);
      setContentVisible(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const onShrinkEnd = (e) => {
            if (e.propertyName !== "transform") return;
            box.removeEventListener("transitionend", onShrinkEnd);
            stateRef.current = "closed";
            animatingRef.current = false;
          };
          box.addEventListener("transitionend", onShrinkEnd);

          box.style.transform = "translateX(-50%) scale(1)";
        });
      });
    };

    const atTop = () => window.scrollY <= 4;

    const onWheel = (e) => {
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      if (stateRef.current === "closed" && atTop() && e.deltaY > 4) {
        e.preventDefault();
        open();
      } else if (stateRef.current === "open" && e.deltaY < -4) {
        e.preventDefault();
        close();
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
      if (stateRef.current === "closed" && atTop() && delta > 12) {
        e.preventDefault();
        open();
      } else if (stateRef.current === "open" && delta < -12) {
        e.preventDefault();
        close();
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

          {/* The nav settles in — scale-90/opacity-0 -> scale-100/opacity-100. */}
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