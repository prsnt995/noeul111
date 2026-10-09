import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { PageHeader, DataTable, ErrorBanner, ConfirmModal } from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  ORDER_DATE_PERIODS,
  toKstDateString,
  toKstDateTimeString,
  getExpenseCategoryLabel,
  getPaymentMethodLabel,
  calculateBusinessMetrics,
  generateBusinessExcelWorkbook,
  parseExpensesFromExcel,
} from '../../utils/businessAccounting.js';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Edit,
  Trash2,
  X,
  Check,
  Building2,
  User,
  ShoppingBag,
} from 'lucide-react';

export function AdminBusinessPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Active Tab: 'kpi' | 'orders' | 'category' | 'expenses' | 'inventory' | 'pnl'
  const [activeTab, setActiveTab] = useState('kpi');

  // Filter state
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('all');

  // Data states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [categoryReports, setCategoryReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [orderEditModalOpen, setOrderEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Form states for Expense
  const [expenseForm, setExpenseForm] = useState({
    expense_date: toKstDateString(new Date()),
    category: 'product_purchase',
    description: '',
    amount: '',
    payment_method: 'card',
    order_id: '',
    notes: '',
  });

  // Form states for Order Customer Edit
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    postal_code: '',
    address: '',
    detail_address: '',
    shipping_memo: '',
  });

  // Primary loader
  const loadAllBusinessData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const qParams = new URLSearchParams();
      if (period) qParams.set('period', period);
      if (customFrom) qParams.set('from', customFrom);
      if (customTo) qParams.set('to', customTo);

      const [sumRes, ordRes, catRes, expRes, prodRes] = await Promise.all([
        adminApi.get(`/admin/business/summary?${qParams.toString()}`),
        adminApi.get(`/admin/business/orders?${qParams.toString()}&pageSize=100`),
        adminApi.get(`/admin/business/category-reports?${qParams.toString()}`),
        adminApi.get(`/admin/expenses?${qParams.toString()}&pageSize=100`),
        adminApi.get('/admin/products?limit=100').catch(() => ({ data: [] })),
      ]);

      if (sumRes.success) setSummaryData(sumRes.data);
      if (ordRes.data) {
        setOrders(ordRes.data);
        setOrdersTotal(ordRes.total ?? ordRes.data.length);
      }
      if (catRes.success) setCategoryReports(catRes.data?.reports || []);
      if (expRes.data) {
        setExpenses(expRes.data);
        setExpensesTotal(expRes.total ?? expRes.data.length);
      }
      if (prodRes.data) {
        setProducts(prodRes.data);
      }

      // Load all available categories
      try {
        const categoriesRes = await adminApi.get('/admin/categories');
        if (categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch {
        // Fallback to reports categories
        if (catRes.data?.reports) {
          setCategories(catRes.data.reports.map((r) => ({ id: r.category_id, name_ko: r.category_name, slug: r.category_slug })));
        }
      }
    } catch (err) {
      console.error('Failed to load business management data:', err);
      setErrorMsg(err.message || '경영 관리 데이터를 불러오지 못했습니다.');
      showToast(err.message || '데이터 로드 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBusinessData();
  }, [period, customFrom, customTo]);

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      const metrics = summaryData?.metrics || calculateBusinessMetrics({ orders, expenses, products });
      const currentPeriodLabel = ORDER_DATE_PERIODS.find((p) => p.id === period)?.ko || '전체 기간';
      const periodLabelWithDates = period === 'custom' && customFrom && customTo
        ? `${customFrom} ~ ${customTo}`
        : currentPeriodLabel;

      const wb = generateBusinessExcelWorkbook({
        summaryMetrics: metrics,
        orders,
        categories: categories.length ? categories : categoryReports.map(r => ({ id: r.category_id, name_ko: r.category_name, slug: r.category_slug })),
        expenses,
        products,
        datePeriodLabel: periodLabelWithDates,
      });

      const todayStr = toKstDateString(new Date());
      const fileName = `NOEUL_경영관리보고서_${todayStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`Excel 보고서가 성공적으로 다운로드되었습니다. (${fileName})`, 'success');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('Excel 내보내기 중 오류가 발생했습니다: ' + err.message, 'error');
    }
  };

  // Expense Modal Handlers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      expense_date: toKstDateString(new Date()),
      category: 'product_purchase',
      description: '',
      amount: '',
      payment_method: 'card',
      order_id: '',
      notes: '',
    });
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (item) => {
    setEditingExpense(item);
    setExpenseForm({
      expense_date: toKstDateString(item.expense_date),
      category: item.category || 'other_expenses',
      description: item.description || '',
      amount: String(item.amount || ''),
      payment_method: item.payment_method || 'card',
      order_id: item.order_id || '',
      notes: item.notes || '',
    });
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const amt = Number(expenseForm.amount);
    if (!amt || amt <= 0) {
      showToast('유효한 지출 금액을 입력해주세요.', 'error');
      return;
    }
    if (!expenseForm.expense_date) {
      showToast('지출 일자를 선택해주세요.', 'error');
      return;
    }

    try {
      if (editingExpense) {
        await adminApi.put(`/admin/expenses/${editingExpense.id}`, {
          ...expenseForm,
          amount: amt,
        });
        showToast('지출 내역이 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/expenses', {
          ...expenseForm,
          amount: amt,
        });
        showToast('신규 지출이 등록되었습니다.', 'success');
      }
      setExpenseModalOpen(false);
      loadAllBusinessData();
    } catch (err) {
      showToast(err.message || '지출 저장 실패', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await adminApi.delete(`/admin/expenses/${id}`);
      showToast('지출 내역이 삭제되었습니다.', 'success');
      setDeleteConfirmId(null);
      loadAllBusinessData();
    } catch (err) {
      showToast(err.message || '지출 삭제 실패', 'error');
    }
  };

  // Excel Import File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const result = parseExpensesFromExcel(buffer);
        setImportPreview(result);
        setImportModalOpen(true);
      } catch (err) {
        showToast('Excel 파일을 읽는 중 오류가 발생했습니다: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.validRows?.length) {
      showToast('가져올 유효한 데이터가 없습니다.', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const res = await adminApi.post('/admin/expenses/bulk', {
        items: importPreview.validRows,
      });
      if (res.success) {
        showToast(`총 ${res.count || importPreview.validRows.length}건의 지출 내역을 성공적으로 등록했습니다.`, 'success');
        setImportModalOpen(false);
        setImportPreview(null);
        loadAllBusinessData();
      }
    } catch (err) {
      showToast(err.message || 'Excel 일괄 등록 실패', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Order Edit Handlers
  const handleOpenEditOrder = (order) => {
    setEditingOrder(order);
    setOrderForm({
      customer_name: order.customer_name || order.address?.recipient || '',
      customer_phone: order.customer_phone || order.address?.phone || '',
      postal_code: order.postal_code || order.address?.postal_code || '',
      address: order.address?.address || order.address || '',
      detail_address: order.address?.detail_address || order.detail_address || '',
      shipping_memo: order.address?.shipping_memo || order.shipping_memo || '',
    });
    setOrderEditModalOpen(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await adminApi.patch(`/admin/orders/${editingOrder.id}/customer-details`, orderForm);
      showToast(`주문 #${editingOrder.order_number}의 고객 배송 정보가 수정되었습니다.`, 'success');
      setOrderEditModalOpen(false);
      loadAllBusinessData();
    } catch (err) {
      showToast(err.message || '주문 정보 수정 실패', 'error');
    }
  };

  // Filtered views
  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) =>
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.includes(q)) ||
        (o.items || []).some((it) => (it.product_name_ko && it.product_name_ko.toLowerCase().includes(q)) || (it.product_sku && it.product_sku.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [orders, searchQuery]);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (selectedExpenseCategory !== 'all') {
      list = list.filter((e) => e.category === selectedExpenseCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) =>
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.order_id && e.order_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [expenses, selectedExpenseCategory, searchQuery]);

  const activeCategoryReport = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return categoryReports.find((r) => r.category_slug?.toLowerCase() === selectedCategorySlug.toLowerCase() || String(r.category_id) === String(selectedCategorySlug));
  }, [categoryReports, selectedCategorySlug]);

  const metrics = summaryData?.metrics || calculateBusinessMetrics({ orders, expenses, products });

  return (
    <AdminLayout activePage="business" crumbs={[{ label: '경영 관리 (Business & Excel)', href: '/admin/business' }]}>
      <PageHeader
        ko="경영 관리 & 회계 시스템"
        en="Business Management & Accounting"
        desc="주문 자동 기록, 카테고리별 보고서, 지출 관리, 실시간 재고 추적 및 Excel(.xlsx) 연동"
        actions={(
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              className="adm-btn adm-btn-secondary"
              style={{
                backgroundColor: '#107c41',
                color: '#ffffff',
                borderColor: '#0e6b37',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="현재 기준 모든 주문, 카테고리, 지출, 재고, 손익계산서를 다중 시트 Excel로 내보냅니다."
            >
              <FileSpreadsheet size={16} aria-hidden />
              <span>Excel 내보내기 (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="adm-btn adm-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Excel 양식 파일을 업로드하여 지출 내역을 일괄 등록합니다."
            >
              <Upload size={16} aria-hidden />
              <span>Excel 지출 가져오기</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="adm-btn adm-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} aria-hidden />
              <span>신규 지출 등록</span>
            </button>

            <button
              type="button"
              onClick={loadAllBusinessData}
              className="adm-btn"
              title="새로고침"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={16} className={loading ? 'adm-spin' : ''} aria-hidden />
            </button>
          </div>
        )}
      />

      <ErrorBanner message={errorMsg} onRetry={loadAllBusinessData} />

      {/* Date Period Filter Bar */}
      <div
        className="adm-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#52525b', marginRight: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={15} /> 기간 기준 (KST):
          </span>
          {ORDER_DATE_PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`adm-btn ${period === p.id ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
              style={{
                fontSize: '0.8rem',
                padding: '4px 10px',
                height: 'auto',
                minHeight: '30px',
              }}
            >
              {p.ko}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="adm-input"
              style={{ padding: '4px 8px', fontSize: '0.85rem' }}
            />
            <span style={{ color: '#71717a' }}>~</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="adm-input"
              style={{ padding: '4px 8px', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e4e4e7',
          gap: '8px',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {[
          { id: 'kpi', label: '📊 경영 대시보드', desc: '매출, 순익, 핵심 지표' },
          { id: 'orders', label: '📦 주문 관리 & 당일 주문', desc: '주문 마스터 및 실시간 주문' },
          { id: 'category', label: '🏷️ 카테고리별 리포트', desc: '품목별 분리 집계 리포트' },
          { id: 'expenses', label: '💸 지출 관리', desc: '원가, 운영비, 생활비 관리' },
          { id: 'inventory', label: '📋 재고 현황 & 자산', desc: '품목/사이즈별 재고 및 품절임박' },
          { id: 'pnl', label: '📈 손익 계산서 (P&L)', desc: '공식 손익 분석 및 추정 부가세' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#18181b' : '#71717a',
              borderBottom: activeTab === tab.id ? '2px solid #18181b' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>{tab.label}</span>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: KPI Dashboard */}
      {activeTab === 'kpi' && (
        <div>
          {/* Top 6 Financial Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Total Net Sales */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>총 매출액 (Total Revenue)</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18181b', margin: 0 }}>
                {formatKRW(metrics.totalRevenue)}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                결제 완료 {metrics.paidOrdersCount}건 (상품 + 배송비)
              </p>
            </div>

            {/* Estimated Gross Profit */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>매출총이익 (Gross Profit)</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: 0 }}>
                {formatKRW(metrics.estimatedGrossProfit)}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                매출원가(사입비): {formatKRW(metrics.cogs)}
              </p>
            </div>

            {/* Operating Expenses */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>사업 운영비 (Operating Exp.)</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
                  <CreditCard size={16} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>
                {formatKRW(metrics.operatingExpenses)}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                택배/포장/마케팅/사무실 등 합계
              </p>
            </div>

            {/* Estimated Net Profit */}
            <div className="adm-card" style={{ padding: '20px', border: '2px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>추정 영업순이익 (Net Profit)</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: metrics.estimatedNetProfit >= 0 ? '#16a34a' : '#dc2626', margin: 0 }}>
                {formatKRW(metrics.estimatedNetProfit)}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                {metrics.totalRevenue > 0 ? `이익률: ${((metrics.estimatedNetProfit / metrics.totalRevenue) * 100).toFixed(1)}%` : '매출총이익 - 운영비'}
              </p>
            </div>

            {/* Shipping Comparison (1-time count verified) */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>배송비 수입 vs 택배 지출</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                  <Truck size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.85rem', color: '#52525b' }}>배송비 수입:</span>
                <strong style={{ fontSize: '1.1rem', color: '#059669' }}>{formatKRW(metrics.shippingRevenue)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#52525b' }}>택배비 지출:</span>
                <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>{formatKRW(metrics.shippingDeliveryExpenses)}</strong>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '6px', marginBottom: 0 }}>
                * 배송비는 주문당 1회만 정확히 집계됨
              </p>
            </div>

            {/* Total Inventory Asset Value */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>재고 자산 가치 (Inventory Value)</span>
                <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#e11d48' }}>
                  <Package size={16} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18181b', margin: 0 }}>
                {formatKRW(metrics.totalInventoryRetailValue)}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                총 보유 수량: {metrics.totalInventoryUnits}개 / 품절임박 {metrics.lowStockCount}품목
              </p>
            </div>
          </div>

          {/* Secondary Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Order Status Breakdown */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={18} /> 주문 현황 분석 ({period.toUpperCase()})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block' }}>총 주문 접수</span>
                  <strong style={{ fontSize: '1.25rem', color: '#18181b' }}>{metrics.totalOrdersCount}건</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>결제 완료 주문</span>
                  <strong style={{ fontSize: '1.25rem', color: '#166534' }}>{metrics.paidOrdersCount}건</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block' }}>입금 대기 주문</span>
                  <strong style={{ fontSize: '1.25rem', color: '#92400e' }}>{metrics.pendingOrdersCount}건</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#991b1b', display: 'block' }}>취소 및 환불</span>
                  <strong style={{ fontSize: '1.25rem', color: '#991b1b' }}>{metrics.canceledOrdersCount + metrics.refundedOrdersCount}건</strong>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="adm-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={18} /> 비용 및 지출 분류 현황
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const amt = metrics.expenseBreakdown?.[cat.id] || 0;
                  return (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: cat.isPersonal ? '#7c3aed' : cat.isTax ? '#b45309' : '#3f3f46' }}>
                        {cat.ko} {cat.isPersonal && '(개인)'} {cat.isTax && '(세무)'}:
                      </span>
                      <strong>{formatKRW(amt)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Orders Master (All & Today's Orders) */}
      {activeTab === 'orders' && (
        <div className="adm-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                주문 목록 ({period === 'today' ? "오늘의 주문 (Today's Orders)" : ORDER_DATE_PERIODS.find(p => p.id === period)?.ko || '전체 주문'})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '4px 0 0 0' }}>
                총 {filteredOrders.length}건 / KST(한국 표준시) 기준 / 배송비는 주문당 1회만 정확히 합산됩니다.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                <input
                  type="text"
                  placeholder="주문번호, 고객명, 연락처 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="adm-input"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>주문일시 (KST)</th>
                  <th>고객정보</th>
                  <th>주문 품목 내역</th>
                  <th>상품소계</th>
                  <th>배송비 (1회)</th>
                  <th>총 결제금액</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
                      해당 기간에 등록된 주문 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.order_number || o.id}</strong>
                      </td>
                      <td style={{ color: '#52525b' }}>
                        {toKstDateTimeString(o.created_at)}
                      </td>
                      <td>
                        <div><strong>{o.customer_name || o.address?.recipient || '고객'}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{o.customer_phone || o.address?.phone || '-'}</div>
                      </td>
                      <td>
                        {(o.items || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                            • {it.product_name_ko || it.product_sku} ({it.size || 'FREE'}/{it.color || '단일'}) × {it.quantity}개
                          </div>
                        ))}
                      </td>
                      <td>{formatKRW(o.subtotal)}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>
                        {formatKRW(o.shipping_fee ?? o.shipping ?? 0)}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>{formatKRW(o.total_amount ?? o.amount)}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: ['paid', 'processing', 'shipped', 'delivered'].includes(o.order_status || o.status) ? '#ecfdf5' : '#fffbeb',
                            color: ['paid', 'processing', 'shipped', 'delivered'].includes(o.order_status || o.status) ? '#059669' : '#b45309',
                          }}
                        >
                          {o.order_status || o.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenEditOrder(o)}
                          className="adm-btn adm-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="고객명, 연락처, 배송지 수정"
                        >
                          <Edit size={12} /> 수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Category Reports */}
      {activeTab === 'category' && (
        <div>
          {/* Category Selection Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategorySlug('all')}
              className={`adm-btn ${selectedCategorySlug === 'all' ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
            >
              전체 카테고리 요약
            </button>
            {categoryReports.map((cat) => (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => setSelectedCategorySlug(cat.category_slug || String(cat.category_id))}
                className={`adm-btn ${selectedCategorySlug === (cat.category_slug || String(cat.category_id)) ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                {cat.category_name} ({cat.items_count}개 판매)
              </button>
            ))}
          </div>

          {/* If All Categories Selected: Summary Cards & Tables */}
          {selectedCategorySlug === 'all' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {categoryReports.map((r) => (
                <div key={r.category_id} className="adm-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{r.category_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#71717a' }}>주문 {r.orders_count}건</span>
                  </div>
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ fontSize: '0.85rem', color: '#52525b' }}>총 판매 수량: <strong>{r.items_count}개</strong></div>
                    <div style={{ fontSize: '0.85rem', color: '#52525b', marginTop: '4px' }}>
                      카테고리 순매출액: <strong style={{ color: '#059669', fontSize: '1.05rem' }}>{formatKRW(r.total_subtotal)}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategorySlug(r.category_slug || String(r.category_id))}
                    className="adm-btn adm-btn-secondary"
                    style={{ width: '100%', fontSize: '0.8rem', marginTop: '8px' }}
                  >
                    상세 판매 내역 조회 ({r.items.length}개)
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Specific Category Report View */
            activeCategoryReport && (
              <div className="adm-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#18181b' }}>
                      {activeCategoryReport.category_name} 카테고리 상세 보고서
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '4px 0 0 0' }}>
                      총 판매 수량 {activeCategoryReport.items_count}개 / 순매출 합계 {formatKRW(activeCategoryReport.total_subtotal)}
                      <br />
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        * 본 리포트의 주문 배송비는 정보 참조용으로만 표시되며, 카테고리 매출/순익에 중복 가산되지 않습니다.
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategorySlug('all')}
                    className="adm-btn adm-btn-secondary"
                  >
                    목록으로 돌아가기
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>원 주문번호</th>
                        <th>주문일시(KST)</th>
                        <th>고객명</th>
                        <th>고객연락처</th>
                        <th>상품명</th>
                        <th>SKU</th>
                        <th>사이즈</th>
                        <th>수량</th>
                        <th>개별단가</th>
                        <th>상품소계</th>
                        <th>주문 배송비 (참조용)</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCategoryReport.items.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#a1a1aa' }}>
                            이 카테고리에서 판매된 상품이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        activeCategoryReport.items.map((it, idx) => (
                          <tr key={idx}>
                            <td><strong>{it.order_number}</strong></td>
                            <td style={{ color: '#52525b' }}>{it.created_at_kst}</td>
                            <td>{it.customer_name}</td>
                            <td>{it.customer_phone}</td>
                            <td><strong>{it.product_name}</strong></td>
                            <td style={{ color: '#71717a' }}>{it.sku}</td>
                            <td>
                              <span style={{ padding: '2px 6px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontWeight: 600 }}>
                                {it.size}
                              </span>
                            </td>
                            <td><strong>{it.quantity}개</strong></td>
                            <td>{formatKRW(it.price)}</td>
                            <td><strong style={{ color: '#059669' }}>{formatKRW(it.subtotal)}</strong></td>
                            <td style={{ color: '#71717a', fontSize: '0.75rem' }}>
                              {formatKRW(it.order_shipping_fee)} (참고)
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{it.order_status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 4: Expense Management */}
      {activeTab === 'expenses' && (
        <div className="adm-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>지출 내역 관리</h3>
              <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '4px 0 0 0' }}>
                총 {filteredExpenses.length}건 등록됨 / 대표자 생활비는 개인 지출로 자동 분리됩니다.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedExpenseCategory}
                onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                className="adm-input"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">전체 지출 분류</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.ko} {c.isPersonal ? '(개인생활비)' : ''}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleOpenAddExpense}
                className="adm-btn adm-btn-primary"
                style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> 지출 추가
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>지출일자</th>
                  <th>분류</th>
                  <th>내역 설명</th>
                  <th>금액 (KRW)</th>
                  <th>결제수단</th>
                  <th>관련 주문</th>
                  <th>비고/메모</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
                      등록된 지출 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ color: '#52525b', fontWeight: 500 }}>
                        {toKstDateString(exp.expense_date)}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: exp.category === 'living_expenses' ? '#f5f3ff' : exp.category === 'taxes_vat' ? '#fef3c7' : '#f4f4f5',
                            color: exp.category === 'living_expenses' ? '#7c3aed' : exp.category === 'taxes_vat' ? '#b45309' : '#18181b',
                          }}
                        >
                          {getExpenseCategoryLabel(exp.category, 'ko')}
                        </span>
                      </td>
                      <td><strong>{exp.description}</strong></td>
                      <td>
                        <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>
                          {formatKRW(exp.amount)}
                        </strong>
                      </td>
                      <td style={{ color: '#52525b' }}>
                        {getPaymentMethodLabel(exp.payment_method, 'ko')}
                      </td>
                      <td style={{ color: '#71717a' }}>
                        {exp.order_id || '-'}
                      </td>
                      <td style={{ color: '#71717a' }}>
                        {exp.notes || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(exp)}
                            className="adm-btn adm-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="adm-btn adm-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Inventory Tracking */}
      {activeTab === 'inventory' && (
        <div className="adm-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>상품 및 사이즈별 재고 추적</h3>
              <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '4px 0 0 0' }}>
                총 보유 재고: {metrics.totalInventoryUnits}개 / 총 자산가치: {formatKRW(metrics.totalInventoryRetailValue)}
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>SKU</th>
                  <th>색상</th>
                  <th>사이즈</th>
                  <th>현재 재고</th>
                  <th>주문 예약</th>
                  <th>실 가용 재고</th>
                  <th>판매 단가</th>
                  <th>재고 자산 가치</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#a1a1aa' }}>
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.flatMap((p) => {
                    const variants = p.variants || p.product_variants || [];
                    const price = Number(p.discount_price || p.price) || 0;
                    if (!variants.length) {
                      return [
                        <tr key={p.id}>
                          <td><strong>{p.name_ko || p.name}</strong></td>
                          <td>{p.sku}</td>
                          <td>기본</td>
                          <td>FREE</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>{formatKRW(price)}</td>
                          <td>0원</td>
                          <td><span style={{ color: '#dc2626' }}>품절</span></td>
                        </tr>
                      ];
                    }
                    return variants.map((v) => {
                      const stock = Number(v.stock || 0);
                      const reserved = Number(v.reserved || 0);
                      const available = stock - reserved;
                      return (
                        <tr key={v.id || `${p.id}-${v.sku}`}>
                          <td><strong>{p.name_ko || p.name}</strong></td>
                          <td>{v.sku || p.sku}</td>
                          <td>{v.color || '단일'}</td>
                          <td>
                            <span style={{ padding: '2px 6px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontWeight: 600 }}>
                              {v.size || 'FREE'}
                            </span>
                          </td>
                          <td><strong>{stock}</strong></td>
                          <td style={{ color: '#71717a' }}>{reserved}</td>
                          <td style={{ color: available <= 5 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                            {available}
                          </td>
                          <td>{formatKRW(price)}</td>
                          <td>{formatKRW(stock * price)}</td>
                          <td>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: available <= 0 ? '#fee2e2' : available <= 5 ? '#fef3c7' : '#ecfdf5',
                                color: available <= 0 ? '#b91c1c' : available <= 5 ? '#b45309' : '#059669',
                              }}
                            >
                              {available <= 0 ? '품절' : available <= 5 ? '품절임박' : '정상'}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Profit & Loss Statement (손익계산서) */}
      {activeTab === 'pnl' && (
        <div className="adm-card" style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>손익 계산서 (Profit & Loss Statement)</h2>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '4px' }}>
              회사명: 노을 (NOEUL ENTERPRISES) | 기준 기간: {ORDER_DATE_PERIODS.find(p => p.id === period)?.ko || '전체'}
            </p>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <table className="adm-table" style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>항목 (Financial Item)</th>
                  <th style={{ textAlign: 'right' }}>금액 (KRW)</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>구성비</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#fafafa', fontWeight: 700 }}>
                  <td>I. 총 매출액 (Gross Revenue)</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.totalRevenue)}</td>
                  <td style={{ textAlign: 'right' }}>100.0%</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>1. 상품 판매 매출 (Product Sales)</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.productSalesRevenue)}</td>
                  <td style={{ textAlign: 'right' }}>{metrics.totalRevenue ? ((metrics.productSalesRevenue / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>2. 배송비 수입 (Shipping Revenue - 1회 계산)</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.shippingRevenue)}</td>
                  <td style={{ textAlign: 'right' }}>{metrics.totalRevenue ? ((metrics.shippingRevenue / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px', color: '#dc2626' }}>3. 할인 및 에누리 (Discounts)</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-{formatKRW(metrics.discountsTotal)}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{metrics.totalRevenue ? ((-metrics.discountsTotal / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>

                <tr style={{ backgroundColor: '#fafafa', fontWeight: 700 }}>
                  <td>II. 매출원가 (COGS - 상품 사입비)</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{formatKRW(metrics.cogs)}</td>
                  <td style={{ textAlign: 'right' }}>{metrics.totalRevenue ? ((metrics.cogs / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>

                <tr style={{ backgroundColor: '#eff6ff', fontWeight: 800 }}>
                  <td style={{ color: '#1d4ed8' }}>III. 매출총이익 (Gross Profit = 매출 - 원가)</td>
                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontSize: '1.05rem' }}>{formatKRW(metrics.estimatedGrossProfit)}</td>
                  <td style={{ textAlign: 'right', color: '#1d4ed8' }}>{metrics.totalRevenue ? ((metrics.estimatedGrossProfit / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>

                <tr style={{ backgroundColor: '#fafafa', fontWeight: 700 }}>
                  <td>IV. 판매비와 관리비 (Operating Expenses)</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{formatKRW(metrics.operatingExpenses)}</td>
                  <td style={{ textAlign: 'right' }}>{metrics.totalRevenue ? ((metrics.operatingExpenses / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 택배 및 배송 지출비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.shippingDeliveryExpenses)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 포장 및 부자재비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.expenseBreakdown?.packaging || 0)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 광고 및 마케팅비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.expenseBreakdown?.advertising_marketing || 0)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 사무실 및 일반 운영비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.expenseBreakdown?.office_expenses || 0)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 접대 및 식대비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.expenseBreakdown?.entertainment || 0)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '24px' }}>• 기타 사업 경비</td>
                  <td style={{ textAlign: 'right' }}>{formatKRW(metrics.expenseBreakdown?.other_expenses || 0)}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>

                <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 800 }}>
                  <td style={{ color: '#15803d', fontSize: '1.05rem' }}>V. 추정 영업순이익 (Estimated Net Profit)</td>
                  <td style={{ textAlign: 'right', color: '#15803d', fontSize: '1.15rem' }}>{formatKRW(metrics.estimatedNetProfit)}</td>
                  <td style={{ textAlign: 'right', color: '#15803d' }}>{metrics.totalRevenue ? ((metrics.estimatedNetProfit / metrics.totalRevenue) * 100).toFixed(1) + '%' : '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Separate Box for Personal Living & Taxes */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: '#475569' }}>
                [비영업 / 세무 및 가계 분리 항목 (참고)]
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>• 대표자 개인 생활비 (사업 비용 제외):</span>
                <strong>{formatKRW(metrics.livingExpenses)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>• 납부 세금 및 부가세 (세무 계정 별도 집계):</span>
                <strong>{formatKRW(metrics.taxesAndVat)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>• 매출 부가세 추정치 (매출 10% 참고 기준):</span>
                <strong style={{ color: '#b45309' }}>{formatKRW(metrics.estimatedVatOnSales)} (추정치)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Expense Add/Edit Modal */}
      {expenseModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="adm-card" style={{ width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setExpenseModalOpen(false)}
              style={{ position: 'absolute', right: 16, top: 16, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              {editingExpense ? '지출 내역 수정' : '신규 지출 등록'}
            </h3>

            <form onSubmit={handleSaveExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>지출 일자 *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>지출 분류 *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ko} {c.isPersonal ? '(개인생활비)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>지출 내역 설명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 동대문 도매 봄 신상 사입 대금"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>금액 (원) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="350000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>결제 수단</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.ko}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>관련 주문번호 (선택)</label>
                <input
                  type="text"
                  placeholder="예: NE-202610-001"
                  value={expenseForm.order_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, order_id: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>비고 / 메모</label>
                <textarea
                  rows={2}
                  placeholder="추가 세부 사항"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="adm-btn adm-btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                >
                  {editingExpense ? '수정 완료' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirm */}
      {deleteConfirmId && (
        <ConfirmModal
          open={!!deleteConfirmId}
          title="지출 내역 삭제"
          message="선택하신 지출 내역을 삭제하시겠습니까? 삭제된 내역은 손익 계산서에서 즉시 제외됩니다."
          confirmLabel="삭제"
          danger
          onConfirm={() => handleDeleteExpense(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* MODAL 3: Excel Import Preview Modal */}
      {importModalOpen && importPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="adm-card" style={{ width: '100%', maxWidth: '780px', padding: '24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Excel 지출 내역 일괄 등록 검토</h3>
                <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '4px 0 0 0' }}>
                  유효한 데이터: <strong>{importPreview.validRows.length}건</strong> | 오류 항목: <strong>{importPreview.invalidRows.length}건</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
              <table className="adm-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>행</th>
                    <th>일자</th>
                    <th>분류</th>
                    <th>내역 설명</th>
                    <th>금액 (KRW)</th>
                    <th>결제수단</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.validRows.slice(0, 50).map((r, idx) => (
                    <tr key={idx}>
                      <td>{r._row}</td>
                      <td>{r.expense_date}</td>
                      <td>{getExpenseCategoryLabel(r.category, 'ko')}</td>
                      <td>{r.description}</td>
                      <td><strong>{formatKRW(r.amount)}</strong></td>
                      <td>{getPaymentMethodLabel(r.payment_method, 'ko')}</td>
                      <td>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>정상</span>
                      </td>
                    </tr>
                  ))}
                  {importPreview.invalidRows.map((r, idx) => (
                    <tr key={`inv-${idx}`} style={{ backgroundColor: '#fef2f2' }}>
                      <td>{r._row}</td>
                      <td>{r.expense_date || '-'}</td>
                      <td>{r.category || '-'}</td>
                      <td>{r.description || '-'}</td>
                      <td>{r.amount || '-'}</td>
                      <td>{r.payment_method || '-'}</td>
                      <td>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{r._error}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.validRows.length > 50 && (
                <p style={{ fontSize: '0.75rem', color: '#71717a', textAlign: 'center', marginTop: '8px' }}>
                  * 미리보기는 상위 50개 항목만 표시되며, 총 {importPreview.validRows.length}건이 일괄 등록됩니다.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="adm-btn adm-btn-secondary"
                disabled={isImporting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="adm-btn adm-btn-primary"
                disabled={isImporting || importPreview.validRows.length === 0}
              >
                {isImporting ? '등록 중...' : `총 ${importPreview.validRows.length}건 일괄 등록 적용`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Order Customer Details Edit */}
      {orderEditModalOpen && editingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="adm-card" style={{ width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOrderEditModalOpen(false)}
              style={{ position: 'absolute', right: 16, top: 16, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              주문 고객 정보 수정
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '16px' }}>
              주문번호: <strong>{editingOrder.order_number}</strong> (주문 고유 ID는 영구 보존됩니다)
            </p>

            <form onSubmit={handleSaveOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>고객 수령인 이름</label>
                  <input
                    type="text"
                    required
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>고객 연락처</label>
                  <input
                    type="text"
                    required
                    value={orderForm.customer_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                    className="adm-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>우편번호</label>
                <input
                  type="text"
                  value={orderForm.postal_code}
                  onChange={(e) => setOrderForm({ ...orderForm, postal_code: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>기본 주소</label>
                <input
                  type="text"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>상세 주소</label>
                <input
                  type="text"
                  value={orderForm.detail_address}
                  onChange={(e) => setOrderForm({ ...orderForm, detail_address: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>배송 메모</label>
                <input
                  type="text"
                  value={orderForm.shipping_memo}
                  onChange={(e) => setOrderForm({ ...orderForm, shipping_memo: e.target.value })}
                  className="adm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOrderEditModalOpen(false)}
                  className="adm-btn adm-btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                >
                  수정 사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
