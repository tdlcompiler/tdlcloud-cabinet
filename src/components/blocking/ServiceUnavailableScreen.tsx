import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useBlockingStore } from '../../store/blocking';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { pingBackend, hasEverReachedBackend } from '../../api/health';
import { isInTelegramWebApp, closeTelegramApp } from '../../hooks/useTelegramSDK';
import { CloudWarningIcon, RestartIcon, CloseIcon } from '@/components/icons';

const POLL_INTERVAL_MS = 5000;

/**
 * Full-screen state shown when the backend is unreachable (transport-level
 * failure), replacing the blank loader the app used to get stuck on. Polls the
 * liveness endpoint and, once the backend answers again, reloads to re-bootstrap
 * cleanly from whatever state the failed boot left behind. A manual retry button
 * lets the user force an immediate check.
 */
export default function ServiceUnavailableScreen() {
  const { t } = useTranslation();
  const clearBlocking = useBlockingStore((state) => state.clearBlocking);
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const isCheckingRef = useRef(false);
  const inTelegram = isInTelegramWebApp();

  const recover = useCallback(() => {
    clearBlocking();
    if (hasEverReachedBackend()) {
      // The app was already loaded and merely covered by this overlay — its
      // routes/forms are still mounted with their state. Lift the overlay and
      // refetch instead of a hard reload that would discard unsaved input.
      void queryClient.invalidateQueries();
    } else {
      // The initial bootstrap never reached the backend (blank loader) — reload
      // to re-bootstrap cleanly now that it is back.
      window.location.reload();
    }
  }, [clearBlocking, queryClient]);

  // Manual retry: immediate probe with a visible checking state.
  const handleRetry = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      if (await pingBackend()) {
        recover();
      }
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [recover]);

  // Auto-recovery: probe immediately on mount, then every POLL_INTERVAL_MS.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (await pingBackend()) {
        if (!cancelled) recover();
      }
    };
    void tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [recover]);

  const screenRef = useFocusTrap<HTMLDivElement>(true, { lockScroll: false });

  return (
    <div
      ref={screenRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="service-unavailable-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-950 p-6"
    >
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-dark-800">
            <CloudWarningIcon className="h-12 w-12 text-warning-500" />
          </div>
        </div>

        {/* Title */}
        <h1 id="service-unavailable-title" className="mb-4 text-2xl font-bold text-white">
          {t('blocking.serviceUnavailable.title')}
        </h1>

        {/* Message */}
        <p className="mb-6 text-lg text-dark-400">{t('blocking.serviceUnavailable.description')}</p>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-dark-800 px-6 py-4 font-semibold text-white transition-all duration-200 hover:bg-dark-700 disabled:bg-dark-800 disabled:opacity-60"
        >
          {isChecking ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('blocking.serviceUnavailable.checking')}
            </>
          ) : (
            <>
              <RestartIcon className="h-5 w-5" />
              {t('blocking.serviceUnavailable.retry')}
            </>
          )}
        </button>

        {/* Close button — Telegram Mini App only (a browser tab can't be closed
            by script). Reliably exits the Mini App instead of routing back. */}
        {inTelegram && (
          <button
            onClick={closeTelegramApp}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dark-700 px-6 py-4 font-semibold text-dark-300 transition-colors duration-200 hover:bg-dark-800 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
            {t('blocking.serviceUnavailable.close')}
          </button>
        )}

        {/* Decorative dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-warning-500"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-warning-500"
            style={{ animationDelay: '300ms' }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-warning-500"
            style={{ animationDelay: '600ms' }}
          />
        </div>

        <p className="mt-4 text-sm text-dark-500">{t('blocking.serviceUnavailable.hint')}</p>
      </div>
    </div>
  );
}
