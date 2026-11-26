import React from 'react';

/**
 * Minimal class-based error boundary for the admin (and app) shell.
 * Prevents a single render crash from blanking the whole console.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#52525b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginBottom: 8 }}>
            화면을 불러오지 못했습니다
          </h2>
          <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>
            {String(this.state.error?.message || this.state.error || 'Unknown error')}
          </p>
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => window.location.reload()}>
            새로고침 Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}