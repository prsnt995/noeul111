import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../../utils/api.js';
import { business } from '../../config/business.js';

export function CommercePolicyNotice() {
  const [shipping, setShipping] = useState(null);
  useEffect(() => {
    let active = true;
    api.get('/store/settings/public').then(r => { if (active && r.success) setShipping(r.data?.shipping_policy); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <div className="commerce-policy-notice" style={{ lineHeight: 1.8, fontSize: 14 }}>
    {business.courier && <p><strong>배송업체</strong> · {business.courier}</p>}
    <p><strong>배송</strong> · {shipping ? `배송비 ${Number(shipping.fee).toLocaleString('ko-KR')}원 / ${Number(shipping.threshold).toLocaleString('ko-KR')}원 이상 무료배송.` : '배송비는 주문 화면에서 확인할 수 있습니다.'} 별도 공급일 약정이 없는 선결제 주문은 결제일부터 3영업일 이내 공급에 필요한 조치를 합니다. <Link href="/shipping">배송 안내</Link></p>
    <p><strong>취소·반품</strong> · 수령 후 7일 이내 청약철회 가능. 하자·오배송의 반송비는 회사 부담, 단순 변심은 고객 부담입니다. 반품·교환 운송비는 상품과 배송 조건에 따라 달라질 수 있으며, 별도 조건은 구매 전에 안내합니다. 반환 상품을 받은 날부터 3영업일 이내 환급합니다. <Link href="/refund-exchange">전체 조건과 접수 방법</Link></p>
  </div>;
}
