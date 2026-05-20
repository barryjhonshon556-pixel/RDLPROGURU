'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { Header } from '@/components/public/Header';
import { LiveResultBanner } from '@/components/public/LiveResultBanner';
import { LiveResults } from '@/components/public/LiveResults';
import { ChartsSection } from '@/components/public/ChartsSection';
import { ResultHistory } from '@/components/public/ResultHistory';
import { GameSchedule } from '@/components/public/GameSchedule';
import { WeeklySummary } from '@/components/public/WeeklySummary';
import { NumberStatistics } from '@/components/public/NumberStatistics';
import { ContactSection } from '@/components/public/ContactSection';
import { ImportantNotice } from '@/components/public/ImportantNotice';
import { Footer } from '@/components/public/Footer';
import { ScrollToTop } from '@/components/public/ScrollToTop';
import { ShareResults } from '@/components/public/ShareResults';
import AdminPanel from '@/components/admin/AdminPanel';

// Use useSyncExternalStore to safely detect client-side mounting
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// Subscribe to popstate events for URL changes
function subscribeToPopstate(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function useIsAdminFromUrl() {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('admin');
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribeToPopstate, getSnapshot, getServerSnapshot);
}

export default function Home() {
  const mounted = useIsMounted();
  const isAdminFromUrl = useIsAdminFromUrl();
  const [isAdminOverride, setIsAdminOverride] = useState<boolean | null>(null);

  // Use override if set (from programmatic navigation), otherwise use URL
  const isAdmin = isAdminOverride !== null ? isAdminOverride : isAdminFromUrl;

  const goToPublic = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.toString());
    setIsAdminOverride(false);
  };

  // Prevent hydration mismatch - render nothing until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-primary)]" />;
  }

  if (isAdmin) {
    return <AdminPanel onGoHome={goToPublic} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header />
      <main className="flex-1">
        <LiveResultBanner />
        <LiveResults />
        <GameSchedule />
        <ChartsSection />
        <ResultHistory />
        <WeeklySummary />
        <NumberStatistics />
        <ContactSection />
        <ImportantNotice />
      </main>
      <Footer />
      <ScrollToTop />
      <ShareResults />
    </div>
  );
}
