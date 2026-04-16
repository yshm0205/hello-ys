import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface PaymentCompleteEmailProps {
  userName: string;
  amount: string;
  grantedCredits: string;
  dashboardUrl: string;
  lecturesUrl: string;
  scriptsUrl: string;
  kakaoChannelUrl: string;
}

export const PaymentCompleteEmail = ({
  userName,
  amount,
  grantedCredits,
  dashboardUrl,
  lecturesUrl,
  scriptsUrl,
  kakaoChannelUrl,
}: PaymentCompleteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>FlowSpot 결제가 완료되었습니다. 강의실과 스크립트 제작을 바로 시작해 보세요.</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="bg-white rounded-lg my-[40px] mx-auto p-[32px] max-w-[560px] shadow-lg">
            <Section className="text-center mb-[24px]">
              <Text className="text-2xl font-bold text-gray-900">FlowSpot</Text>
            </Section>

            <Heading className="text-gray-900 text-[28px] font-bold text-center p-0 my-[24px] mx-0">
              결제가 완료되었습니다
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[28px]">
              {userName}님, 올인원 패스 결제가 정상적으로 완료되었습니다.
            </Text>

            <Text className="text-gray-700 text-[16px] leading-[28px]">
              결제 금액은 <strong>{amount}</strong>이며, 지금 바로 <strong>{grantedCredits}</strong>가 지급되었습니다.
            </Text>

            <Section className="bg-violet-50 rounded-lg p-4 my-[24px]">
              <Text className="text-violet-900 text-[14px] m-0">
                지금 바로 시작할 수 있는 것
              </Text>
              <Text className="text-violet-700 text-[14px] mt-[8px] mb-0">
                강의실 이용, 스크립트 제작, 대시보드 확인
              </Text>
            </Section>

            <Section className="text-center my-[28px]">
              <Button
                className="bg-[#111827] rounded-lg text-white text-[14px] font-semibold no-underline text-center px-6 py-4 mr-2 mb-2"
                href={lecturesUrl}
              >
                강의실 바로가기
              </Button>
              <Button
                className="bg-[#7c3aed] rounded-lg text-white text-[14px] font-semibold no-underline text-center px-6 py-4 mb-2"
                href={scriptsUrl}
              >
                스크립트 제작 시작
              </Button>
            </Section>

            <Section className="text-center my-[12px]">
              <Button
                className="bg-white border border-solid border-[#d1d5db] rounded-lg text-[#111827] text-[14px] font-semibold no-underline text-center px-6 py-4 mr-2 mb-2"
                href={dashboardUrl}
              >
                대시보드
              </Button>
              <Button
                className="bg-[#FEE500] rounded-lg text-[#3C1E1E] text-[14px] font-semibold no-underline text-center px-6 py-4 mb-2"
                href={kakaoChannelUrl}
              >
                카카오톡 채널 문의
              </Button>
            </Section>

            <Hr className="border-gray-200 my-[24px]" />

            <Text className="text-gray-600 text-[14px] leading-[24px]">
              이용 기간은 결제 즉시 시작됩니다. 강의 및 프로그램 이용 기간은 4개월이며,
              크레딧은 매달 400cr씩 총 4회 지급됩니다.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentCompleteEmail;
