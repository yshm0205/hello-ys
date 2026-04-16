import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PaymentCompleteEmailProps {
  userName: string;
  amount: string;
  grantedCredits: string;
  lecturesUrl: string;
  scriptsUrl: string;
}

export const PaymentCompleteEmail = ({
  userName,
  amount,
  grantedCredits,
  lecturesUrl,
  scriptsUrl,
}: PaymentCompleteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>올인원 패스 결제가 완료되었습니다. 강의와 스크립트 제작을 바로 시작할 수 있습니다.</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-gray-100 font-sans">
          <Container className="mx-auto my-[40px] max-w-[560px] rounded-lg bg-white p-[32px] shadow-lg">
            <Section className="mb-[24px] text-center">
              <Text className="text-2xl font-bold text-gray-900">FlowSpot</Text>
            </Section>

            <Heading className="mx-0 my-[24px] p-0 text-center text-[28px] font-bold text-gray-900">
              결제가 완료되었습니다
            </Heading>

            <Text className="text-[16px] leading-[28px] text-gray-700">
              {userName}님, 올인원 패스 결제가 정상적으로 완료되었습니다.
            </Text>

            <Text className="text-[16px] leading-[28px] text-gray-700">
              결제 금액은 <strong>{amount}</strong>이며, 지금 <strong>{grantedCredits}</strong>가
              반영되었습니다.
            </Text>

            <Section className="my-[24px] rounded-lg bg-violet-50 p-4">
              <Text className="m-0 text-[14px] font-semibold text-violet-900">
                바로 시작할 수 있는 메뉴
              </Text>
              <Text className="mb-0 mt-[8px] text-[14px] text-violet-700">
                강의실에서 학습을 시작하거나, 스크립트 제작 화면으로 바로 이동할 수 있습니다.
              </Text>
            </Section>

            <Section className="my-[28px] text-center">
              <Button
                className="mb-2 mr-2 rounded-lg bg-[#111827] px-6 py-4 text-center text-[14px] font-semibold text-white no-underline"
                href={lecturesUrl}
              >
                강의 보러가기
              </Button>
              <Button
                className="mb-2 rounded-lg bg-[#7c3aed] px-6 py-4 text-center text-[14px] font-semibold text-white no-underline"
                href={scriptsUrl}
              >
                스크립트 제작하러가기
              </Button>
            </Section>

            <Hr className="my-[24px] border-gray-200" />

            <Text className="text-[14px] leading-[24px] text-gray-600">
              이용 기간은 결제 즉시 시작됩니다. 강의 및 프로그램 이용 기간은 4개월이며, 크레딧은
              매달 400cr씩 총 4회 지급됩니다.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentCompleteEmail;
