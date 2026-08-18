// src/design-system/tokens/colors.ts

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  blue: '#0057B8',

  blueLight: '#E6F0FA',
  blueMedium: '#4D8FDB',
  blueDark: '#003F7D',

  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',

  border: '#E0E0E0',
  background: '#FFFFFF',
  surface: '#F7F9FC',

  danger: '#B3261E',
  dangerLight: '#FBEAE9',
  warning: '#8A5A00',
  warningLight: '#FFF4D6',
} as const;

export type RequestStatusKey =
  | 'TALEP_ALINDI'
  | 'HAZIRLANIYOR'
  | 'HAZIR'
  | 'YOLDA'
  | 'TESLIM_EDILDI';

export type StatusToken = {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
};

export const statusTokens: Record<RequestStatusKey, StatusToken> = {
  TALEP_ALINDI: {
    color: colors.blueDark,
    bgColor: colors.blueLight,
    icon: 'time-outline',
    label: 'Talep Alındı',
  },
  HAZIRLANIYOR: {
    color: colors.white,
    bgColor: colors.blueMedium,
    icon: 'cube-outline',
    label: 'Hazırlanıyor',
  },
  HAZIR: {
    color: colors.white,
    bgColor: colors.blue,
    icon: 'checkmark-circle-outline',
    label: 'Hazır',
  },
  YOLDA: {
    color: colors.white,
    bgColor: colors.blueDark,
    icon: 'car-outline',
    label: 'Yolda',
  },
  TESLIM_EDILDI: {
    color: colors.white,
    bgColor: colors.black,
    icon: 'checkmark-done-outline',
    label: 'Teslim Edildi',
  },
};