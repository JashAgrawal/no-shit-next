import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import LandingClient from './landing-client';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not logged in, redirect to sign-in
  if (!session) {
    redirect('/sign-in');
  }

  return <LandingClient />;
}
