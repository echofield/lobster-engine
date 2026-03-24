import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Access | Lobster Sound',
  description: 'Private access portal',
  robots: {
    index: false,
    follow: false,
  },
};

// Wrapper to handle searchParams in the page
function AccessContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="label-micro">Loading...</div>
        </div>
      }>
        <AccessContent>{children}</AccessContent>
      </Suspense>
    </div>
  );
}
