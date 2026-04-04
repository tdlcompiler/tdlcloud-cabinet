import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { initDataUser } from '@telegram-apps/sdk-react';
import { useShallow } from 'zustand/shallow';

import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';
import { usePlatform } from '@/platform';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
} from '@/api/branding';
import { themeColorsApi } from '@/api/themeColors';
import { cn } from '@/lib/utils';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import TicketNotificationBell from '@/components/TicketNotificationBell';

import {
  HomeIcon,
  SubscriptionIcon,
  WalletIcon,
  UsersIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
  GamepadIcon,
  ClipboardIcon,
  InfoIcon,
  CogIcon,
  WheelIcon,
  GiftIcon,
  MenuIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
} from './icons';

import type { TelegramPlatform } from '@/hooks/useTelegramSDK';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Cabinet';
const FALLBACK_LOGO = import.meta.env.VITE_APP_LOGO || 'V';

interface AppHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onCommandPaletteOpen: () => void;
  headerHeight: number;
  isFullscreen: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  telegramPlatform?: TelegramPlatform;
  wheelEnabled?: boolean;
  referralEnabled?: boolean;
  hasContests?: boolean;
  hasPolls?: boolean;
  giftEnabled?: boolean;
}

export function AppHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  onCommandPaletteOpen,
  headerHeight,
  isFullscreen,
  safeAreaInset,
  contentSafeAreaInset,
  telegramPlatform,
  wheelEnabled,
  referralEnabled,
  hasContests,
  hasPolls,
  giftEnabled,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore(
    useShallow((state) => ({ user: state.user, logout: state.logout, isAdmin: state.isAdmin })),
  );
  const { toggleTheme, isDark } = useTheme();
  const { haptic, platform } = usePlatform();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  const { data: enabledThemes } = useQuery({
    queryKey: ['enabled-themes'],
    queryFn: themeColorsApi.getEnabledThemes,
    staleTime: 1000 * 60 * 5,
  });
  const canToggle = enabledThemes?.dark && enabledThemes?.light;

  useEffect(() => {
    try {
      const telegramUser = initDataUser();
      if (telegramUser?.photo_url) {
        setUserPhotoUrl(telegramUser.photo_url);
      }
    } catch {
      // Not in Telegram.
    }
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const preventDefault = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.mobile-menu-content')) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdminActive = () => location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    ...(referralEnabled ? [{ path: '/referral', label: t('nav.referral'), icon: UsersIcon }] : []),
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
    ...(hasContests ? [{ path: '/contests', label: t('nav.contests'), icon: GamepadIcon }] : []),
    ...(hasPolls ? [{ path: '/polls', label: t('nav.polls'), icon: ClipboardIcon }] : []),
    ...(wheelEnabled ? [{ path: '/wheel', label: t('nav.wheel'), icon: WheelIcon }] : []),
    ...(giftEnabled ? [{ path: '/gift', label: t('nav.gift'), icon: GiftIcon }] : []),
    { path: '/info', label: t('nav.info'), icon: InfoIcon },
  ];

  const activeMobileLabel =
    navItems.find((item) => isActive(item.path))?.label ||
    (isAdminActive() ? t('admin.nav.title') : t('nav.dashboard'));

  const userName = user?.first_name || user?.username || 'TDL User';
  const userHandle = user?.username ? `@${user.username}` : `ID: ${user?.telegram_id ?? '---'}`;

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 lg:hidden"
        style={{
          paddingTop: isFullscreen
            ? `${Math.max(safeAreaInset.top, contentSafeAreaInset.top) + (telegramPlatform === 'android' ? 48 : 45)}px`
            : undefined,
        }}
      >
        <div className="mx-auto w-full px-4" onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}>
          <div className="tdl-shell-panel px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn('flex min-w-0 flex-shrink items-center gap-3', !appName && 'mr-4')}
              >
                <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-accent-500/20 bg-dark-950/80 shadow-[0_16px_34px_rgba(var(--color-accent-500),0.14)]">
                  <span
                    className={cn(
                      'absolute text-lg font-bold text-accent-300 transition-opacity duration-200',
                      hasCustomLogo && logoLoaded ? 'opacity-0' : 'opacity-100',
                    )}
                  >
                    {logoLetter}
                  </span>
                  {hasCustomLogo && logoUrl && (
                    <img
                      src={logoUrl}
                      alt={appName || 'Logo'}
                      className={cn(
                        'absolute h-full w-full object-contain transition-opacity duration-200',
                        logoLoaded ? 'opacity-100' : 'opacity-0',
                      )}
                      onLoad={() => setLogoLoaded(true)}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="tdl-kicker">TDL Cloud</div>
                  {appName && <div className="mt-1 truncate text-sm font-semibold text-dark-50">{appName}</div>}
                  <div className="mt-1 text-[11px] text-dark-400">{activeMobileLabel}</div>
                </div>
              </Link>

              <div className="flex items-center gap-1.5">
                {platform !== 'telegram' && (
                  <button
                    onClick={() => {
                      haptic.impact('light');
                      onCommandPaletteOpen();
                    }}
                    className="btn-icon hidden sm:flex"
                    title="Search"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </button>
                )}

                {canToggle && (
                  <button
                    onClick={() => {
                      haptic.impact('light');
                      toggleTheme();
                      setMobileMenuOpen(false);
                    }}
                    className="btn-icon relative"
                    title={isDark ? t('theme.light') || 'Light mode' : t('theme.dark') || 'Dark mode'}
                  >
                    <div className="relative h-5 w-5">
                      <div
                        className={cn(
                          'absolute inset-0 transition-all duration-300',
                          isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0',
                        )}
                      >
                        <MoonIcon className="h-5 w-5" />
                      </div>
                      <div
                        className={cn(
                          'absolute inset-0 transition-all duration-300',
                          isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100',
                        )}
                      >
                        <SunIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                )}

                <div onClick={() => setMobileMenuOpen(false)}>
                  <TicketNotificationBell isAdmin={isAdminActive()} />
                </div>
                <div onClick={() => setMobileMenuOpen(false)}>
                  <LanguageSwitcher />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.impact('light');
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  className={cn('btn-icon', mobileMenuOpen && 'border-accent-500/20 text-accent-300')}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? (
                    <CloseIcon className="h-6 w-6" />
                  ) : (
                    <MenuIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-fade-in lg:hidden" style={{ top: headerHeight }}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          <div
            className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mobile-menu-content mx-auto max-w-3xl">
              <div className="tdl-shell-panel px-4 py-4">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-dark-700/50 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {userPhotoUrl ? (
                      <img
                        src={userPhotoUrl}
                        alt="Avatar"
                        className="h-11 w-11 rounded-2xl object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-700/60 bg-dark-950/70',
                        userPhotoUrl ? 'hidden' : '',
                      )}
                    >
                      <UserIcon className="h-5 w-5 text-dark-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="tdl-kicker">Session</div>
                      <div className="truncate text-sm font-semibold text-dark-50">{userName}</div>
                      <div className="truncate text-xs text-dark-400">{userHandle}</div>
                    </div>
                  </div>
                  <span className="tdl-chip shrink-0">online</span>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={isActive(item.path) ? 'nav-item-active' : 'nav-item'}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <>
                      <div className="divider my-3" />
                      <div className="tdl-kicker px-4 pb-1">{t('admin.nav.title')}</div>
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'nav-item',
                          isAdminActive()
                            ? 'border-warning-500/30 bg-warning-500/10 text-warning-300'
                            : 'text-warning-500/80',
                        )}
                      >
                        <CogIcon className="h-5 w-5" />
                        {t('admin.nav.title')}
                      </Link>
                    </>
                  )}

                  <div className="divider my-3" />

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={isActive('/profile') ? 'nav-item-active' : 'nav-item'}
                  >
                    <UserIcon className="h-5 w-5" />
                    {t('nav.profile')}
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="nav-item w-full text-error-400"
                  >
                    <LogoutIcon className="h-5 w-5" />
                    {t('nav.logout')}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
