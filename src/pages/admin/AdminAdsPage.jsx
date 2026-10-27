import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  DataTable,
  ErrorBanner,
  Empty,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { BarChart3, Download, Search, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

export function AdminAdsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState({
    spend: 0,
    revenue: 0,
    roas: 0,
    cpa: 0,
    ctr: 0,
    cpm: 0,
    conversions: 0,
    impressions: 0,
    clicks: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [platform, setPlatform] = useState('all');

  const fetchStats = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (platform && platform !== 'all') params.append('platform', platform);
      const res = await adminApi.get(`/admin/ads/stats?${params.toString()}`);
      if (res.success) {
        setStats(res.data?.stats || stats);
        setCampaigns(res.data?.campaigns || []);
        setLowStockAlerts(res.data?.lowStockAlerts || []);
      }
    } catch (err) {
      setErrorMsg(err?.message || '');
      showToast(err?.message || '광고 통계를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStats();
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (platform && platform !== 'all') params.append('platform', platform);
      params.append('format', 'csv');
      const r = await fetch(`/api/v1/admin/ads/stats?${params.toString()}`, { credentials: 'include' });
      if (!r.ok) throw new Error('CSV download failed');
      const text = await r.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ads-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err?.message || 'CSV 다운로드 실패', 'error');
    }
  };

  const kpiCards = [
    { label: '총 광고비', value: formatKRW(stats.spend), color: '#18181b', icon: DollarSign },
    { label: ' attributable 매출', value: formatKRW(stats.revenue), color: '#166534', icon: TrendingUp },
    { label: 'ROAS', value: `${(stats.roas || 0).toFixed(2)}x`, color: stats.roas >= 1 ? '#166534' : '#dc2626', icon: TrendingUp },
    { label: 'CPA', value: formatKRW(stats.cpa), color: '#71717a', icon: DollarSign },
    { label: 'CTR', value: `${(stats.ctr || 0).toFixed(2)}%`, color: '#71717a', icon: TrendingUp },
    { label: 'CPM', value: formatKRW(stats.cpm), color: '#71717a', icon: DollarSign },
    { label: '전환수', value: `${stats.conversions || 0}건`, color: '#71717a', icon: TrendingUp },
    { label: '노출수', value: `${(stats.impressions || 0).toLocaleString()}회`, color: '#71717a', icon: TrendingUp },
  ];

  const columns = [
    { key: 'campaign_name', label: '캠페인', render: (r) => <strong>{r.campaign_name}</strong> },
    { key: 'platform', label: '플랫폼', render: (r) => r.platform },
    { key: 'spend', label: '광고비', render: (r) => formatKRW(r.spend) },
    { key: 'revenue', label: '매출', render: (r) => formatKRW(r.revenue) },
    { key: 'roas', label: 'ROAS', render: (r) => `${(r.roas || 0).toFixed(2)}x` },
    { key: 'cpa', label: 'CPA', render: (r) => formatKRW(r.cpa) },
    { key: 'conversions', label: '전환', render: (r) => r.conversions },
    { key: 'status', label: '상태', render: (r) => <span style={{ color: r.status === 'active' ? '#166534' : '#71717a', fontWeight: 600 }}>{r.status}</span> },
  ];

  return (
    <AdminLayout activePage="ads">
      <PageHeader
        ko="광고 모니터링"
        desc="Meta 광고 성과 모니터링 - 광고비, 매출, ROAS, CPA"
        actions={(
          <button type="button" onClick={handleExportCsv} className="adm-btn">
            <Download size={16} aria-hidden />
            <span>CSV 다운로드</span>
          </button>
        )}
      />

      {lowStockAlerts.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} style={{ color: '#dc2626' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#dc2626' }}>재고 부족 알림</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
              {lowStockAlerts.map(a => `${a.product_name} (${a.sku}, ${a.stock}개 남음)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      <ErrorBanner message={errorMsg ? `광고 통계 로드 실패: ${errorMsg}` : ''} onRetry={fetchStats} />

      <form
        onSubmit={handleSearch}
        className="adm-card adm-filter-bar"
        style={{ marginBottom: 12 }}
      >
        <div>
          <label className="adm-label" htmlFor="ads-from">시작일</label>
          <input id="ads-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="adm-input" />
        </div>
        <div>
          <label className="adm-label" htmlFor="ads-to">종료일</label>
          <input id="ads-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="adm-input" />
        </div>
        <div>
          <label className="adm-label" htmlFor="ads-platform">플랫폼</label>
          <select id="ads-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="adm-select">
            <option value="all">전체 플랫폼</option>
            <option value="meta">Meta (FB+IG)</option>
            <option value="tiktok">TikTok</option>
            <option value="google">Google</option>
          </select>
        </div>
        <button type="submit" className="adm-btn adm-btn-primary" style={{ alignSelf: 'flex-end' }}>
          <Search size={14} aria-hidden />
          <span>조회</span>
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {kpiCards.map(k => (
          <div key={k.label} className="adm-card" style={{ padding: '18px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>{k.label}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={campaigns}
        loading={loading}
        emptyTitle="캠페인 데이터가 없습니다"
        emptyDesc="기간이나 플랫폼을 조정해 보세요."
        rowKey={(r) => r.campaign_id || r.campaign_name}
      />
    </AdminLayout>
  );
}