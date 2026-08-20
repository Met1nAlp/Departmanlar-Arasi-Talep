// src/i18n/translations/en.ts — Fatih'in web panel / olası ileri saha
// ekipleri için ikinci dil. `tr` ile AYNI şekli taşımalı (bkz. i18n/index.ts
// TranslationShape tipi — biri eksik anahtar eklerse tsc hata verir).
import type { tr } from './tr';

export const en: typeof tr = {
  auth: {
    deviceEnroll: {
      title: 'Device Registration',
      subtitle: 'This device is not registered yet. Enter the enrollment code provided by your administrator.',
      codePlaceholder: 'Enrollment code',
      codeRequired: 'Enrollment code is required',
      submit: 'Register Device',
      errorGeneric: 'Device registration failed. Please try again.',
    },
    login: {
      title: 'MTS Request App',
      subtitle: 'Supervisor login',
      usernamePlaceholder: 'Username',
      usernameRequired: 'Username is required',
      passwordPlaceholder: 'Password',
      passwordRequired: 'Password is required',
      submit: 'Sign In',
      errorGeneric: 'Sign in failed. Please try again.',
    },
  },
  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
  },
};
