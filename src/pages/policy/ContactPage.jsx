import React from 'react';
import { Link } from 'wouter';
import { business } from '../../config/business.js';
import { PolicyLayout, Section } from './PolicyLayout.jsx';

export function ContactPage() {
  return <PolicyLayout title="고객센터">
    <Section title="주문·결제·배송 및 환불 문의"><p><a href={`tel:${business.phone}`}>{business.phoneFormatted}</a><br /><a href={`mailto:${business.email}`}>{business.email}</a><br />{business.businessHours}</p><p>주문번호, 구매자 성함, 연락 가능한 회신 방법과 문의 내용을 알려주세요. 카드번호 전체·비밀번호·주민등록번호는 보내지 마세요. 상담시간 외에도 이메일로 요청할 수 있습니다.</p></Section>
    <Section title="결제 확인"><p>주문내역에서 결제 상태를 확인할 수 있습니다. 결제 앱의 승인 내역과 쇼핑몰 주문 상태가 다르면 중복 결제하기 전에 고객센터에 주문번호와 결제 시각을 알려주세요.</p></Section>
    <Section title="취소와 반품"><p>전화 또는 이메일로 신청할 수 있습니다. 반송 주소와 수거 방법은 접수 후 안내합니다. <Link href="/refund-exchange">요청 기한·배송비 부담·환불 시점 확인하기</Link></p></Section>
    <Section title="개인정보와 분쟁"><p>회원 탈퇴 및 개인정보 열람·정정·삭제·처리정지 요청도 고객센터로 접수할 수 있습니다. 구매 분쟁은 <a href="https://www.ccn.go.kr" target="_blank" rel="noopener noreferrer">1372 소비자상담센터</a>에 상담할 수 있습니다.</p></Section>
  </PolicyLayout>;
}
