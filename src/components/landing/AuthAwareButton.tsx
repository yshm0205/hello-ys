'use client';

import { useEffect, useState, type MouseEventHandler, type ReactNode } from 'react';
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

  const promise = createClient()
    .auth.getSession()
    .then(async ({ data }) => {
      if (!data.session) {
        return unauthenticatedHref;
      }

      if (!unpaidAuthenticatedHref) {
        return authenticatedHref;
      }

      try {
        const response = await fetch('/api/credits', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          return unpaidAuthenticatedHref;
        }

        const creditInfo = (await response.json()) as {
          plan_type?: string | null;
          expires_at?: string | null;
        };

        return isActiveAccessPlan(creditInfo.plan_type, creditInfo.expires_at)
          ? authenticatedHref
          : unpaidAuthenticatedHref;
      } catch {
        return unpaidAuthenticatedHref;
      }
    })
    .catch(() => unauthenticatedHref)
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

  useEffect(() => {
    router.prefetch(authenticatedHref);
    router.prefetch(unauthenticatedHref);
    if (unpaidAuthenticatedHref) {
      router.prefetch(unpaidAuthenticatedHref);
    }

    void resolveHref(authenticatedHref, unauthenticatedHref, unpaidAuthenticatedHref).then(setHref);
  }, [authenticatedHref, router, unauthenticatedHref, unpaidAuthenticatedHref]);

  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}
