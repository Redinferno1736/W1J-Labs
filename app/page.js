import Hero from "@/components/Hero";
import RevealTransition from "@/components/RevealTransition";

export default function Home() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden">
      <Hero />
      <RevealTransition />
    </main>
  );
}