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

  // YENİ (2026-08-26): "Acil" önceliği ile "hata/iptal" artık aynı kırmızıyı
  // paylaşmıyor — tehlike bandı sarısı gibi ayrı bir anlam taşıyor.
  amber: '#B45F06',
  amberLight: '#FDF0DC',
  // YENİ: "Teslim Edildi" artık nötr siyah değil, gerçek bir "iş bitti" yeşili.
  success: '#1E7A34',
  successLight: '#E7F6EB',
} as const;

export type RequestStatusKey =
  | 'TALEP_ALINDI'
  | 'HAZIRLANIYOR'
  | 'HAZIR'
  | 'YOLDA'
  | 'TESLIM_EDILDI'
  | 'IPTAL_EDILDI'
  | 'REDDEDILDI';

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
    bgColor: colors.success,
    icon: 'checkmark-done-outline',
    label: 'Teslim Edildi',
  },
  IPTAL_EDILDI: {
    color: colors.textSecondary,
    bgColor: colors.border,
    icon: 'close-circle-outline',
    label: 'İptal Edildi',
  },
  REDDEDILDI: {
    color: colors.danger,
    bgColor: colors.dangerLight,
    icon: 'close-circle-outline',
    label: 'Reddedildi',
  },
};


// src/design-system/tokens/colors.ts — mevcut nesneye eklenecek anahtarlar.
// Kural: her durum ailesinde bir açık YÜZEY ve bir koyu METİN tonu var.
// Rozet, şerit ve ilerleme çubuğu hep bu ikiliyi kullanıyor; böylece
// yeni bir durum eklendiğinde tek yerde iki satır yazmak yetiyor.

export const statusSurfaces = {
  // Hazır / tamamlandı
  successSurface: '#E4F5EF',
  successBorder: '#A8DCC8',
  successText: '#0F5A44',

  // Kısmi karşılama / senkron kuyruğu
  warningSurface: '#FDF2E0',
  warningBorder: '#F0D9A8',
  warningText: '#7A4A0B',
  warningBar: '#D89526', // ilerleme çubuğu dolgusu

  // Devam eden işlemler — mevcut blueLight ile aynı aileden
  accentSurface: '#E8F1FA',
  accentBorder: '#BFD8F0',
  accentText: '#14487F', // = blueDark

  // İptal / red / acil
  dangerSurface: '#FDECEC',
  dangerBorder: '#F3C4C4',
  dangerText: '#8F2626',

  // Mavi header üzerindeki ikincil metin. opacity yerine gerçek renk
  // kullanılıyor; opacity zeminle çarpıldığı için ekrandan ekrana kayıyordu.
  blueSubtle: '#BFD8F0',
  blueMuted: '#9FC6E8',
  dangerSubtle: '#F6C9C9',
} as const;

// statusTokens zaten her durum için ikon tutuyor (RequestTrackingScreen
// kullanıyor). Renk ailesini de oraya bağlıyoruz ki StatusChip, RequestCard
// ve timeline aynı kaynaktan beslensin.
export type StatusTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

export const statusTone: Record<string, StatusTone> = {
  TALEP_ALINDI: 'accent',
  HAZIRLANIYOR: 'accent',
  HAZIR: 'success',
  YOLDA: 'accent',
  TESLIM_EDILDI: 'success',
  IPTAL_EDILDI: 'danger',
  REDDEDILDI: 'danger',
};
