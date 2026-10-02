import React from 'react';
import { Inbox } from 'lucide-react';

export function Empty({ title = 'No results 결과가 없습니다', desc = 'Try adjusting filters or create a new item.', action }) {
  return (
    <div className="adm-empty">
      <Inbox size={28} aria-hidden style={{ color: '#a1a1aa', margin: '0 auto' }} />
      <h3>{title}</h3>
      {desc ? <p>{desc}</p> : null}
      {action}
    </div>
  );
}

export function ErrorBanner({ message, onRetry, loginHref = '/admin/login' }) {
  if (!message) return null;
  return (
    <div className="adm-error" role="alert">
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry ? <button type="button" className="adm-btn" onClick={onRetry}>다시 시도 Retry</button> : null}
      <a className="adm-btn" href={loginHref}>로그인 Login</a>
    </div>
  );
}
