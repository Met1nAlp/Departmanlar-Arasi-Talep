// src/design-system/tokens/elevation.ts
// React Native'de gölge = elevation (Android) + shadow* (iOS)
export const elevation = {
  none: {},
  low: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  medium: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;