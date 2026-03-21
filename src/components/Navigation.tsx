'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { LanguageToggle } from './LanguageToggle';
import { clsx } from 'clsx';

const navItems = [
  { href: '/gear', labelFr: 'Équipement', labelEn: 'Gear' },
  { href: '/chains', labelFr: 'Chaînes', labelEn: 'Chains' },
  { href: '/aether', labelFr: 'Aether', labelEn: 'Aether' },
  { href: '/vapor', labelFr: 'Vapor', labelEn: 'Vapor' },
  { href: '/instruments/ritual', labelFr: 'Ritual', labelEn: 'Ritual' },
  { href: '/signal', labelFr: 'Signal', labelEn: 'Signal' },
  { href: '/instruments/synthi', labelFr: 'Synthi', labelEn: 'Synthi' },
  { href: '/instruments/spacetime', labelFr: 'Space-Time', labelEn: 'Space-Time' },
  { href: '/patchbay', labelFr: 'Patchbay', labelEn: 'Patchbay' },
  { href: '/generative', labelFr: 'Génératif', labelEn: 'Generative' },
];

export function Navigation() {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-6 flex items-center justify-between bg-[var(--background)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--foreground)]">
          <path d="M7 0L14 7L7 14L0 7L7 0Z" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
        <span className="text-[10px] font-medium tracking-[0.15em] uppercase">Studio</span>
      </Link>

      {/* Center Navigation */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('nav-link', isActive && 'active')}
            >
              {language === 'fr' ? item.labelFr : item.labelEn}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <LanguageToggle />
        <Link href="/guide" className="nav-link">
          Guide
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-20">
          <path d="M6 0L12 6L6 12L0 6L6 0Z" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </nav>
  );
}
