/**
 * Skip Link Component - "Living Manuscript" Aesthetic
 * 
 * Embodies the principle of "The Quiet Reveal" (静默展开的层次原则):
 * - Completely hidden by default, respecting the manuscript's visual purity
 * - Gracefully reveals when focused, like ink flowing onto paper
 * - Uses the sacred seal color (朱砂) to mark this important interaction
 * - Provides seamless accessibility without compromising aesthetic integrity
 */

"use client";

export default function SkipLink({ label }: { label: string }) {
  const handleSkipToMain = () => {
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      mainElement.focus();
      mainElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkipToMain}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'var(--color-seal)',
        color: 'var(--color-paper)',
        padding: '12px 20px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '15px',
        lineHeight: '1.4',
        zIndex: 1000,
        
        /* The Quiet Reveal: Hidden until focused */
        transform: 'translateY(-120%)',
        opacity: '0',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        
        /* Ink Texture: Subtle shadow like seal paste on paper */
        boxShadow: '0 4px 12px rgba(180, 42, 30, 0.15), 0 2px 4px rgba(180, 42, 30, 0.1)',
        
        /* Typography: Body font for clarity */
        fontFamily: 'var(--font-body), var(--font-body-cn), serif',
        
        /* Accessibility: Ensure sufficient contrast */
        border: '2px solid transparent',
      }}
      onFocus={(e) => {
        // Graceful Emergence: Like ink flowing onto paper
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.borderColor = 'var(--color-paper)';
      }}
      onBlur={(e) => {
        // Quiet Retreat: Returning to the void
        e.currentTarget.style.transform = 'translateY(-120%)';
        e.currentTarget.style.opacity = '0';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onMouseEnter={(e) => {
        // Subtle highlight for accidental mouse encounters
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(180, 42, 30, 0.2), 0 3px 6px rgba(180, 42, 30, 0.15)';
      }}
      onMouseLeave={(e) => {
        // Return to natural state
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(180, 42, 30, 0.15), 0 2px 4px rgba(180, 42, 30, 0.1)';
      }}
    >
      {label}
    </a>
  );
}