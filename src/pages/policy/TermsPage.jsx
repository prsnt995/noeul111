import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { FileText, ArrowLeft } from 'lucide-react';

export function TermsPage() {
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
            <FileText size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              TERMS OF SERVICE
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            전자상거래 표준 이용약관
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            본 약관은 주식회사 페리어스엔지(이하 "회사")가 운영하는 인터넷 쇼핑몰 NOEUL(https://noeul.me, 이하 "몰")에서 제공하는 전자상거래 관련 서비스(이하 "서비스")를 이용함에 있어 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.8125rem', color: '#68686d' }}>
            <span>시행일자: 2026년 9월 17일</span>
          </div>
        </div>

        {/* Policy Body */}
        <div className="policy-body" style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#c7c7cc' }}>
          
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제1조 (목적)</h2>
            <p>
              본 약관은 주식회사 페리어스엔지가 운영하는 온라인 쇼핑몰 NOEUL에서 제공하는 재화 또는 용역(이하 "상품 등")을 이용함에 있어 쇼핑몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제2조 (정의)</h2>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>"몰":</strong> 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
              <li><strong>"이용자":</strong> "몰"에 접속하여 본 약관에 따라 "몰"이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
              <li><strong>"회원":</strong> "몰"에 개인정보를 제공하여 회원등록을 한 자로서, "몰"의 정보를 지속적으로 제공받으며 "몰"이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제3조 (약관의 게시와 개정)</h2>
            <p>
              "몰"은 본 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 전화번호, 이메일주소, 사업자등록번호, 통신판매업신고번호 등을 이용자가 알 수 있도록 사이트의 초기 서비스화면(전면)에 게시합니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제4조 (회원가입 및 계정관리)</h2>
            <p>
              이용자는 "몰"이 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다. 회원은 등록사항에 변경이 있는 경우 지체 없이 "몰"에 회원정보 수정 등의 방법으로 그 변경사항을 알려야 합니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제5조 (구매신청 및 계약성립)</h2>
            <p>
              "몰" 이용자는 상품의 선택, 성명·주소·전화번호·이메일주소 등의 입력, 결제방법의 선택 등을 통하여 구매를 신청합니다. 구매계약은 "몰"의 승낙이 이용자에게 수신확인통지형태로 도달한 시점에 성립합니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제6조 (대금지급방법 및 배송)</h2>
            <p>
              "몰"에서 구매한 재화 또는 용역에 대한 대금지급방법은 신용카드 결제, 간편결제(토스페이, 카카오페이 등), 무통장 입금 등으로 가능합니다. 배송은 결제 확인 후 지정된 배송 절차에 따라 진행됩니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제7조 (청약철회, 환불 및 교환)</h2>
            <p>
              "몰"과 재화 등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 재화를 공급받은 날로부터 7일 이내에 청약의 철회(교환 및 반품)를 할 수 있습니다. 상세 조건은 환불 및 교환 정책에 따릅니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제8조 (저작권의 귀속 및 이용제한)</h2>
            <p>
              "몰"이 작성한 저작물에 대한 저작권 기타 지적재산권은 "몰"에 귀속합니다. 이용자는 "몰"을 이용함으로써 얻은 정보 중 "몰"에게 지적재산권이 귀속된 정보를 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>제9조 (사업자 및 대표 연락처)</h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>상호:</strong> 주식회사 페리어스엔지</li>
                <li><strong>대표자:</strong> 박기성</li>
                <li><strong>사업자등록번호:</strong> 610-88-00182</li>
                <li><strong>주소:</strong> 경기도 파주시 송학2길 62-3, 1층(야당동)</li>
                <li><strong>전화:</strong> 01083615305</li>
                <li><strong>이메일:</strong> noeulenterprises@gmail.com</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default TermsPage;
