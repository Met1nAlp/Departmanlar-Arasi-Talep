// src/design-system/tokens/typography.ts
import { scale } from './scale';

export const typography = {
  h1: { fontSize: scale(28), fontWeight: '700' as const, lineHeight: scale(34) },
  h2: { fontSize: scale(22), fontWeight: '600' as const, lineHeight: scale(28) },
  body: { fontSize: scale(18), fontWeight: '400' as const, lineHeight: scale(26) },
  bodyBold: { fontSize: scale(18), fontWeight: '600' as const, lineHeight: scale(26) },
  caption: { fontSize: scale(15), fontWeight: '400' as const, lineHeight: scale(20) },
} as const;