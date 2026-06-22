"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CopyButton,
  Group,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import {
  AlertCircle,
  Check,
  Clapperboard,
  Copy,
  FileText,
  Sparkles,
  TableProperties,
} from "lucide-react";

type LineSource = {
  line?: string;
  type?: string;
  source_time_start?: number | null;
  source_time_end?: number | null;
  original_text?: string | null;
  source_basis?: string | null;
};

type ReactionScriptJson = {
  selected_material?: {
    incident?: string;
    why_selected?: string;
    source_facts_used?: string[];
    source_reactions_used?: string[];
    weak_points?: string[];
  };
  matched_templates?: Array<{ template_id?: string; reason?: string }>;
  top_lines?: string[];
  script_lines?: string[];
  line_sources?: LineSource[];
  qa?: {
    invented_content_risk?: string;
    payoff_strength?: string;
    needs_user_review?: string[];
  };
};

type ReactionTemplate = {
  template_id?: string;
  rank?: number;
  views?: number;
  category?: string;
  title?: string;
  title_lines?: string[];
  narration_hook_original?: string[];
};

type ReactionGenerationResult = {
  success?: boolean;
  account_id?: string;
  model?: string;
  category?: string;
  selected_templates?: ReactionTemplate[];
  validation?: {
    ok?: boolean;
    errors?: string[];
    warnings?: string[];
  };
  script_json?: ReactionScriptJson;
  script_text?: string;
  edit_sheet?: string;
  error?: string;
};

const CATEGORY_OPTIONS = [
  { value: "auto", label: "자동 라우팅" },
  { value: "kindness_help", label: "친절/도움" },
  { value: "food_reaction", label: "음식 반응" },
  { value: "system_safety_infra", label: "시스템/치안/인프라" },
  { value: "travel_culture_shock", label: "여행/문화충격" },
  { value: "korea_identity_praise", label: "한국 이미지" },
];

function formatSourceTime(source?: LineSource) {
  const start = source?.source_time_start;
  if (start === null || start === undefined || !Number.isFinite(Number(start))) return "";
  const end = source?.source_time_end;
  const startText = secondsToStamp(Number(start));
  if (end === null || end === undefined || !Number.isFinite(Number(end))) return startText;
  return `${startText}-${secondsToStamp(Number(end))}`;
}

function secondsToStamp(value: number) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

function buildFallbackScriptText(script?: ReactionScriptJson) {
  if (!script) return "";
  return [
    "제목:",
    ...(script.top_lines || []),
    "",
    "스크립트:",
    ...(script.script_lines || []),
  ].join("\n");
}

function buildTableCopyText(script?: ReactionScriptJson) {
  const lines = script?.script_lines || [];
  const sources = script?.line_sources || [];
  return [
    ["#", "한국어 자막", "원본 시간", "원문/근거", "타입"].join("\t"),
    ...lines.map((line, index) => {
      const source = sources[index] || {};
      return [
        String(index + 1),
        line,
        formatSourceTime(source),
        source.original_text || source.source_basis || "",
        source.type || "",
      ].join("\t");
    }),
  ].join("\n");
}

export function EntertainmentReactionLabContent({
  userEmail,
}: {
  userEmail?: string;
}) {
  const [sourceText, setSourceText] = useState("");
  const [targetLines, setTargetLines] = useState("24-32");
  const [category, setCategory] = useState<string | null>("auto");
  const [topHook, setTopHook] = useState("");
  const [direction, setDirection] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReactionGenerationResult | null>(null);

  const script = result?.script_json;
  const scriptText = result?.script_text || buildFallbackScriptText(script);
  const tableCopyText = useMemo(() => buildTableCopyText(script), [script]);

  const handleGenerate = async () => {
    const trimmed = sourceText.trim();
    if (trimmed.length < 20) {
      setError("원본 자막/상황을 20자 이상 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/script-generator/entertainment-reaction/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_text: trimmed,
          target_lines: targetLines,
          category: category === "auto" ? "" : category || "",
          top_hook: topHook,
          direction,
        }),
      });
      const data = (await response.json()) as ReactionGenerationResult;

      if (!response.ok || data.error) {
        throw new Error(data.error || "생성에 실패했습니다.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box style={{ minHeight: "calc(100vh - 120px)" }}>
      <Stack gap="xl">
        <Box>
          <Group gap="sm" mb="xs" justify="space-between">
            <Group gap="sm">
              <Clapperboard size={24} color="#0f766e" />
              <Title order={2} style={{ fontSize: "1.5rem" }}>
                반응 쇼츠 베타
              </Title>
              <Badge variant="light" color="teal" size="sm">
                hmys0205hmys 전용
              </Badge>
            </Group>
            {userEmail && (
              <Badge variant="outline" color="gray">
                {userEmail}
              </Badge>
            )}
          </Group>
          <Text c="gray.6" size="sm">
            해외 원본 자막/상황을 넣으면 벤치마크 형식에 맞춰 상단 훅, 나레이션 훅, 본문 자막, 편집 타임코드 표를 생성합니다.
          </Text>
        </Box>

        <Card padding="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Group gap="sm">
              <FileText size={18} color="#0f766e" />
              <Title order={4}>원본 입력</Title>
            </Group>

            <Textarea
              label="원본 자막 / 상황"
              description="영상 자막, OCR, 상황 원문을 그대로 붙여넣으세요. 시간이 있으면 편집표 정확도가 올라갑니다."
              placeholder={"00:20.94 asking people to help push me up the big hill in my wheelchair\n00:35.58 excuse me could you help me up the ramp"}
              minRows={8}
              autosize
              value={sourceText}
              onChange={(event) => setSourceText(event.currentTarget.value)}
              disabled={isGenerating}
            />

            <Group grow align="flex-end">
              <TextInput
                label="목표 라인 수"
                value={targetLines}
                onChange={(event) => setTargetLines(event.currentTarget.value)}
                disabled={isGenerating}
              />
              <Select
                label="카테고리"
                data={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                disabled={isGenerating}
              />
            </Group>

            <TextInput
              label="상단 훅 고정"
              description="비워두면 API가 벤치마크 기반으로 정합니다. 고정 시 줄바꿈 또는 / 로 2줄을 넣으세요."
              placeholder="외국인 : 여기 호텔이야? / 한국 : 휴게소야"
              value={topHook}
              onChange={(event) => setTopHook(event.currentTarget.value)}
              disabled={isGenerating}
            />

            <Textarea
              label="추가 방향"
              placeholder="선택: 특정 장면을 우선하거나, 특정 벤치 흐름을 강하게 맞추고 싶을 때만 입력"
              minRows={2}
              autosize
              value={direction}
              onChange={(event) => setDirection(event.currentTarget.value)}
              disabled={isGenerating}
            />

            {error && (
              <Alert color="red" icon={<AlertCircle size={18} />} radius="md">
                {error}
              </Alert>
            )}

            <Group justify="flex-end">
              <Button
                leftSection={isGenerating ? undefined : <Sparkles size={18} />}
                loading={isGenerating}
                color="teal"
                onClick={handleGenerate}
              >
                스크립트 + 편집시트 생성
              </Button>
            </Group>
          </Stack>
        </Card>

        {result && script && (
          <Stack gap="lg">
            <Group gap="xs" wrap="wrap">
              <Badge color={result.validation?.ok ? "green" : "yellow"} variant="light">
                {result.validation?.ok ? "검증 OK" : "검증 확인"}
              </Badge>
              <Badge color="gray" variant="light">
                {result.model || "model"}
              </Badge>
              <Badge color="teal" variant="light">
                {result.category || "category"}
              </Badge>
              <Badge color="gray" variant="outline">
                리스크 {script.qa?.invented_content_risk || "-"}
              </Badge>
              <Badge color="gray" variant="outline">
                Payoff {script.qa?.payoff_strength || "-"}
              </Badge>
            </Group>

            <Group align="stretch" grow>
              <Card padding="lg" radius="lg" withBorder>
                <Stack gap="sm">
                  <Title order={4}>상단 훅</Title>
                  <Stack gap={6}>
                    {(script.top_lines || []).map((line, index) => (
                      <Text key={`${line}-${index}`} fw={700} size="lg">
                        {line}
                      </Text>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              <Card padding="lg" radius="lg" withBorder>
                <Stack gap="sm">
                  <Title order={4}>선택 소재</Title>
                  <Text size="sm">
                    <Text span fw={700}>Incident </Text>
                    {script.selected_material?.incident || "-"}
                  </Text>
                  <Text size="sm" c="gray.7">
                    <Text span fw={700}>Reason </Text>
                    {script.selected_material?.why_selected || "-"}
                  </Text>
                </Stack>
              </Card>
            </Group>

            <Card padding="lg" radius="lg" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Copy size={18} color="#0f766e" />
                    <Title order={4}>전체 스크립트</Title>
                  </Group>
                  <CopyButton value={scriptText}>
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        variant="light"
                        color={copied ? "green" : "teal"}
                        leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                        onClick={copy}
                      >
                        {copied ? "복사됨" : "복사"}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Box
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.75,
                    background: "var(--mantine-color-gray-0)",
                    border: "1px solid var(--mantine-color-gray-2)",
                    borderRadius: 12,
                    padding: 16,
                    color: "var(--mantine-color-dark-8)",
                  }}
                >
                  {scriptText}
                </Box>
              </Stack>
            </Card>

            <Card padding="lg" radius="lg" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="sm">
                    <TableProperties size={18} color="#0f766e" />
                    <Title order={4}>편집용 타임코드 표</Title>
                  </Group>
                  <CopyButton value={tableCopyText}>
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        variant="light"
                        color={copied ? "green" : "teal"}
                        leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                        onClick={copy}
                      >
                        {copied ? "복사됨" : "표 복사"}
                      </Button>
                    )}
                  </CopyButton>
                </Group>

                <Box style={{ overflowX: "auto" }}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders miw={900}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>#</Table.Th>
                        <Table.Th>한국어 자막</Table.Th>
                        <Table.Th>원본 시간</Table.Th>
                        <Table.Th>원문/근거</Table.Th>
                        <Table.Th>타입</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(script.script_lines || []).map((line, index) => {
                        const source = script.line_sources?.[index] || {};
                        return (
                          <Table.Tr key={`${line}-${index}`}>
                            <Table.Td>{index + 1}</Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">{line}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="teal" style={{ whiteSpace: "nowrap" }}>
                                {formatSourceTime(source)}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="gray.7">
                                {source.original_text || source.source_basis || ""}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" variant="light" color="gray">
                                {source.type || "-"}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Stack>
            </Card>

            <Card padding="lg" radius="lg" withBorder>
              <Stack gap="sm">
                <Title order={4}>매칭 벤치마크</Title>
                <Group gap="xs" wrap="wrap">
                  {(result.selected_templates || []).slice(0, 4).map((template) => (
                    <Badge key={template.template_id || template.title} variant="light" color="gray" size="lg">
                      R{template.rank || "-"} · {template.title || template.template_id}
                    </Badge>
                  ))}
                </Group>
                {!!result.validation?.warnings?.length && (
                  <Alert color="yellow" icon={<AlertCircle size={18} />} radius="md">
                    {result.validation.warnings.join(" / ")}
                  </Alert>
                )}
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
