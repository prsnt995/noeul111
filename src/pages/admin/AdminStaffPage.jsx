import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  DataTable,
  ErrorBanner,
  ConfirmModal,
  StatusPill,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'editor',
    password: '',
    new_password: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/users/staff');
      if (res.success) setStaff(res.data);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setErrorMsg(err?.message || '스태프 목록을 불러오지 못했습니다.');
      showToast('스태프 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'editor',
      password: '',
      new_password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setIsEditMode(true);
    setEditingId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      password: '',
      new_password: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await adminApi.put(`/admin/users/staff/${editingId}`, formData);
        showToast('관리자 정보가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/users/staff', formData);
        showToast('새 관리자 계정이 생성되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/users/staff/${id}`);
      showToast('관리자 계정이 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchStaff();
    } catch (err) {
      showToast(err.message || '삭제 실패', 'error');
    }
  };

  const ROLE_PILL = {
    super_admin: { label: '최고관리자 (Super Admin)', status: 'cancelled' },
    admin: { label: '총괄관리자 (Admin)', status: 'processing' },
    editor: { label: '콘텐츠 에디터 (Editor)', status: 'paid' },
    order_manager: { label: '주문/배송 매니저 (Order Manager)', status: 'pending_payment' },
  };

  const columns = [
    {
      key: 'user',
      label: '이름 / 이메일 Name',
      render: (u) => (
        <div>
          <p style={{ fontWeight: 700, color: '#18181b', margin: 0 }}>{u.name}</p>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{u.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: '연락처 Phone',
      render: (u) => <span style={{ color: '#555' }}>{u.phone || '-'}</span>,
    },
    {
      key: 'role',
      label: '부여된 역할 Role',
      render: (u) => {
        const pill = ROLE_PILL[u.role] || { label: u.role, status: 'neutral' };
        return <StatusPill status={pill.status} label={pill.label} />;
      },
    },
    {
      key: 'created',
      label: '등록 일시 Created',
      render: (u) => (
        <span style={{ color: '#888', fontSize: '0.75rem' }}>{u.created_at?.split('T')[0] || u.created_at?.split(' ')[0]}</span>
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (u) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={() => openEditModal(u)} className="adm-btn" style={{ padding: '6px 10px', fontSize: '0.8125rem' }}>
            <Edit2 size={13} aria-hidden />
            <span>수정</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(u.id)}
            className="adm-btn"
            style={{ padding: '6px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
            aria-label={`${u.name} 삭제 Delete`}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout activePage="staff">
      <PageHeader
        ko="관리자 팀 & 권한 설정"
        en="Staff Roles"
        desc="역할별(최고관리자, 에디터, 주문 매니저) 권한 분리 및 관리자 계정 생성 — Google 로그인 후 allowlist 등록 방식"
        actions={(
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            <span>새 관리자 등록 New staff</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `스태프 로드 실패: ${errorMsg}` : ''} onRetry={fetchStaff} />

      {/* Roles Description Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {[
          { role: 'super_admin', title: 'SUPER ADMIN', desc: '모든 설정, 재무, 권한을 포함한 100% 최고 통제권' },
          { role: 'admin', title: 'ADMIN', desc: '상품, 주문, 프로모션 및 웹사이트 빌더 운영' },
          { role: 'editor', title: 'EDITOR', desc: '배너, 페이지, 블로그, 섹션 및 상품 콘텐츠 관리' },
          { role: 'order_manager', title: 'ORDER MANAGER', desc: '주문 상태 변경, 배송 운송장 번호 등록 및 CS' },
        ].map((r) => {
          const pill = ROLE_PILL[r.role];
          return (
            <div key={r.role} className="adm-card" style={{ padding: '16px' }}>
              <StatusPill status={pill.status} label={r.title} />
              <p style={{ fontSize: '0.8125rem', color: '#555', marginTop: '8px', marginBottom: 0, lineHeight: 1.4 }}>{r.desc}</p>
            </div>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        rows={staff}
        loading={loading}
        emptyTitle="등록된 관리자가 없습니다 No staff found"
        emptyDesc="새 관리자를 등록하세요. Google 로그인 후 이메일 allowlist에 추가됩니다."
        rowKey={(r) => r.id}
      />

      <ConfirmModal
        open={!!deleteId}
        title="관리자 삭제 Delete staff"
        desc="이 관리자 계정을 삭제하시겠습니까? 본인 계정과 마지막 최고관리자는 삭제할 수 없습니다."
        confirmLabel="삭제하기 Delete"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label={isEditMode ? '관리자 정보 및 권한 수정 Edit staff' : '새 관리자 계정 생성 New staff'} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2>
                {isEditMode ? '관리자 정보 및 권한 수정 Edit staff' : '새 관리자 계정 생성 New staff'}
              </h2>
              <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>
            <p className="adm-modal-sub">Google 로그인 후 이메일 allowlist에 등록되는 방식입니다. 비밀번호 필드는 무시됩니다.</p>

              <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">관리자 성함 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 홍길동 팀장"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">로그인 이메일 *</label>
                  <input
                    type="email"
                    required
                    disabled={isEditMode}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@noeul.kr"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {isEditMode ? '비밀번호 변경 (변경 시에만 입력)' : '초기 비밀번호 *'}
                  </label>
                  <input
                    type="password"
                    required={!isEditMode}
                    value={isEditMode ? formData.new_password : formData.password}
                    onChange={(e) => {
                      if (isEditMode) setFormData({ ...formData, new_password: e.target.value });
                      else setFormData({ ...formData, password: e.target.value });
                    }}
                    placeholder="••••••••"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">역할 및 권한 등급 (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="form-select"
                  >
                    <option value="super_admin">최고관리자 (Super Admin - 100% Full Access)</option>
                    <option value="admin">총괄관리자 (Admin - Operations & Products)</option>
                    <option value="editor">콘텐츠 에디터 (Editor - Website Builder, Pages, Banners)</option>
                    <option value="order_manager">주문/배송 매니저 (Order Manager - Orders & Shipping)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">연락처</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="form-input"
                  />
                </div>

                <div className="adm-modal-actions">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn" style={{ flex: 1 }}>
                    취소 Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary" style={{ flex: 1 }}>
                    저장하기 Save
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
    </AdminLayout>
  );
}
