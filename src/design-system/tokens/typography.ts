// src/design-system/tokens/typography.ts

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 18, fontWeight: '400' as const, lineHeight: 26 },
  bodyBold: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  caption: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
} as const;