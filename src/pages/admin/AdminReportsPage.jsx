import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { sourceLabel, ORDER_SOURCES } from '../../utils/orderSources.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Download, Search } from 'lucide-react';

export function AdminReportsPage() {
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [bySource, setBySource] = useState([]);
  const [totals, setTotals] = useState({ orders: 0, revenue: 0, unpaid: 0, receiptPending: 0 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState('all');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (source && source !== 'all') params.append('source', source);
      const res = await adminApi.get(`/admin/reports/sales?${params.toString()}`);
      if (res.success) {
        setBySource(res.data?.bySource || []);
        setTotals(res.data?.totals || { orders: 0, revenue: 0, unpaid: 0, receiptPending: 0 });
      }
    } catch (err) {
      showToast(err?.message || (lang === 'en' ? 'Failed to load report.' : '리포트를 불러오지 못했습니다.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (source && source !== 'all') params.append('source', source);
      params.append('format', 'csv');
      // adminApi returns JSON; CSV needs raw fetch with credentials.
      const r = await fetch(`/api/v1/admin/reports/sales?${params.toString()}`, { credentials: 'include' });
      if (!r.ok) throw new Error('CSV download failed');
      const text = await r.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales-by-source.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err?.message || 'CSV 다운로드 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="reports">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>
              {lang === 'en' ? 'Sales Reports' : '매출 리포트 (Sales Reports)'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              {lang === 'en'
                ? 'Totals, unpaid orders, receipts and refunds by channel.'
                : '채널별 매출 합계, 미결제, 입금확인 대기, 환불 현황'}
            </p>
          </div>
          <button
            onClick={handleCsv}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Download size={16} />
            <span>CSV 다운로드</span>
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          style={{ backgroundColor: '#fff', padding: '18px 24px', borderRadius: '10px', border: '1px solid #e4e4e7', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}
        >
          <div>
            <label className="form-label">{lang === 'en' ? 'From' : '시작일'}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">{lang === 'en' ? 'To' : '종료일'}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">{lang === 'en' ? 'Channel' : '채널'}</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="form-select">
              <option value="all">{lang === 'en' ? 'All channels' : '전체 채널'}</option>
              {ORDER_SOURCES.map(s => (
                <option key={s} value={s}>{sourceLabel(s, 'ko')} ({sourceLabel(s, 'en')})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            <span>{lang === 'en' ? 'Filter' : '조회'}</span>
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: lang === 'en' ? 'Total Orders' : '총 주문', value: `${totals.orders || 0}${lang === 'en' ? '' : '건'}` },
            { label: lang === 'en' ? 'Paid Revenue' : '결제 매출', value: formatKRW(totals.revenue) },
            { label: lang === 'en' ? 'Unpaid' : '미결제', value: `${totals.unpaid || 0}${lang === 'en' ? '' : '건'}` },
            { label: lang === 'en' ? 'Receipts Pending' : '입금확인 대기', value: `${totals.receiptPending || 0}${lang === 'en' ? '' : '건'}` },
          ].map(k => (
            <div key={k.label} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '18px', border: '1px solid #e4e4e7' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>{k.label}</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px' }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e4e4e7', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>{lang === 'en' ? 'Channel' : '채널'}</th>
                  <th style={{ padding: '14px 16px' }}>{lang === 'en' ? 'Orders' : '주문수'}</th>
                  <th style={{ padding: '14px 16px' }}>{lang === 'en' ? 'Paid' : '결제완료'}</th>
                  <th style={{ padding: '14px 16px' }}>{lang === 'en' ? 'Unpaid' : '미결제'}</th>
                  <th style={{ padding: '14px 16px' }}>{lang === 'en' ? 'Revenue' : '매출'}</th>
                  <th style={{ padding: '14px 16px' }}>{lang === 'en' ? 'Refunded' : '환불'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>불러오는 중...</td></tr>
                ) : bySource.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>데이터가 없습니다.</td></tr>
                ) : bySource.map(r => (
                  <tr key={r.source} style={{ borderBottom: '1px solid #f0f0f2' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700 }}>{sourceLabel(r.source, 'ko')} ({sourceLabel(r.source, 'en')})</td>
                    <td style={{ padding: '14px 16px' }}>{r.order_count}</td>
                    <td style={{ padding: '14px 16px', color: '#166534', fontWeight: 600 }}>{r.paid_count}</td>
                    <td style={{ padding: '14px 16px', color: r.unpaid_count > 0 ? '#b45309' : '#52525b', fontWeight: 600 }}>{r.unpaid_count}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>{formatKRW(r.revenue_paid)}</td>
                    <td style={{ padding: '14px 16px' }}>{formatKRW(r.refunded_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
