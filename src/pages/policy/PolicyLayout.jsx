import React from 'react';
import { Link } from 'wouter';
import { business, POLICY_VERSION } from '../../config/business.js';
import './policy.css';

export function PolicyLayout({ title, children }) {
  return <main className="policy-page">
    <Link href="/">← 홈으로</Link>
    <header><p>NOEUL · {business.companyName}</p><h1>{title}</h1><p>시행일: {POLICY_VERSION}</p></header>
    <nav aria-label="고객 정책">
      <Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link>
      <Link href="/refund-exchange">취소·교환·환불</Link><Link href="/shipping">배송 안내</Link>
      <Link href="/business-info">사업자 정보</Link><Link href="/contact">고객센터</Link>
    </nav>
    <article>{children}</article>
    <aside><strong>고객 문의</strong><p><a href={`tel:${business.phone}`}>{business.phoneFormatted}</a> · <a href={`mailto:${business.email}`}>{business.email}</a><br />{business.businessHours}</p></aside>
  </main>;
}
export function Section({ title, children }) { return <section><h2>{title}</h2>{children}</section>; }
export function PolicyTable({ headers, rows }) {
  return <div className="policy-table-scroll"><table><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
}
