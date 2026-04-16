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

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  backgroundColor: "#ffffff",
} as const;

const mutedLabelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
} as const;

const valueStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
  margin: "0",
} as const;

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
        <Body className="mx-auto my-auto bg-[#f5f7fb] font-sans text-[#111827]">
          <Container className="mx-auto my-[32px] max-w-[620px] rounded-[24px] bg-white p-[32px] shadow-sm">
            <Section className="mb-[28px]">
              <Text className="m-0 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
                FlowSpot
              </Text>
              <Heading className="mb-[12px] mt-[10px] text-[30px] font-bold leading-[1.3] text-[#111827]">
                결제가 완료되었습니다
              </Heading>
              <Text className="m-0 text-[16px] leading-[28px] text-[#4b5563]">
                {userName}님, 올인원 패스 결제가 정상적으로 완료되었습니다. 아래에서 지급된
                크레딧과 바로 시작할 수 있는 메뉴를 확인해 주세요.
              </Text>
            </Section>

            <Section style={cardStyle}>
              <Text style={mutedLabelStyle}>결제 요약</Text>
              <Text className="m-0 text-[15px] leading-[26px] text-[#4b5563]">
                결제 금액은 <strong>{amount}</strong>이며, 지금 <strong>{grantedCredits}</strong>
                가 반영되었습니다.
              </Text>
              <Hr className="my-[18px] border-[#e5e7eb]" />
              <Section>
                <Text style={mutedLabelStyle}>이용 안내</Text>
                <Text className="m-0 text-[15px] leading-[26px] text-[#4b5563]">
                  이용 기간은 결제 즉시 시작됩니다. 강의 및 프로그램 이용 기간은 4개월이며,
                  크레딧은 매달 400cr씩 총 4회 지급됩니다.
                </Text>
              </Section>
            </Section>

            <Section className="my-[18px]">
              <table
                role="presentation"
                cellPadding="0"
                cellSpacing="0"
                width="100%"
                style={{ borderCollapse: "separate", borderSpacing: "12px 0" }}
              >
                <tbody>
                  <tr>
                    <td width="50%" style={cardStyle}>
                      <Text style={mutedLabelStyle}>지급 크레딧</Text>
                      <Text style={valueStyle}>{grantedCredits}</Text>
                    </td>
                    <td width="50%" style={cardStyle}>
                      <Text style={mutedLabelStyle}>현재 단계</Text>
                      <Text style={valueStyle}>바로 시작 가능</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section
              className="my-[18px] rounded-[14px] bg-[#f6f3ff] p-[20px]"
              style={{ border: "1px solid #ede9fe" }}
            >
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7c3aed]">
                다음 단계
              </Text>
              <Text className="mb-0 mt-[8px] text-[15px] leading-[26px] text-[#4b5563]">
                강의실에서 바로 학습을 시작하거나, 스크립트 제작 화면으로 이동해 첫 결과물을
                만들어 보세요.
              </Text>
            </Section>

            <Section className="mt-[26px] text-center">
              <Button
                className="mb-2 mr-2 rounded-[12px] bg-[#111827] px-6 py-4 text-center text-[14px] font-semibold text-white no-underline"
                href={lecturesUrl}
              >
                강의 보러가기
              </Button>
              <Button
                className="mb-2 rounded-[12px] bg-[#7c3aed] px-6 py-4 text-center text-[14px] font-semibold text-white no-underline"
                href={scriptsUrl}
              >
                스크립트 제작하러가기
              </Button>
            </Section>

            <Hr className="my-[28px] border-[#e5e7eb]" />

            <Text className="m-0 text-[13px] leading-[22px] text-[#6b7280]">
              이 메일은 올인원 패스 결제 완료 안내 메일입니다.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentCompleteEmail;
