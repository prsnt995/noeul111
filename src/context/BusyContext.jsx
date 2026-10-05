import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const BusyContext = createContext(null);

/**
 * Global blocking loader: while `busy`, a fullscreen overlay swallows all
 * pointer events so the user cannot click elsewhere, double-submit, or
 * retry a save halfway through (the classic duplicate-creating retry).
 * Re-entrant via a counter — nested runBusy calls stack correctly.
 */
export function BusyProvider({ children }) {
  const [depth, setDepth] = useState(0);
  const [message, setMessage] = useState('');

  const runBusy = useCallback(async (fn, msg) => {
    if (msg) setMessage(msg);
    setDepth((d) => d + 1);
    try {
      return await fn();
    } finally {
      setDepth((d) => Math.max(0, d - 1));
    }
  }, []);

  const busy = depth > 0;

  return (
    <BusyContext.Provider value={{ busy, busyMessage: message, runBusy }}>
      {children}
      {busy && (
        <div
          role="alertdialog"
          aria-busy="true"
          aria-label={message || '처리 중'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            backgroundColor: 'rgba(18, 18, 19, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'wait',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
              animation: 'busyPop 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Loader2 size={22} className="busy-spin" aria-hidden />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#18181b' }}>
              {message || '처리 중...'}
            </span>
          </div>
          <style>{`@keyframes busySpin { to { transform: rotate(360deg); } } .busy-spin { animation: busySpin 0.9s linear infinite; } @keyframes busyPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }`}</style>
        </div>
      )}
    </BusyContext.Provider>
  );
}

export function useBusy() {
  const ctx = useContext(BusyContext);
  if (!ctx) throw new Error('useBusy must be used within BusyProvider');
  return ctx;
}
