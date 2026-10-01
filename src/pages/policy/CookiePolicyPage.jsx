import React from 'react';
import { PolicyLayout, Section, PolicyTable } from './PolicyLayout.jsx';
export function CookiePolicyPage() {
  return <PolicyLayout title="쿠키 및 브라우저 저장소 안내">
    <Section title="사용 목적"><p>로그인과 보안 기능에는 쿠키를, 장바구니·언어·안내 확인 상태 유지에는 브라우저 저장소를 사용합니다. 이 안내의 확인 버튼은 광고나 분석 목적의 개인정보 처리에 동의하는 버튼이 아닙니다.</p><PolicyTable headers={['구분', '용도', '유지기간']} rows={[
      ['로그인·인증 쿠키', '로그인 상태 유지와 인증 요청 보호', '쿠키 만료 또는 로그아웃·브라우저 삭제 시까지. 서버 세션 유효기간은 별도 적용'],
      ['브라우저 로컬 저장소', '장바구니·찜·언어 선택·안내 확인 상태', '이용자가 삭제하거나 해당 항목을 초기화할 때까지'],
    ]} /></Section>
    <Section title="삭제·차단 방법"><p>브라우저의 설정에서 개인정보 및 보안 → 사이트 데이터 또는 쿠키 메뉴를 열어 NOEUL의 저장 정보를 삭제하거나 차단할 수 있습니다. 삭제하면 장바구니와 설정이 초기화되고, 필수 쿠키를 차단하면 로그인·결제가 제한될 수 있습니다.</p></Section>
    <Section title="결제창과 외부 로그인"><p>토스페이먼츠 결제창과 구글 로그인 화면의 저장소 및 개인정보 처리는 각 서비스의 안내를 함께 참고해주세요.</p></Section>
  </PolicyLayout>;
}
