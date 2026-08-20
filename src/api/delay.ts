// src/api/delay.ts
// Gerçek network gecikmesini simüle etmek için — Faz 2'de bu dosya tamamen kalkacak
export const delay = (ms: number = 400) => new Promise((resolve) => setTimeout(resolve, ms));