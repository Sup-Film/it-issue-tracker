import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/serverAuth'

export const metadata: Metadata = {
  title: 'Protected',
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // runs on server for each request
  const user = getVerifiedUser();
  if (!user) {
    // not authenticated -> redirect to login (server-side, zero-flicker)
    redirect('/login');
  }

  return <>{children}</>;
}
