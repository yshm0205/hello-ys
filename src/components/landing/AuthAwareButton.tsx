'use client';

import { useEffect, useState, type MouseEventHandler, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@mantine/core';

import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/utils/supabase/client';

const hrefCache = new Map<string, string>();
const hrefPromises = new Map<string, Promise<string>>();

function getCacheKey(authenticatedHref: string, unauthenticatedHref: string) {
  return `${authenticatedHref}::${unauthenticatedHref}`;
}

async function resolveHref(authenticatedHref: string, unauthenticatedHref: string) {
  const cacheKey = getCacheKey(authenticatedHref, unauthenticatedHref);
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
    .then(({ data }) => (data.session ? authenticatedHref : unauthenticatedHref))
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
  children: ReactNode;
  id?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function AuthAwareButton({
  authenticatedHref,
  unauthenticatedHref,
  children,
  ...props
}: AuthAwareButtonProps) {
  const router = useRouter();
  const cacheKey = getCacheKey(authenticatedHref, unauthenticatedHref);
  const [href, setHref] = useState(hrefCache.get(cacheKey) ?? unauthenticatedHref);

  useEffect(() => {
    router.prefetch(authenticatedHref);
    router.prefetch(unauthenticatedHref);

    void resolveHref(authenticatedHref, unauthenticatedHref).then(setHref);
  }, [authenticatedHref, router, unauthenticatedHref]);

  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}
