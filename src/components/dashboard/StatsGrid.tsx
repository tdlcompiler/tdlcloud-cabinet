import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useCurrency } from '../../hooks/useCurrency';

interface StatsGridProps {
  balanceRubles: number;
  referralCount: number;
  earningsRubles: number;
  refLoading: boolean;
}

const ChevronIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function StatsGrid({
  balanceRubles,
  referralCount,
  earningsRubles,
  refLoading,
}: StatsGridProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();

  const cards = [
    {
      id: '01',
      label: t('dashboard.stats.balance'),
      value: `${formatAmount(balanceRubles)} ${currencySymbol}`,
      subtitle: t('nav.balance'),
      to: '/balance',
      accent: true,
      onboarding: 'balance',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
          <path d="M2.5 10h19" />
          <path d="M7 14h2.5" />
        </svg>
      ),
    },
    {
      id: '02',
      label: t('dashboard.stats.referrals'),
      value: `${referralCount}`,
      subtitle: refLoading
        ? t('common.loading')
        : `+${formatAmount(earningsRubles)} ${currencySymbol}`,
      to: '/referral',
      accent: false,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.id}
          to={card.to}
          data-onboarding={card.onboarding}
          className="group relative overflow-hidden rounded-[24px] border border-dark-700/60 bg-dark-900/60 p-5 shadow-[0_20px_48px_rgba(2,6,23,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-dark-600/70"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(var(--color-accent-400),0.12),transparent_28%)] opacity-60" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="tdl-kicker">{card.id}</div>
                <div className="mt-2 text-sm font-medium text-dark-300">{card.label}</div>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${
                  card.accent
                    ? 'border-accent-500/20 bg-accent-500/10 text-accent-300'
                    : 'border-dark-700/60 bg-dark-950/55 text-dark-300'
                }`}
              >
                {card.icon}
              </div>
            </div>

            {refLoading && !card.accent ? (
              <div className="mt-6 space-y-2">
                <div className="skeleton h-8 w-20" />
                <div className="skeleton h-4 w-24" />
              </div>
            ) : (
              <div className="mt-6">
                <div
                  className={`text-[30px] font-semibold leading-none tracking-tight ${
                    card.accent ? 'text-accent-300' : 'text-dark-50'
                  }`}
                >
                  {card.value}
                </div>
                <div className={`mt-2 text-sm ${card.accent ? 'text-dark-300' : 'text-accent-300'}`}>
                  {card.subtitle}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-dark-400">
              <span>{card.to === '/balance' ? t('nav.balance') : t('nav.referral')}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                <ChevronIcon />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
