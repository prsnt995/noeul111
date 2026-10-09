import React from 'react';
import { PolicyLayout, Section } from './PolicyLayout.jsx';
import { CommercePolicyNotice } from '../../components/common/CommercePolicyNotice.jsx';

export function ShippingPage() {
  return <PolicyLayout title="배송 안내">
    <Section title="1. 배송비와 주문금액"><CommercePolicyNotice /><p>NOEUL은 고객님께 더 나은 쇼핑 경험을 제공하기 위해 전 상품 무료배송(배송비 0원) 혜택을 제공합니다. 결제창에 표시된 상품 및 할인 적용 총액 이외의 배송비를 사전 안내 없이 추가로 청구하지 않으며, 결제 전 주문 화면에서 최종 금액을 확인하실 수 있습니다.</p></Section>
    <Section title="2. 출고와 수령"><p>국내 배송을 제공합니다. 별도 공급일 약정이 없는 주문은 주문일로부터 7일 이내, 선결제 주문은 결제일로부터 3영업일 이내 공급에 필요한 조치를 합니다. 이는 상품 수령일과 다를 수 있습니다. 예약·제작 상품은 상품 상세에서 별도 공급일을 안내합니다.</p><p>운송사와 운송장 번호는 발송 후 주문내역에서 확인할 수 있습니다. 품절 또는 배송 지연이 발생하면 사유와 예정 일정을 알리고 취소·환불 요청을 접수합니다. 도서산간 지역이나 운송사 사정에 따라 이동 기간이 달라질 수 있습니다.</p></Section>
    <Section title="3. 배송지 변경과 배송 사고"><p>배송 전 주소 변경은 고객센터로 요청해주세요. 발송이 완료되면 변경 가능 여부와 실제 추가 운송비를 안내합니다. 오배송·분실·파손이 발생하면 주문번호와 문제 내용을 알려주세요. 회사가 운송사와 확인하여 재배송 또는 환불을 처리합니다.</p></Section>
  </PolicyLayout>;
}
