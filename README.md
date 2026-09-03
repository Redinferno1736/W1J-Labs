# W1J.LABS

Next.js (App Router, JavaScript) + Tailwind CSS starter for the lookbook
landing experience: hero carousel → scroll-driven red logo wipe → gated
Page 2 (Shop / Exhibit / About / Contact) with a liquid-glass nav panel.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Swap in real photography

Edit `components/Hero.js` — the `SLIDES` array. Drop your images in
`public/images/` and set `src: "/images/your-file.jpg"` (currently `null`,
which renders a placeholder gradient so you can see the layout without
assets).

## What's here vs. what's next

This build covers Page 1 (carousel hero) and the Page 2 red landing
(Shop/Exhibit/About/Contact nav). It does **not** yet include: the
member registration form, access-code gate, product listings/checkout,
in-site chat, or the admin dashboard — those are separate builds on top
of this shell, per the fuller project spec. Happy to do those next.

## Notes on the build

- **Fonts:** `Anton` (nav/display), `Rubik Wet Paint` (W1J.LABS wordmark —
  gives the hand-brushed poster feel from the reference art), `Playfair
  Display Italic` (hero caption). Loaded via `next/font/google`, no extra
  setup needed.
- **Logo wipe:** `components/LogoWipeTransition.js` drives the scale
  purely off scroll position (rAF-throttled, no state re-renders) for a
  smooth 60fps feel. Adjust `scale = 1 + eased * 42` if you want the
  logo to grow faster/slower relative to scroll distance.
- **Liquid glass:** see `.liquid-glass` in `app/globals.css` — layered
  backdrop-blur + gradient + inset highlight + gradient border. Works
  best over the red background/blur target — if you reuse it elsewhere,
  make sure there's something behind it worth blurring.
- **Reduced motion:** respected globally (see the media query in
  `globals.css`) — motion-sensitive visitors get instant states instead
  of the wipe/animations.
