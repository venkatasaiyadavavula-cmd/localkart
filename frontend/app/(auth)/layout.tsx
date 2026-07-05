import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Login or register to LocalKart',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
