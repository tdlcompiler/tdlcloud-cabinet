import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../store/auth';
import { useBlockingStore } from '../store/blocking';
import { subscriptionApi } from '../api/subscription';
import { referralApi } from '../api/referral';
import { balanceApi } from '../api/balance';
import { wheelApi } from '../api/wheel';
import { giftApi } from '../api/gift';
import { promoApi } from '../api/promo';
import { API } from '../config/constants';
import { useCurrency } from '../hooks/useCurrency';
import { useBranding } from '../hooks/useBranding';
import { cn } from '../lib/utils';

import Onboarding, { useOnboarding } from '../components/Onboarding';
import PromoOffersSection from '../components/PromoOffersSection';
import NewsSection from '../components/news/NewsSection';
import SubscriptionCardActive from '../components/dashboard/SubscriptionCardActive';
import SubscriptionCardExpired from '../components/dashboard/SubscriptionCardExpired';
import TrialOfferCard from '../components/dashboard/TrialOfferCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import PendingGiftCard from '../components/dashboard/PendingGiftCard';
import SubscriptionListCard from '../components/subscription/SubscriptionListCard';

const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />
  </svg>
);

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
  const { appName } = useBranding();
  const { isCompleted: isOnboardingCompleted, complete: completeOnboarding } = useOnboarding();
  const blockingType = useBlockingStore((state) => state.blockingType);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trafficRefreshCooldown, setTrafficRefreshCooldown] = useState(0);
  const [trafficData, setTrafficData] = useState<{
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
    refetchOnMount: 'always',
  });

  const { data: multiSubData } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 60_000,
  });
  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
    refetchOnMount: 'always',
    enabled: !isMultiTariff,
  });

  const subscription = subscriptionResponse?.subscription ?? null;

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo(),
    enabled: !subscription && !subLoading,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => subscriptionApi.getDevices(),
    enabled: !!subscription && !isMultiTariff,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const { data: referralInfo, isLoading: refLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  const { data: wheelConfig } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 60_000,
    retry: false,
  });

  const { data: pendingGifts } = useQuery({
    queryKey: ['pending-gifts'],
    queryFn: giftApi.getPendingGifts,
    staleTime: 30_000,
    retry: false,
  });

  const { data: promoGroupData } = useQuery({
    queryKey: ['promo-group-discounts'],
    queryFn: promoApi.getGroupDiscounts,
    staleTime: 60_000,
    retry: false,
  });

  const activateTrialMutation = useMutation({
    mutationFn: () => subscriptionApi.activateTrial(),
    onSuccess: () => {
      setTrialError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      refreshUser();
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      setTrialError(error.response?.data?.detail || t('common.error'));
    },
  });

  const refreshTrafficMutation = useMutation({
    mutationFn: () => subscriptionApi.refreshTraffic(subscription?.id),
    onSuccess: (data: {
      traffic_used_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
      rate_limited?: boolean;
      retry_after_seconds?: number;
    }) => {
      setTrafficData({
        traffic_used_gb: data.traffic_used_gb,
        traffic_used_percent: data.traffic_used_percent,
        is_unlimited: data.is_unlimited,
      });
      localStorage.setItem(`traffic_refresh_ts_${subscription?.id ?? 'default'}`, Date.now().toString());
      if (data.rate_limited && data.retry_after_seconds) {
        setTrafficRefreshCooldown(data.retry_after_seconds);
      } else {
        setTrafficRefreshCooldown(30);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription', subscription?.id] });
    },
    onError: (error: {
      response?: { status?: number; headers?: { get?: (key: string) => string } };
    }) => {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.get?.('Retry-After');
        setTrafficRefreshCooldown(retryAfter ? parseInt(retryAfter, 10) : 30);
      }
    },
  });

  useEffect(() => {
    if (trafficRefreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setTrafficRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [trafficRefreshCooldown]);

  const hasAutoRefreshed = useRef(false);

  useEffect(() => {
    if (!subscription) return;
    if (hasAutoRefreshed.current) return;
    hasAutoRefreshed.current = true;

    const lastRefresh = localStorage.getItem(`traffic_refresh_ts_${subscription.id}`);
    const now = Date.now();
    const cacheMs = API.TRAFFIC_CACHE_MS;

    if (lastRefresh && now - parseInt(lastRefresh, 10) < cacheMs) {
      const elapsed = now - parseInt(lastRefresh, 10);
      const remaining = Math.ceil((cacheMs - elapsed) / 1000);
      if (remaining > 0) {
        setTrafficRefreshCooldown(remaining);
      }
      return;
    }

    refreshTrafficMutation.mutate();
  }, [subscription, refreshTrafficMutation]);

  const hasNoSubscription = subscriptionResponse?.has_subscription === false && !subLoading;

  useEffect(() => {
    if (!isOnboardingCompleted && !subLoading && !refLoading && !blockingType) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingCompleted, subLoading, refLoading, blockingType]);

  const onboardingSteps = useMemo(() => {
    type Placement = 'top' | 'bottom' | 'left' | 'right';
    const steps: Array<{
      target: string;
      title: string;
      description: string;
      placement: Placement;
    }> = [
      {
        target: 'welcome',
        title: t('onboarding.steps.welcome.title'),
        description: t('onboarding.steps.welcome.description'),
        placement: 'bottom',
      },
      {
        target: 'balance',
        title: t('onboarding.steps.balance.title'),
        description: t('onboarding.steps.balance.description'),
        placement: 'bottom',
      },
    ];

    if (subscription?.subscription_url) {
      steps.splice(1, 0, {
        target: 'connect-devices',
        title: t('onboarding.steps.connectDevices.title'),
        description: t('onboarding.steps.connectDevices.description'),
        placement: 'bottom',
      });
    }

    return steps;
  }, [subscription, t]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  const displayName = user?.first_name || user?.username || appName;
  const subscriptionSummary = isMultiTariff
    ? t('dashboard.subscriptions', 'Subscriptions')
    : subscription?.tariff_name || t('nav.subscription');
  const subscriptionMeta = isMultiTariff
    ? `${multiSubData?.subscriptions.length ?? 0} ${t('dashboard.subscriptions', 'plans')}`
    : subscription
      ? `${subscription.days_left} ${t('subscription.daysShort')}`
      : t('dashboard.yourSubscription');

  const primaryAction = isMultiTariff
    ? { to: '/subscriptions', label: t('dashboard.manageAll', 'Manage all') }
    : subscription
      ? { to: `/subscriptions/${subscription.id}`, label: t('dashboard.viewSubscription') }
      : { to: '/subscription/purchase', label: t('dashboard.expired.tariffs') };

  const heroMetrics = [
    {
      label: t('dashboard.stats.balance'),
      value: `${formatAmount(balanceData?.balance_rubles || 0)} ${currencySymbol}`,
      tone: 'text-accent-300',
    },
    {
      label: t('dashboard.stats.referrals'),
      value: `${referralInfo?.total_referrals || 0}`,
      tone: 'text-dark-50',
    },
    {
      label: t('nav.subscription'),
      value: subscriptionSummary,
      tone: 'text-dark-50',
      meta: subscriptionMeta,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="tdl-shell-panel p-6 sm:p-7" data-onboarding="welcome">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="relative z-10">
            <div className="tdl-kicker">TDL Cloud // Control Surface</div>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-dark-50 sm:text-4xl">
              {t('dashboard.welcome', { name: displayName })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-dark-300 sm:text-base">
              {t('dashboard.yourSubscription')}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="tdl-chip">{subscriptionSummary}</span>
              {promoGroupData?.group_name && <span className="tdl-chip">{promoGroupData.group_name}</span>}
              {wheelConfig?.is_enabled && <span className="tdl-chip">{t('nav.wheel')}</span>}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={primaryAction.to} className="btn-primary px-4 py-3 text-sm">
                {primaryAction.label}
                <ArrowUpRightIcon />
              </Link>
              <Link to="/support" className="btn-secondary px-4 py-3 text-sm">
                {t('nav.support')}
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[22px] border border-dark-700/60 bg-dark-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="tdl-kicker">{metric.label}</div>
                <div className={cn('mt-3 text-xl font-semibold tracking-tight sm:text-2xl', metric.tone)}>
                  {metric.value}
                </div>
                {metric.meta && <div className="mt-2 text-xs text-dark-400">{metric.meta}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {pendingGifts && pendingGifts.length > 0 && <PendingGiftCard gifts={pendingGifts} />}

      {isMultiTariff && multiSubData?.subscriptions && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <div className="tdl-kicker">Plans</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-dark-50">
                {t('dashboard.subscriptions', 'Subscriptions')}
              </h2>
            </div>
            <Link to="/subscriptions" className="link text-sm">
              {t('dashboard.manageAll', 'Manage all')}
            </Link>
          </div>

          {multiSubData.subscriptions.slice(0, 3).map((sub) => (
            <SubscriptionListCard
              key={sub.id}
              subscription={sub}
              onClick={() => navigate(`/subscriptions/${sub.id}`)}
            />
          ))}

          {multiSubData.subscriptions.length > 3 && (
            <Link
              to="/subscriptions"
              className="card flex w-full items-center justify-center border border-dashed border-dark-600/70 p-3 text-xs text-dark-400 transition-colors hover:text-dark-200"
            >
              {t('dashboard.showAll', 'Show all')} ({multiSubData.subscriptions.length})
            </Link>
          )}

          <Link
            to="/subscription/purchase"
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3.5"
          >
            <span className="text-base">+</span>
            {t('subscriptions.buyAnother', 'Buy another tariff')}
          </Link>
        </section>
      )}

      {!isMultiTariff && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <div className="tdl-kicker">Service Layer</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-dark-50">
                {t('dashboard.yourSubscription')}
              </h2>
            </div>
            {subscription && (
              <Link to={`/subscriptions/${subscription.id}`} className="link hidden text-sm sm:inline-flex">
                {t('dashboard.viewSubscription')}
              </Link>
            )}
          </div>

          {subLoading ? (
            <div className="bento-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="skeleton h-5 w-20" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
              <div className="skeleton mb-3 h-10 w-32" />
              <div className="skeleton mb-3 h-4 w-40" />
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="mt-5">
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            </div>
          ) : subscription?.is_expired ||
            subscription?.status === 'disabled' ||
            subscription?.is_limited ? (
            <SubscriptionCardExpired
              subscription={subscription}
              balanceKopeks={balanceData?.balance_kopeks ?? 0}
              balanceRubles={balanceData?.balance_rubles ?? 0}
            />
          ) : subscription ? (
            <SubscriptionCardActive
              subscription={subscription}
              trafficData={trafficData}
              refreshTrafficMutation={refreshTrafficMutation}
              trafficRefreshCooldown={trafficRefreshCooldown}
              connectedDevices={devicesData?.total ?? 0}
            />
          ) : null}
        </section>
      )}

      {hasNoSubscription && !trialLoading && trialInfo?.is_available && (
        <TrialOfferCard
          trialInfo={trialInfo}
          balanceKopeks={balanceData?.balance_kopeks || 0}
          balanceRubles={balanceData?.balance_rubles || 0}
          activateTrialMutation={activateTrialMutation}
          trialError={trialError}
        />
      )}

      <section className="space-y-3">
        <div className="px-1">
          <div className="tdl-kicker">Commercial Layer</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-dark-50">{t('nav.balance')}</h2>
        </div>
        <PromoOffersSection />
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <div className="tdl-kicker">Account Signals</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-dark-50">
            {t('dashboard.stats.balance')}
          </h2>
        </div>
        <StatsGrid
          balanceRubles={balanceData?.balance_rubles || 0}
          referralCount={referralInfo?.total_referrals || 0}
          earningsRubles={referralInfo?.available_balance_rubles || 0}
          refLoading={refLoading}
        />
      </section>

      {wheelConfig?.is_enabled && (
        <Link to="/wheel" className="tdl-shell-panel group block p-5">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-accent-500/20 bg-accent-500/10 text-accent-300">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364l-2.121-2.121M8.757 8.757L6.636 6.636m11.728 0l-2.121 2.121M8.757 15.243l-2.121 2.121"
                  />
                  <circle cx="12" cy="12" r="4.5" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="tdl-kicker">{t('nav.wheel')}</div>
                <h3 className="mt-2 text-base font-semibold text-dark-50">{t('wheel.banner.title')}</h3>
                <p className="mt-1 text-sm text-dark-400">{t('wheel.banner.description')}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-dark-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-300">
              <ChevronRightIcon />
            </div>
          </div>
        </Link>
      )}

      <section className="space-y-3">
        <div className="px-1">
          <div className="tdl-kicker">Dispatch</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-dark-50">{t('nav.info')}</h2>
        </div>
        <NewsSection />
      </section>

      {showOnboarding && (
        <Onboarding
          steps={onboardingSteps}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
