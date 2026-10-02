import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  DataTable,
  ErrorBanner,
} from '../../components/admin/ui/index.js';
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
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
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
      setErrorMsg(err?.message || '');
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

  const columns = [
    {
      key: 'source',
      label: lang === 'en' ? 'Channel' : '채널 Channel',
      render: (r) => <strong>{sourceLabel(r.source, 'ko')} ({sourceLabel(r.source, 'en')})</strong>,
    },
    { key: 'orders', label: lang === 'en' ? 'Orders' : '주문수 Orders', render: (r) => r.order_count },
    { key: 'paid', label: lang === 'en' ? 'Paid' : '결제완료 Paid', render: (r) => <span style={{ color: '#166534', fontWeight: 600 }}>{r.paid_count}</span> },
    {
      key: 'unpaid',
      label: lang === 'en' ? 'Unpaid' : '미결제 Unpaid',
      render: (r) => <span style={{ color: r.unpaid_count > 0 ? '#b45309' : '#52525b', fontWeight: 600 }}>{r.unpaid_count}</span>,
    },
    { key: 'revenue', label: lang === 'en' ? 'Revenue' : '매출 Revenue', render: (r) => <strong>{formatKRW(r.revenue_paid)}</strong> },
    { key: 'refunded', label: lang === 'en' ? 'Refunded' : '환불 Refunded', render: (r) => formatKRW(r.refunded_amount) },
  ];

  return (
    <AdminLayout activePage="reports">
      <PageHeader
        ko="매출 리포트"
        en="Sales Reports"
        desc={lang === 'en' ? 'Totals, unpaid orders, receipts and refunds by channel.' : '채널별 매출 합계, 미결제, 입금확인 대기, 환불 현황'}
        actions={(
          <button type="button" onClick={handleCsv} className="adm-btn">
            <Download size={16} aria-hidden />
            <span>CSV 다운로드 Download</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `리포트 로드 실패: ${errorMsg}` : ''} onRetry={fetchReport} />

      <form
        onSubmit={handleSearch}
        className="adm-card adm-filter-bar"
        style={{ marginBottom: 12 }}
      >
        <div>
          <label className="adm-label" htmlFor="report-from">{lang === 'en' ? 'From' : '시작일 From'}</label>
          <input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="adm-input" />
        </div>
        <div>
          <label className="adm-label" htmlFor="report-to">{lang === 'en' ? 'To' : '종료일 To'}</label>
          <input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="adm-input" />
        </div>
        <div>
          <label className="adm-label" htmlFor="report-source">{lang === 'en' ? 'Channel' : '채널 Channel'}</label>
          <select id="report-source" value={source} onChange={(e) => setSource(e.target.value)} className="adm-select">
            <option value="all">{lang === 'en' ? 'All channels' : '전체 채널'}</option>
            {ORDER_SOURCES.map(s => (
              <option key={s} value={s}>{sourceLabel(s, 'ko')} ({sourceLabel(s, 'en')})</option>
            ))}
          </select>
        </div>
        <button type="submit" className="adm-btn adm-btn-primary" style={{ alignSelf: 'flex-end' }}>
          <Search size={14} aria-hidden />
          <span>{lang === 'en' ? 'Filter' : '조회'}</span>
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '12px' }}>
        {[
          { label: lang === 'en' ? 'Total Orders' : '총 주문 Orders', value: `${totals.orders || 0}${lang === 'en' ? '' : '건'}` },
          { label: lang === 'en' ? 'Paid Revenue' : '결제 매출 Revenue', value: formatKRW(totals.revenue) },
          { label: lang === 'en' ? 'Unpaid' : '미결제 Unpaid', value: `${totals.unpaid || 0}${lang === 'en' ? '' : '건'}` },
          { label: lang === 'en' ? 'Receipts Pending' : '입금확인 대기 Pending', value: `${totals.receiptPending || 0}${lang === 'en' ? '' : '건'}` },
        ].map(k => (
          <div key={k.label} className="adm-card" style={{ padding: '18px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>{k.label}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={bySource}
        loading={loading}
        emptyTitle={lang === 'en' ? 'No data.' : '데이터가 없습니다 No data'}
        emptyDesc={lang === 'en' ? 'Adjust the date range or channel.' : '기간이나 채널을 조정해 보세요.'}
        rowKey={(r) => r.source}
      />
    </AdminLayout>
  );
}
