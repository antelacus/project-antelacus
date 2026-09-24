'use client';

import type { ReactNode } from 'react';

import { PAGE_IDS } from '@/lib/page-ids';

// A link back to the folded contents that also unfolds it: arriving at a closed disclosure would leave
// the reader one more tap away. Without script it is still a plain link to the contents.
export default function ContentsLink({ children }: { children: ReactNode }) {
  return (
    <a
      href={`#${PAGE_IDS.contents}`}
      onClick={() => {
        const contents = document.getElementById(PAGE_IDS.contents);
        if (contents instanceof HTMLDetailsElement) contents.open = true;
      }}
    >
      {children}
    </a>
  );
}
