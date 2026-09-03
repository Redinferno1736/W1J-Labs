"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// Placeholder visuals only — swap for the designer's real lookbook
// photography later. Drop real files in /public/images and set `src`
// per slide when ready; the faint number can come out at that point.
const SLIDES = [
  { src: null, label: "01", tone: "from-neutral-900 via-black to-neutral-950" },
  { src: null, label: "02", tone: "from-brand-redDeep/70 via-black to-black" },
  { src: null, label: "03", tone: "from-zinc-700 via-zinc-900 to-black" },
  { src: null, label: "04", tone: "from-stone-800 via-neutral-900 to-black" },
  { src: null, label: "05", tone: "from-neutral-800 via-black to-neutral-950" },
];
const L = SLIDES.length;

// The three resting positions — wide hero slot, medium slot, then a
// sliver "peek" of what's next. { left, width } as percentages.
const SLOTS = [
  { left: 0, width: 52 },
  { left: 52, width: 34 },
  { left: 86, width: 14 },
];

const SLIDE_MS = 700;

function Pane({ slideIndex, style }) {
  const slide = SLIDES[slideIndex];
  return (
    <div
      className="absolute top-0 h-full overflow-hidden bg-gradient-to-br will-change-[left,width]"
      style={{ ...style, transitionProperty: "left, width" }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.tone}`} />
      {slide.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display select-none text-[18vw] leading-none text-white/10 sm:text-[8vw]">
            {slide.label}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/10" />
    </div>
  );
}

export default function Hero() {
  const [active, setActive] = useState(0);
  // null when idle; while animating: { dir, moved }
  const [t, setT] = useState(null);
  const timerRef = useRef(null);

  const go = useCallback(
    (dir) => {
      if (t) return; // ignore input mid-transition
      setT({ dir, moved: false });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setT((s) => (s ? { ...s, moved: true } : s)));
      });
      timerRef.current = window.setTimeout(() => {
        setActive((a) => (a + dir + L) % L);
        setT(null);
      }, SLIDE_MS);
    },
    [t]
  );

  // Dot navigation: adjacent slides get the full queue-shift motion;
  // farther jumps just snap straight there (this animation is built
  // for single-step moves).
  const goTo = useCallback(
    (target) => {
      if (t || target === active) return;
      if ((target - active + L) % L === 1) return go(1);
      if ((active - target + L) % L === 1) return go(-1);
      setActive(target);
    },
    [t, active, go]
  );

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const pct = (n) => `${n}%`;
  const transition = { transitionDuration: `${SLIDE_MS}ms`, transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" };

  let panes;
  if (!t) {
    // Idle — three panes at rest in their slots, no animation.
    panes = [0, 1, 2].map((slot) => (
      <Pane
        key={`img-${(active + slot) % L}`}
        slideIndex={(active + slot) % L}
        style={{ left: pct(SLOTS[slot].left), width: pct(SLOTS[slot].width) }}
      />
    ));
  } else if (t.dir === 1) {
    // Forward: leftmost pane exits left; slot1→slot0 (grows); slot2→slot1
    // (grows); a new pane enters at slot2 from off-screen right.
    const exitIdx = active;
    const growToWideIdx = (active + 1) % L;
    const growToMedIdx = (active + 2) % L;
    const enterIdx = (active + 3) % L;
    const at = (from, to) => (t.moved ? to : from);
    panes = [
      <Pane key={`img-${exitIdx}`} slideIndex={exitIdx} style={{ ...transition, left: pct(at(SLOTS[0].left, -52)), width: pct(52) }} />,
      <Pane key={`img-${growToWideIdx}`} slideIndex={growToWideIdx} style={{ ...transition, left: pct(at(SLOTS[1].left, SLOTS[0].left)), width: pct(at(SLOTS[1].width, SLOTS[0].width)) }} />,
      <Pane key={`img-${growToMedIdx}`} slideIndex={growToMedIdx} style={{ ...transition, left: pct(at(SLOTS[2].left, SLOTS[1].left)), width: pct(at(SLOTS[2].width, SLOTS[1].width)) }} />,
      <Pane key={`img-${enterIdx}`} slideIndex={enterIdx} style={{ ...transition, left: pct(at(100, SLOTS[2].left)), width: pct(SLOTS[2].width) }} />,
    ];
  } else {
    // Backward: a new pane enters at slot0 from off-screen left;
    // slot0→slot1 (shrinks); slot1→slot2 (shrinks); slot2 exits right.
    const enterIdx = (active - 1 + L) % L;
    const shrinkToMedIdx = active;
    const shrinkToPeekIdx = (active + 1) % L;
    const exitIdx = (active + 2) % L;
    const at = (from, to) => (t.moved ? to : from);
    panes = [
      <Pane key={`img-${enterIdx}`} slideIndex={enterIdx} style={{ ...transition, left: pct(at(-52, SLOTS[0].left)), width: pct(SLOTS[0].width) }} />,
      <Pane key={`img-${shrinkToMedIdx}`} slideIndex={shrinkToMedIdx} style={{ ...transition, left: pct(at(SLOTS[0].left, SLOTS[1].left)), width: pct(at(SLOTS[0].width, SLOTS[1].width)) }} />,
      <Pane key={`img-${shrinkToPeekIdx}`} slideIndex={shrinkToPeekIdx} style={{ ...transition, left: pct(at(SLOTS[1].left, SLOTS[2].left)), width: pct(at(SLOTS[1].width, SLOTS[2].width)) }} />,
      <Pane key={`img-${exitIdx}`} slideIndex={exitIdx} style={{ ...transition, left: pct(at(SLOTS[2].left, 100)), width: pct(SLOTS[2].width) }} />,
    ];
  }

  return (
    <section
      id="hero"
      className="relative flex h-[100svh] w-full flex-col items-center bg-white pt-28 sm:pt-[18vh]"
      aria-label="Lookbook cover carousel"
    >
      <div className="relative mb-[4svh] w-[94%] max-w-[1600px] flex-1 overflow-hidden bg-white">
        {panes}

        {/* Caption — pinned over the wide (slot0) region; text is the
            same across all slides, so it doesn't need to move with
            any particular pane. */}
        <p className="font-caption pointer-events-none absolute bottom-8 left-6 z-20 w-[40%] text-left text-lg italic text-white/90 sm:bottom-10 sm:left-8 sm:text-2xl">
          Where one door closes, another one opens
        </p>

        {/* Slide index marks */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={active === i}
              className={`h-[3px] w-6 rounded-full transition-colors duration-300 ${
                active === i ? "bg-brand-red" : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Red arrows */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="group absolute left-2 top-1/2 z-20 -translate-y-1/2 p-3 sm:left-4"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-brand-red transition-transform duration-300 group-hover:-translate-x-1">
            <path d="M16 4L9 12L16 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next slide"
          className="group absolute right-2 top-1/2 z-20 -translate-y-1/2 p-3 sm:right-4"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-brand-red transition-transform duration-300 group-hover:translate-x-1">
            <path d="M8 4L15 12L8 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scroll cue */}
        <div className="absolute bottom-5 right-4 z-20 hidden flex-col items-center gap-2 sm:flex">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Scroll</span>
          <div className="h-6 w-px animate-pulse bg-white/50" />
        </div>
      </div>
    </section>
  );
}