import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ShieldAlert, Plus, Edit2, Trash2, X, Shield, UserCheck } from 'lucide-react';

export function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get('/admin/users/staff');
      if (res.success) setStaff(res.data);
    } catch (err) {
      console.error('Fetch staff error:', err);
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
        await api.put(`/admin/users/staff/${editingId}`, formData);
        showToast('관리자 정보가 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/users/staff', formData);
        showToast('새 관리자 계정이 생성되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 관리자 계정을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/users/staff/${id}`);
      showToast('관리자 계정이 삭제되었습니다.', 'info');
      fetchStaff();
    } catch (err) {
      showToast(err.message || '삭제 실패', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: '최고관리자 (Super Admin)', bg: '#fef2f2', color: '#dc2626' };
      case 'admin':
        return { label: '총괄관리자 (Admin)', bg: '#ede9fe', color: '#7c3aed' };
      case 'editor':
        return { label: '콘텐츠 에디터 (Editor)', bg: '#e0f2fe', color: '#0369a1' };
      case 'order_manager':
        return { label: '주문/배송 매니저 (Order Manager)', bg: '#fef3c7', color: '#b45309' };
      default:
        return { label: role, bg: '#f4f4f5', color: '#71717a' };
    }
  };

  return (
    <AdminLayout activePage="staff">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>관리자 팀 & 권한 설정 (Staff Roles)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              역할별(최고관리자, 에디터, 주문 매니저) 권한 분리 및 관리자 계정 생성
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 관리자 등록</span>
          </button>
        </div>

        {/* Roles Description Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { role: 'super_admin', title: 'SUPER ADMIN', desc: '모든 설정, 재무, 권한을 포함한 100% 최고 통제권' },
            { role: 'admin', title: 'ADMIN', desc: '상품, 주문, 프로모션 및 웹사이트 빌더 운영' },
            { role: 'editor', title: 'EDITOR', desc: '배너, 페이지, 블로그, 섹션 및 상품 콘텐츠 관리' },
            { role: 'order_manager', title: 'ORDER MANAGER', desc: '주문 상태 변경, 배송 운송장 번호 등록 및 CS' },
          ].map((r, i) => (
            <div key={i} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>{r.title}</span>
              <p style={{ fontSize: '0.8125rem', color: '#555', marginTop: '4px', lineHeight: 1.4 }}>{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Staff Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>이름 / 이메일</th>
                  <th style={{ padding: '14px 16px' }}>연락처</th>
                  <th style={{ padding: '14px 16px' }}>부여된 역할 (Role)</th>
                  <th style={{ padding: '14px 16px' }}>등록 일시</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                      스태프 데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : (
                  staff.map((u) => {
                    const badge = getRoleBadge(u.role);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <p style={{ fontWeight: 700, color: '#18181b' }}>{u.name}</p>
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{u.email}</span>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#555' }}>
                          {u.phone || '-'}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              fontWeight: 700,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#888', fontSize: '0.75rem' }}>
                          {u.created_at?.split('T')[0] || u.created_at?.split(' ')[0]}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => openEditModal(u)}
                              style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit2 size={13} />
                              <span>수정</span>
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              style={{ padding: '6px 8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                margin: '60px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '관리자 정보 및 권한 수정' : '새 관리자 계정 생성'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

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

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-sunset)' }}>
                    저장하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
