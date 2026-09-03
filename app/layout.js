import { Anton, Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const caption = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500"],
  variable: "--font-caption",
});

export const metadata = {
  title: "W1J.LABS",
  description:
    "W1J.LABS — lookbook and exclusive drop store. Where one door closes, another one opens.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${caption.variable}`}>
      <body>{children}</body>
    </html>
  );
}