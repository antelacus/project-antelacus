"use client";

/**
 * Loading Component - The Gentle Pause
 * 
 * A loading state that embodies the "Living Manuscript" aesthetic:
 * - Subtle breathing animation that feels organic
 * - Ink dots that appear like thoughts forming on paper
 * - Maintains the aesthetic continuity during transitions
 */

export default function Loading() {
  return (
    <div className="content-container content-container-standard">
      <div 
        className="loading-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '2rem',
        }}
      >
        {/* Breathing ink dots */}
        <div 
          className="loading-dots"
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-ink)',
                animation: `breathe 1.8s ease-in-out infinite ${index * 0.3}s`,
              }}
            />
          ))}
        </div>
        
        {/* Gentle loading text */}
        <p 
          style={{
            color: 'rgba(29, 29, 27, 0.6)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            animation: 'fadeIn 0.8s ease-out',
          }}
        >
          思绪正在凝聚...
        </p>
      </div>
      
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}