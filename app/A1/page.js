'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function A1Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/A1/browse');
  }, [router]);

  return null;
}