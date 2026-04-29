'use client';

import Link from 'next/link';

export default function ConserjeStatsCards({ cards }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      {cards.map((card) => (
        <Link key={card.href + card.label} href={card.href} style={{ textDecoration: 'none' }}>
          <div style={{
            background: card.bg,
            border: `1px solid ${card.border}`,
            borderRadius: '16px',
            padding: '28px',
            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
            cursor: 'pointer',
          }}
            onMouseEnter={e => { 
              e.currentTarget.style.transform = 'translateY(-3px)'; 
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = card.color;
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'none'; 
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = card.border;
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{card.icon}</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{card.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
