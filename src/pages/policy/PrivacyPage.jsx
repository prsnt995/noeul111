import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Shield, ArrowLeft, Mail, Phone, Lock } from 'lucide-react';

export function PrivacyPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ backgroundColor: 'var(--bg-primary, #0b0b0c)', color: 'var(--text-primary, #f4f4f5)', minHeight: '100vh', padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navigation Back Link */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sunset, #e05638)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* Page Header */}
        <div style={{ borderBottom: '1px solid var(--border-color, #232328)', paddingBottom: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Shield size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL LEGAL POLICY
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            개인정보처리방침
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            주식회사 페리어스엔지(이하 "회사")는 회원님의 개인정보를 소중하게 생각하며, 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.8125rem', color: '#68686d' }}>
            <span>시행일자: 2026년 9월 17일</span>
            <span>|</span>
            <span>최종 수정일: 2026년 9월 17일</span>
          </div>
        </div>

        {/* Legal Policy Content */}
        <div className="policy-body" style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#c7c7cc' }}>
          
          {/* Section 1 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              1. 개인정보의 수집 항목 및 수집 방법
            </h2>
            <p style={{ marginBottom: '12px' }}>
              회사는 회원가입, 주문 처리, 고객 상담 및 서비스 제공을 위해 아래와 같은 минимальный 범위의 개인정보를 수집하고 있습니다.
            </p>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '10px' }}>가. 수집 항목</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>회원 가입 시:</strong> 이름, 이메일 주소, 비밀번호, 휴대폰 번호</li>
                <li><strong>상품 주문 및 배송 시:</strong> 수령인 이름, 수령인 연락처, 배송지 주소, 배송 요청사항</li>
                <li><strong>결제 진행 시:</strong> 무통장 입금자명, 결제 승인 기록 (카드번호 등 금융 정보는 토스페이먼츠 등 전자지급결제대행사에 안전하게 전송되며 회사 서버에 저장되지 않습니다)</li>
                <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 쿠키, IP 주소</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              2. 개인정보의 수집 및 이용 목적
            </h2>
            <p style={{ marginBottom: '12px' }}>
              수집한 개인정보는 다음의 목적을 위해 활용됩니다. 명시된 목적 외의 용도로는 사용되지 않으며 이용 목적이 변경될 시 사전 동의를 구할 예정입니다.
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>서비스 제공 및 계약 이행:</strong> 상품 배송, 결제 처리, 주문 내역 확인 및 청구서 발송</li>
              <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정이용 방지, 가입 의사 확인</li>
              <li><strong>고객 상담 및 분쟁 처리:</strong> 문의사항 답변, 공지사항 전달, 반품 및 교환 서비스 제공</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <p style={{ marginBottom: '12px' }}>
              원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
            </p>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li><strong>웹사이트 방문기록 (로그):</strong> 3개월 (통신비밀보호법)</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              4. 개인정보의 제3자 제공
            </h2>
            <p style={{ marginBottom: '12px' }}>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우나 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              5. 개인정보 처리 위탁
            </h2>
            <p style={{ marginBottom: '12px' }}>
              회사는 원활한 서비스 이행을 위해 다음과 같이 개인정보 처리 업무를 외부 전문업체에 위탁하여 운영하고 있습니다.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#18181c', color: '#ffffff' }}>
                    <th style={{ padding: '12px 16px', border: '1px solid #282830' }}>수탁업체</th>
                    <th style={{ padding: '12px 16px', border: '1px solid #282830' }}>위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>CJ대한통운 / 로젠택배 등 지정 택배사</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>상품 배송 업무</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>토스페이먼츠 주식회사</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>전자 결제 수단 제공 및 결제 대행</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              6. 이용자의 권리와 행사 방법
            </h2>
            <p>
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다. 이용자의 개인정보 조회, 수정을 위해서는 ‘마이페이지’를, 가입해지(동의철회)를 위해서는 고객센터로 연락하시면 지체 없이 조치하겠습니다.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              7. 개인정보 보호책임자
            </h2>
            <p style={{ marginBottom: '16px' }}>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>성명:</strong> 박기성 대표이사</div>
                <div><strong>소속/직책:</strong> 주식회사 페리어스엔지 개인정보 보호책임자</div>
                <div><strong>전화번호:</strong> 01083615305</div>
                <div><strong>이메일:</strong> noeulenterprises@gmail.com</div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1f1f24' }}>
              8. 개인정보 침해 신고 및 문의
            </h2>
            <p style={{ marginBottom: '12px' }}>
              개인정보 침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청 사이버수사과: (국번없이) 1301 (www.spo.go.kr)</li>
              <li>경찰청 사이버수사국: (국번없이) 182 (ecrm.police.go.kr)</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
