import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold tracking-[0.01em] transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border border-accent-400/20 text-white',
          'bg-[linear-gradient(135deg,rgba(var(--color-accent-500),1),rgba(56,189,248,0.94))]',
          'shadow-[0_16px_32px_rgba(var(--color-accent-500),0.22),inset_0_1px_0_rgba(255,255,255,0.16)]',
          'hover:brightness-[1.04] hover:shadow-[0_20px_38px_rgba(var(--color-accent-500),0.28),inset_0_1px_0_rgba(255,255,255,0.2)]',
          'active:brightness-[0.96]',
        ],
        secondary: [
          'border border-dark-700/70 bg-dark-950/60 text-dark-100',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(2,6,23,0.18)]',
          'hover:border-dark-600/80 hover:bg-dark-800/70 hover:text-dark-50',
          'light:border-champagne-300/80 light:bg-white/85 light:text-champagne-800',
          'light:shadow-[0_10px_24px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]',
          'light:hover:border-champagne-400 light:hover:bg-champagne-100 light:hover:text-champagne-900',
        ],
        ghost: [
          'text-dark-300',
          'hover:text-dark-50 hover:bg-dark-800/60',
          'active:bg-dark-800/80',
          'light:text-champagne-700 light:hover:bg-champagne-200/50 light:hover:text-champagne-900',
        ],
        destructive: [
          'border border-error-500/35 text-error-300',
          'bg-[linear-gradient(180deg,rgba(239,68,68,0.16),rgba(239,68,68,0.08))]',
          'hover:border-error-500/50 hover:bg-[linear-gradient(180deg,rgba(239,68,68,0.2),rgba(239,68,68,0.1))]',
          'active:brightness-[0.96]',
          'light:border-error-300 light:text-error-700',
        ],
        outline: [
          'border border-dark-700/70 bg-transparent text-dark-200',
          'hover:border-dark-600/70 hover:bg-dark-800/45 hover:text-dark-50',
          'active:bg-dark-800/60',
          'light:border-champagne-300/80 light:text-champagne-800',
          'light:hover:border-champagne-400 light:hover:bg-champagne-100 light:hover:text-champagne-900',
        ],
        link: [
          'text-accent-400',
          'hover:text-accent-300 hover:underline',
          'active:text-accent-500',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-[12px]',
        md: 'h-11 px-4 text-sm rounded-[14px]',
        lg: 'h-12 px-6 text-base rounded-[16px]',
        icon: 'h-11 w-11 rounded-[14px]',
        'icon-sm': 'h-9 w-9 rounded-[12px]',
        'icon-lg': 'h-12 w-12 rounded-[16px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
