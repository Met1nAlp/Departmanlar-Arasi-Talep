export * from '../design-system/tokens';

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  blue: '#0057B8',

  // Mavinin tonları — durum farklılaştırma ve derinlik için
  // (yeni renk eklemek yerine aynı rengin açık/koyu tonlarını kullanıyoruz)
  blueLight: '#E6F0FA',   // hafif mavi zemin (seçili kart, rozet arka planı)
  blueMedium: '#4D8FDB',  // ikincil vurgular
  blueDark: '#003F7D',    // basılı/aktif buton, koyu başlık

  // Siyahın tonları — metin hiyerarşisi için
  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',

  // Yapısal
  border: '#E0E0E0',
  background: '#FFFFFF',
  surface: '#F7F9FC', 
} as const;

export const statusColors = {
    
  TALEP_ALINDI: colors.blueLight,
  HAZIRLANIYOR: colors.blueMedium,
  HAZIR: colors.blue,
  YOLDA: colors.blueDark,
  TESLIM_EDILDI: colors.black,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
};