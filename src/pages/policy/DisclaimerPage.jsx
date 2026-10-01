import React from 'react';
import { PolicyLayout, Section } from './PolicyLayout.jsx';
export function DisclaimerPage() {
  return <PolicyLayout title="상품 및 서비스 안내">
    <Section title="상품 표시"><p>화면 설정과 촬영 환경에 따라 상품 색상이 다르게 보일 수 있습니다. 실측 방법에 따른 차이는 상품 상세에서 안내한 범위를 참고해주세요. 이러한 안내는 상품 하자나 표시·광고와 다른 상품에 대한 소비자의 청약철회 권리를 제한하지 않습니다.</p></Section>
    <Section title="책임과 소비자 권리"><p>회사는 관계 법령과 이용약관에 따른 상품 공급·환불·개인정보 보호 의무를 이행합니다. 회사의 고의·과실에 대한 책임을 일괄 면제하지 않습니다. 결제 또는 배송 문제가 생기면 고객센터에서 확인하고 처리합니다.</p></Section>
  </PolicyLayout>;
}
