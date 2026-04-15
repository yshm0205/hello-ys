'use client';

/**
 * 濡쒓렇???섏씠吏 ?대씪?댁뼵??而댄룷?뚰듃
 * ?ㅽ겕 ?뚮쭏, 以묒븰 ?뺣젹 移대뱶
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Divider,
  Group,
  Alert,
} from '@mantine/core';
import { Bot, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { loginWithGoogle, loginWithMagicLink, loginWithEmailPassword } from '@/services/auth/actions';

export function LoginContent() {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    () => (searchParams.get('error')
      ? { type: 'error', text: '로그인에 실패했습니다. 다시 시도해주세요.' }
      : null)
  );


  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage(null);
    try {
      const result = await loginWithGoogle(redirectTarget);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        setIsGoogleLoading(false);
      }
      // If successful, redirect happens server-side, loading stays true
    } catch (error) {
      // Next.js redirect()는 NEXT_REDIRECT 에러를 던지는 방식이라 정상 흐름으로 취급한다.
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof (error as { digest: string }).digest === 'string' &&
          (error as { digest: string }).digest.includes('NEXT_REDIRECT')) return;
      setMessage({ type: 'error', text: 'Google 로그인에 실패했습니다. 다시 시도해주세요.' });
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await loginWithMagicLink(email, redirectTarget);

    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: '이메일을 확인해주세요. 로그인 링크를 보냈습니다.' });
      setEmail('');
    }
    setIsLoading(false);
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
      return;
    }
    if (!password) {
      setMessage({ type: 'error', text: '비밀번호를 입력해주세요.' });
      return;
    }

    setIsPasswordLoading(true);
    setMessage(null);

    try {
      const res = await loginWithEmailPassword(email, password, redirectTarget);
      if (res?.error) {
        setMessage({ type: 'error', text: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof (error as { digest: string }).digest === 'string' &&
          (error as { digest: string }).digest.includes('NEXT_REDIRECT')) return;
      setMessage({ type: 'error', text: '로그인에 실패했습니다. 다시 시도해주세요.' });
    }
    setIsPasswordLoading(false);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 諛곌꼍 洹몃━??*/}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 湲濡쒖슦 ?④낵 */}
      <Box
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container size="xs" style={{ position: 'relative', zIndex: 1 }}>
        {/* 濡쒕큸 ?대?吏 */}
        <Box mb="lg" style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/robot-login-dark.png"
            alt="FlowSpot Login"
            width={160}
            height={160}
            style={{ borderRadius: '16px' }}
          />
        </Box>

        <Card
          padding="xl"
          radius="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Stack gap="lg">
            {/* 濡쒓퀬 */}
            <Stack align="center" gap="sm">
              <Group gap="sm">
                <Bot size={32} color="#a78bfa" />
                <Text
                  size="xl"
                  fw={700}
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  FlowSpot
                </Text>
              </Group>
            </Stack>

            {/* ??댄? */}
            <Stack align="center" gap={4}>
              <Title order={3} c="white">
                {t('welcomeBack')}
              </Title>
              <Text size="sm" c="gray.5">
                {t('loginDescription')}
              </Text>
            </Stack>

            {/* Google 濡쒓렇??*/}
            <Button
              size="lg"
              radius="lg"
              variant="white"
              fullWidth
              onClick={handleGoogleLogin}
              loading={isGoogleLoading}
              leftSection={
                !isGoogleLoading && (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )
              }
              style={{
                fontWeight: 600,
              }}
            >
              {t('googleLogin')}
            </Button>

            {/* ?쎄? ?숈쓽 */}
            <Text size="xs" c="gray.6" ta="center">
              계속하면{' '}
              <Text
                component={Link}
                href="/terms"
                inherit
                style={{ color: '#a78bfa', textDecoration: 'underline' }}
              >
                이용약관
              </Text>
              {' '}및{' '}
              <Text
                component={Link}
                href="/privacy"
                inherit
                style={{ color: '#a78bfa', textDecoration: 'underline' }}
              >
                개인정보처리방침
              </Text>
              에 동의하는 것으로 간주합니다.
            </Text>

            <Divider
              label={<Text size="xs" c="gray.6">{t('orContinue')}</Text>}
              labelPosition="center"
              color="dark.5"
            />

            {/* ?대찓??+ 鍮꾨?踰덊샇 / 留ㅼ쭅 留곹겕 */}
            <Stack gap="md">
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                size="lg"
                radius="lg"
                leftSection={<Mail size={18} color="#6b7280" />}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.4)',
                    },
                  },
                }}
              />

              <TextInput
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                size="lg"
                radius="lg"
                leftSection={<Lock size={18} color="#6b7280" />}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.4)',
                    },
                  },
                }}
              />

              <Button
                size="lg"
                radius="lg"
                fullWidth
                loading={isPasswordLoading}
                onClick={handleEmailPasswordLogin}
                style={{
                  background: '#8b5cf6',
                  border: 'none',
                }}
              >
                로그인
              </Button>

              <Button
                size="lg"
                radius="lg"
                fullWidth
                loading={isLoading}
                onClick={handleMagicLink}
                variant="subtle"
                style={{
                  color: '#a78bfa',
                }}
              >
                {t('sendMagicLink')}
              </Button>
            </Stack>

            {/* 硫붿떆吏 */}
            {message && (
              <Alert
                icon={message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                color={message.type === 'success' ? 'green' : 'red'}
                radius="lg"
                variant="light"
              >
                {message.text}
              </Alert>
            )}

            {/* ?덉쑝濡?*/}
            <Text size="sm" ta="center">
              <Text
                component={Link}
                href="/"
                c="gray.5"
                style={{ textDecoration: 'none' }}
              >
                홈으로 돌아가기
              </Text>
            </Text>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
