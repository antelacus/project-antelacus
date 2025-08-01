import { Source_Serif_4, JetBrains_Mono, Noto_Serif_SC, Cormorant_Garamond } from 'next/font/google';

//
// Defines the Cormorant Garamond font.
// This is our primary, expressive typeface for headings.
// A beautiful, classical serif with elegant proportions that embodies
// the "Living Manuscript" aesthetic.
//
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant-garamond',
  display: 'swap', // Critical for performance: show fallback immediately
  preload: true,   // Prioritize loading for better perceived performance
});

//
// Defines the Source Serif 4 font.
// This is our workhorse typeface for all body copy.
// It's chosen for its exceptional readability and quiet elegance on screen.
//
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif-4',
  display: 'swap', // Show fallback text immediately
  preload: true,   // Critical font for body text
});

//
// Defines the JetBrains Mono font.
// Used for all monospaced text, primarily for code blocks.
// Chosen for its clarity and excellent programming ligatures.
//
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

//
// Defines the Source Han Serif (思源宋体) font.
// The Chinese counterpart to Source Serif 4, used for all Chinese text.
// We use Noto_Serif_SC as the Google Fonts equivalent.
//
const sourceHanSerif = Noto_Serif_SC({
    weight: ['400', '500', '700'],
    subsets: ['latin'], // subset 'chinese-simplified' is not available, so we use latin
    variable: '--font-source-han-serif',
    display: 'swap',
})

export { cormorantGaramond, sourceSerif4, jetbrainsMono, sourceHanSerif };