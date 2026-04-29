'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileNav({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 2000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px',
          display: 'none', // Hidden by default, shown via CSS query
          color: 'var(--text-primary)',
          cursor: 'pointer'
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1500,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Drawer */}
      <div className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}>
        {children}
      </div>
    </>
  );
}
