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
  Group,
  Alert,
} from '@mantine/core';
import { Bot, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  loginWithGoogle,
  loginWithMagicLink,
  signUpWithEmailPassword,
} from '@/services/auth/actions';

export function SignupContent() {
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/checkout/allinone';
  const isCheckoutRedirect = redirectTarget.startsWith('/checkout/allinone');

  const [message, setMessage] = useState<
    { type: 'success' | 'error'; text: string } | null
  >(null);

  const titleText = locale === 'en' ? 'Create account' : '회원가입';
  const googleButtonLabel = locale === 'en' ? 'Continue with Google' : 'Google로 계속하기';
  const passwordButtonLabel = locale === 'en' ? 'Sign up with email' : '이메일로 회원가입';
  const magicLinkButtonLabel = locale === 'en' ? 'Get a sign-up link by email' : '이메일 링크로 가입';

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setMessage(null);
    try {
      const result = await loginWithGoogle(redirectTarget);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        setIsGoogleLoading(false);
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        typeof (error as { digest: string }).digest === 'string' &&
        (error as { digest: string }).digest.includes('NEXT_REDIRECT')
      )
        return;
      setMessage({
        type: 'error',
        text: 'Google 회원가입에 실패했습니다. 다시 시도해주세요.',
      });
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
      return;
    }

    setIsMagicLoading(true);
    setMessage(null);

    const res = await loginWithMagicLink(email, redirectTarget);

    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({
        type: 'success',
        text: '이메일을 확인해주세요. 가입 확인 링크를 보냈습니다.',
      });
      setEmail('');
    }
    setIsMagicLoading(false);
  };

  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
      return;
    }
    if (!password || password.length < 6) {
      setMessage({
        type: 'error',
        text: '비밀번호는 6자 이상이어야 합니다.',
      });
      return;
    }

    setIsPasswordLoading(true);
    setMessage(null);

    try {
      const res = await signUpWithEmailPassword(
        email,
        password,
        redirectTarget,
        locale
      );
      if (res && 'error' in res && res.error) {
        setMessage({ type: 'error', text: res.error });
      } else if (
        res &&
        'requiresEmailConfirmation' in res &&
        res.requiresEmailConfirmation
      ) {
        setMessage({
          type: 'success',
          text: '가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.',
        });
        setPassword('');
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        typeof (error as { digest: string }).digest === 'string' &&
        (error as { digest: string }).digest.includes('NEXT_REDIRECT')
      )
        return;
      setMessage({
        type: 'error',
        text: '회원가입에 실패했습니다. 다시 시도해주세요.',
      });
    }
    setIsPasswordLoading(false);
  };

  const loginLinkHref = `/login?redirect=${encodeURIComponent(redirectTarget)}`;

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
        padding: '40px 20px',
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
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container size="xs" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
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
            <Stack align="center" gap="xs">
              <Group gap="sm">
                <Bot size={28} color="#a78bfa" />
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
              <Title order={3} c="white" mt="xs">
                {titleText}
              </Title>
              {isCheckoutRedirect && (
                <Text size="sm" c="gray.5" ta="center" maw={320}>
                  회원가입 후 바로 결제 화면으로
                  <br />
                  이동합니다.
                </Text>
              )}
              {isCheckoutRedirect && (
                <Text size="xs" c="gray.6" ta="center" maw={320}>
                  결제 후 바로 이용을 위해 회원가입을 진행합니다.
                </Text>
              )}
            </Stack>

            <Button
              size="lg"
              radius="lg"
              variant="white"
              fullWidth
              onClick={handleGoogleSignup}
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
              style={{ fontWeight: 600 }}
            >
              {googleButtonLabel}
            </Button>

            <Divider
              label={
                <Text size="xs" c="gray.6">
                  또는 이메일로
                </Text>
              }
              labelPosition="center"
              color="dark.5"
            />

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
                  },
                }}
              />

              <TextInput
                type="password"
                placeholder="비밀번호 (6자 이상)"
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
                  },
                }}
              />

              <Button
                size="lg"
                radius="lg"
                fullWidth
                loading={isPasswordLoading}
                onClick={handlePasswordSignup}
                style={{ background: '#8b5cf6', border: 'none' }}
              >
                {passwordButtonLabel}
              </Button>

              <Button
                size="lg"
                radius="lg"
                fullWidth
                loading={isMagicLoading}
                onClick={handleMagicLinkSignup}
                variant="subtle"
                style={{ color: '#a78bfa' }}
              >
                {magicLinkButtonLabel}
              </Button>
            </Stack>

            <Text size="sm" ta="center" c="gray.5">
              {isCheckoutRedirect && locale !== 'en' ? (
                <>
                  이미 계정이 있으시면 로그인 후 바로 결제하실 수 있습니다.{' '}
                </>
              ) : null}
              {locale === 'en'
                ? 'Already have an account? '
                : '이미 계정이 있으신가요? '}
              <Text
                component={Link}
                href={loginLinkHref}
                inherit
                style={{
                  color: '#a78bfa',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                {locale === 'en' ? 'Log in' : '로그인'}
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
              </Text>{' '}
              및{' '}
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
                icon={
                  message.type === 'success' ? (
                    <Check size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )
                }
                color={message.type === 'success' ? 'green' : 'red'}
                radius="lg"
                variant="light"
              >
                {message.text}
              </Alert>
            )}

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
