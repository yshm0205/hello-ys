'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
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
  Alert,
} from '@mantine/core';
import { Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  loginWithGoogle,
  loginWithKakao,
  loginWithMagicLink,
  loginWithEmailPassword,
} from '@/services/auth/actions';

export function LoginContent() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';
  const isCheckoutRedirect = redirectTarget.startsWith('/checkout/allinone');
  const signupLinkHref = `/signup?redirect=${encodeURIComponent(redirectTarget)}`;
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    () => (searchParams.get('error')
      ? { type: 'error', text: '로그인에 실패했습니다. 다시 시도해주세요.' }
      : null)
  );

  const titleText = locale === 'en' ? 'Log in' : '로그인';
  const googleButtonLabel = locale === 'en' ? 'Continue with Google' : 'Google로 계속하기';
  const passwordButtonLabel = locale === 'en' ? 'Log in' : '로그인';
  const magicLinkButtonLabel = locale === 'en' ? 'Log in with email link' : '이메일 링크로 로그인';

  const kakaoButtonLabel = locale === 'en' ? 'Continue with Kakao' : 'Kakao로 계속하기';

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true);
    setMessage(null);
    try {
      const result = await loginWithKakao(redirectTarget);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        setIsKakaoLoading(false);
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof (error as { digest: string }).digest === 'string' &&
          (error as { digest: string }).digest.includes('NEXT_REDIRECT')) return;
      setMessage({ type: 'error', text: '카카오 로그인에 실패했습니다. 다시 시도해 주세요.' });
      setIsKakaoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage(null);
    try {
      const result = await loginWithGoogle(redirectTarget);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        setIsGoogleLoading(false);
      }
    } catch (error) {
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
      const res = await loginWithEmailPassword(email, password, redirectTarget, locale);
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
        padding: '24px 16px',
      }}
    >
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

      <Box
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />

      <Container size="xs" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Card
          padding={0}
          radius="xl"
          style={{
            padding: '16px 16px 14px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Stack gap="md">
            <Stack align="center" gap={4}>
              <Text
                size="lg"
                fw={700}
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                FlowSpot
              </Text>
              <Title order={3} c="white">
                {titleText}
              </Title>
              {isCheckoutRedirect && (
                <Text size="xs" c="gray.5" ta="center" maw={280}>
                  결제 진행을 위해 로그인이 필요합니다.
                </Text>
              )}
            </Stack>

            <Button
              size="md"
              radius="md"
              fullWidth
              onClick={handleKakaoLogin}
              loading={isKakaoLoading}
              leftSection={
                !isKakaoLoading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 4C7.029 4 3 7.134 3 10.999c0 2.412 1.567 4.538 3.95 5.799L6.15 20l3.91-2.513c.628.089 1.277.136 1.94.136 4.971 0 9-3.134 9-7C21 7.134 16.971 4 12 4Z"
                      fill="#191600"
                    />
                  </svg>
                )
              }
              style={{
                fontWeight: 700,
                height: 46,
                background: '#FEE500',
                color: '#191600',
              }}
            >
              {kakaoButtonLabel}
            </Button>

            <Button
              size="md"
              radius="md"
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
                height: 46,
              }}
            >
              {googleButtonLabel}
            </Button>

            <Divider
              label={<Text size="xs" c="gray.6">{t('orContinue')}</Text>}
              labelPosition="center"
              color="dark.5"
              my={-2}
            />

            <Stack gap="xs">
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                size="md"
                radius="md"
                leftSection={<Mail size={16} color="#6b7280" />}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  },
                }}
              />

              <TextInput
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                size="md"
                radius="md"
                leftSection={<Lock size={16} color="#6b7280" />}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  },
                }}
              />

              <Button
                size="md"
                radius="md"
                fullWidth
                loading={isPasswordLoading}
                onClick={handleEmailPasswordLogin}
                style={{
                  background: '#8b5cf6',
                  border: 'none',
                  height: 44,
                }}
              >
                {passwordButtonLabel}
              </Button>

              <Button
                size="md"
                radius="md"
                fullWidth
                loading={isLoading}
                onClick={handleMagicLink}
                variant="subtle"
                style={{
                  color: '#a78bfa',
                  height: 40,
                }}
              >
                {magicLinkButtonLabel}
              </Button>
            </Stack>

            <Text size="xs" ta="center" c="gray.5">
              {isCheckoutRedirect && locale !== 'en' ? (
                <>
                  처음이셔도 회원가입 후 바로 결제하실 수 있습니다.{' '}
                </>
              ) : null}
              {locale === 'en' ? 'No account yet? ' : '아직 회원이 아니신가요? '}
              <Text
                component={Link}
                href={signupLinkHref}
                inherit
                style={{
                  color: '#a78bfa',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                {locale === 'en' ? 'Sign up' : '회원가입'}
              </Text>
            </Text>

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
              에 동의합니다.
            </Text>

            {message && (
              <Alert
                icon={message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                color={message.type === 'success' ? 'green' : 'red'}
                radius="md"
                variant="light"
              >
                {message.text}
              </Alert>
            )}

            <Text size="xs" ta="center">
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
