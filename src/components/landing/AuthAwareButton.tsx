'use client';

import { useCallback, useEffect, useState, type MouseEventHandler, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@mantine/core';

import { Link, useRouter } from '@/i18n/routing';
import { isActiveAccessPlan } from '@/lib/plans/config';
import { createClient } from '@/utils/supabase/client';

const hrefCache = new Map<string, string>();
const hrefPromises = new Map<string, Promise<string>>();

function getCacheKey(
  authenticatedHref: string,
  unauthenticatedHref: string,
  unpaidAuthenticatedHref?: string,
) {
  return `${authenticatedHref}::${unauthenticatedHref}::${unpaidAuthenticatedHref ?? ''}`;
}

function invalidateResolvedHref(cacheKey: string) {
  hrefCache.delete(cacheKey);
  hrefPromises.delete(cacheKey);
}

async function resolveHref(
  authenticatedHref: string,
  unauthenticatedHref: string,
  unpaidAuthenticatedHref?: string,
) {
  const cacheKey = getCacheKey(authenticatedHref, unauthenticatedHref, unpaidAuthenticatedHref);
  const cached = hrefCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existingPromise = hrefPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const fallbackHref = cached ?? unauthenticatedHref;
  const promise = Promise.resolve()
    .then(async () => {
      try {
        const response = await fetch('/api/credits', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.status === 401) {
          return unauthenticatedHref;
        }

        if (!response.ok) {
          return fallbackHref;
        }

        if (!unpaidAuthenticatedHref) {
          return authenticatedHref;
        }

        const creditInfo = (await response.json()) as {
          plan_type?: string | null;
          expires_at?: string | null;
        };

        return isActiveAccessPlan(creditInfo.plan_type, creditInfo.expires_at)
          ? authenticatedHref
          : unpaidAuthenticatedHref;
      } catch {
        return fallbackHref;
      }
    })
    .catch(() => fallbackHref)
    .then((resolvedHref) => {
      hrefCache.set(cacheKey, resolvedHref);
      hrefPromises.delete(cacheKey);
      return resolvedHref;
    });

  hrefPromises.set(cacheKey, promise);
  return promise;
}

type AuthAwareButtonProps = Omit<ButtonProps, 'component' | 'href'> & {
  authenticatedHref: string;
  unauthenticatedHref: string;
  unpaidAuthenticatedHref?: string;
  children: ReactNode;
  id?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function AuthAwareButton({
  authenticatedHref,
  unauthenticatedHref,
  unpaidAuthenticatedHref,
  children,
  ...props
}: AuthAwareButtonProps) {
  const router = useRouter();
  const cacheKey = getCacheKey(authenticatedHref, unauthenticatedHref, unpaidAuthenticatedHref);
  const [href, setHref] = useState(hrefCache.get(cacheKey) ?? unauthenticatedHref);

  const refreshHref = useCallback(
    (force = false) => {
      if (force) {
        invalidateResolvedHref(cacheKey);
      }

      return resolveHref(authenticatedHref, unauthenticatedHref, unpaidAuthenticatedHref).then(setHref);
    },
    [authenticatedHref, cacheKey, unauthenticatedHref, unpaidAuthenticatedHref],
  );

  useEffect(() => {
    router.prefetch(authenticatedHref);
    router.prefetch(unauthenticatedHref);
    if (unpaidAuthenticatedHref) {
      router.prefetch(unpaidAuthenticatedHref);
    }

    const supabase = createClient();
    void refreshHref();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void refreshHref(true);
    });

    const handleFocus = () => {
      void refreshHref(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshHref(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authenticatedHref, refreshHref, router, unauthenticatedHref, unpaidAuthenticatedHref]);

  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}
