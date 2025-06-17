import { createThemes } from 'tw-colors';
import plugin from 'tailwindcss/plugin';

// Modern black and white colors
const colorPaper = '#FFFFFF'; // Pure white for main background
const colorSepia = '#F8F8F8'; // Very light gray for secondary elements
const colorInk = '#111111'; // Deep black for text
const colorAccent = '#000000'; // Pure black for accents
const colorParchment = '#FFFFFF'; // Pure white for cards
const colorBorder = '#E5E5E5'; // Light gray for borders
const colorHighlight = '#FF3B30'; // Vibrant red for highlights
const colorSuccess = '#34C759'; // Green for success states

// Dark mode colors
const colorDarkBg = '#111111'; // Deep black background
const colorDarkCard = '#1A1A1A'; // Slightly lighter black for cards
const colorDarkText = '#FFFFFF'; // Pure white for text
const colorDarkMuted = '#A3A3A3'; // Cool gray for muted text
const colorDarkBorder = '#262626'; // Dark gray for borders
const colorDarkAccent = '#FF3B30'; // Same vibrant red for highlights
const colorDarkSuccess = '#30D158'; // Green for success states in dark mode

// Light mode colors
const colorMuted = '#666666'; // Medium gray for muted text (light mode)

export default {
  theme: {
    extend: {
      colors: {
        secondary: colorParchment,
        tertiary: colorSepia,
        neutral: colorInk,
        brand: colorAccent,
        background: colorPaper,
        border: colorBorder,
        highlight: colorHighlight,
      },
      fontFamily: {
        sans: [
          'Space Grotesk',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    createThemes(
      {
        light: {
          primary: colorAccent,
          secondary: colorParchment,
          tertiary: colorSepia,
          neutral: colorInk,
          info: colorMuted,
          beige: colorParchment,
          gray: colorPaper,
          brand: colorAccent,
          background: colorPaper,
          border: colorBorder,
          highlight: colorHighlight,
          // states:
          's-success': colorSuccess,
          's-error': colorHighlight,
          's-warning': colorHighlight,
          's-info': colorMuted,
          's-info-1': colorMuted,
          // components:
          'c-default': colorInk,
          'c-hover': colorInk,
          'c-pressed': colorMuted,
          'c-disabled-1': colorMuted,
          'c-disabled-2': colorParchment,
          'c-error': colorHighlight,
          // icons:
          'i-primary': colorMuted,
          'i-secondary': colorParchment,
          'i-tertiary': colorInk,
          // fonts:
          'f-primary': colorInk,
          'f-secondary': colorParchment,
          'f-tertiary': colorMuted,
          'f-disabled-1': colorMuted,
          'f-disabled-2': colorParchment,
          // backgrounds:
          'bg-primary': colorPaper,
          'bg-secondary': colorParchment,
          'bg-tertiary': colorSepia,
          'bg-card': colorParchment,
          // borders:
          'border-secondary': colorParchment,
          'border-tertiary': colorSepia,
          'border-neutral': colorInk,
          'border-brand': colorAccent,
        },
        dark: {
          primary: colorDarkAccent,
          secondary: colorDarkCard,
          tertiary: colorDarkBg,
          brand: colorDarkAccent,
          neutral: colorDarkText,
          info: colorDarkMuted,
          background: colorDarkBg,
          border: colorDarkBorder,
          highlight: colorDarkAccent,
          // states:
          's-success': colorDarkSuccess,
          's-error': colorDarkAccent,
          's-warning': colorDarkAccent,
          's-info': colorDarkMuted,
          's-info-1': colorDarkMuted,
          // components:
          'c-default': colorDarkText,
          'c-hover': colorDarkText,
          'c-pressed': colorDarkMuted,
          'c-disabled-1': colorDarkMuted,
          'c-disabled-2': colorDarkCard,
          'c-error': colorDarkAccent,
          // icons:
          'i-primary': colorDarkMuted,
          'i-secondary': colorDarkCard,
          'i-tertiary': colorDarkText,
          // fonts:
          'f-primary': colorDarkText,
          'f-secondary': colorDarkCard,
          'f-tertiary': colorDarkMuted,
          'f-disabled-1': colorDarkMuted,
          'f-disabled-2': colorDarkCard,
          // backgrounds:
          'bg-primary': colorDarkBg,
          'bg-secondary': colorDarkCard,
          'bg-tertiary': colorDarkBg,
          'bg-card': colorDarkCard,
          // borders:
          'border-secondary': colorDarkCard,
          'border-tertiary': colorDarkBg,
          'border-neutral': colorDarkText,
          'border-brand': colorDarkAccent,
        },
      },
      { defaultTheme: 'light' },
    ),
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '@layer components': {
          '.mas-banner': {
            fontSize: '42px',
            fontWeight: '700',
            fontFamily: theme('fontFamily.display'),
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
          },
          '.mas-title': {
            fontSize: '36px',
            fontWeight: '700',
            fontFamily: theme('fontFamily.display'),
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
          },
          '.mas-subtitle': {
            fontSize: '24px',
            fontWeight: '600',
            fontFamily: theme('fontFamily.display'),
            lineHeight: '1.4',
          },
          '.mas-h2': {
            fontSize: '20px',
            fontWeight: '600',
            fontFamily: theme('fontFamily.display'),
            lineHeight: '1.4',
          },
          '.mas-h3': {
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: theme('fontFamily.display'),
            lineHeight: '1.5',
          },
          '.mas-buttons': {
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.5',
          },
          '.mas-menu-active': {
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.5',
          },
          '.mas-menu-default': {
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.5',
          },
          '.mas-body': {
            fontSize: '16px',
            fontWeight: '400',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.6',
          },
          '.mas-body2': {
            fontSize: '14px',
            fontWeight: '400',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.6',
          },
          '.mas-caption': {
            fontSize: '12px',
            fontWeight: '400',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.5',
          },
          '.active-button': {
            '@apply transition-all duration-100 ease-in-out border border-border':
              {},
            '&:hover': {
              '@apply -translate-y-[2%] shadow-md': {},
            },
            '&:active': {
              '@apply translate-y-[2%] shadow-none': {},
            },
          },
        },
      });
    }),
  ],
};
