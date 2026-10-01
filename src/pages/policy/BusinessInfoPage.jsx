import React from 'react';
import { business } from '../../config/business.js';
import { PolicyLayout, Section, PolicyTable } from './PolicyLayout.jsx';

export function BusinessInfoPage() {
  return <PolicyLayout title="사업자 정보">
    <Section title="NOEUL 판매 및 운영 사업자"><PolicyTable headers={['항목', '정보']} rows={[
      ['상호', business.companyName], ['대표자', business.representative], ['사업자등록번호', business.businessNumber],
      ['법인등록번호', business.corporationNumber], ['사업장 주소', business.address],
      ['통신판매업 신고번호', business.ecommerceNumber], ['대표전화', business.phoneFormatted],
      ['고객센터 이메일', business.email], ['상담시간', business.businessHours], ['쇼핑몰', business.website],
    ]} /></Section>
    <Section title="거래 확인"><p>NOEUL의 상품 판매와 취소·환불에 대한 책임은 {business.companyName}에 있습니다. 토스페이먼츠는 결제대행 서비스를 제공합니다.</p><p><a href={business.businessLookupUrl} target="_blank" rel="noopener noreferrer">공정거래위원회 통신판매사업자 정보공개</a>에서 사업자등록번호 {business.businessNumber}로 조회할 수 있습니다.</p></Section>
  </PolicyLayout>;
}
