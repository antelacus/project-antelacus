import { PAGE_IDS } from '@/lib/page-ids';

// The first stop for a keyboard: jumps past the navigation to <main>. Hidden until it has focus.
export default function SkipLink({ label }: { label: string }) {
  return (
    <a href={`#${PAGE_IDS.main}`} className="skip-link">
      {label}
    </a>
  );
}
