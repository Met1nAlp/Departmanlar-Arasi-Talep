// src/i18n/translations/tr.ts — varsayılan dil (fabrika sahası Türkçe).
export const tr: {
  auth: {
    deviceEnroll: {
      title: string;
      subtitle: string;
      codePlaceholder: string;
      codeRequired: string;
      submit: string;
      errorGeneric: string;
    };
    login: {
      title: string;
      subtitle: string;
      usernamePlaceholder: string;
      usernameRequired: string;
      passwordPlaceholder: string;
      passwordRequired: string;
      submit: string;
      errorGeneric: string;
    };
  };
  common: {
    retry: string;
    cancel: string;
    save: string;
  };
} = {
  auth: {
    deviceEnroll: {
      title: 'Cihaz Kaydı',
      subtitle: 'Bu cihaz henüz kayıtlı değil. Sistem yöneticinizden aldığınız kayıt kodunu girin.',
      codePlaceholder: 'Kayıt kodu',
      codeRequired: 'Kayıt kodu gerekli',
      submit: 'Cihazı Kaydet',
      errorGeneric: 'Cihaz kaydı başarısız. Tekrar deneyin.',
    },
    login: {
      title: 'Talep Uygulaması',
      subtitle: 'Yetkili girişi',
      usernamePlaceholder: 'Kullanıcı adı',
      usernameRequired: 'Kullanıcı adı gerekli',
      passwordPlaceholder: 'Şifre',
      passwordRequired: 'Şifre gerekli',
      submit: 'Giriş Yap',
      errorGeneric: 'Giriş yapılamadı. Tekrar deneyin.',
    },
  },
  common: {
    retry: 'Tekrar Dene',
    cancel: 'Vazgeç',
    save: 'Kaydet',
  },
};
