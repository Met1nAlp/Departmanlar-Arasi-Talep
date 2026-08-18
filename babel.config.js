// babel.config.js
//
// Proje şimdiye kadar Expo'nun varsayılan (dosyasız) babel ayarlarına
// güveniyordu. WatermelonDB modelleri (@field, @date, @children gibi
// decorator'lar — bkz. src/infrastructure/db/models) decorators plugin'i
// gerektirdiği için bu dosya eklendi (E3, Plan Bölüm 10.3/12.3).
//
// NOT: class-properties/private-methods/private-property-in-object
// pluginleri artık burada DEĞİL — src/infrastructure/db/models/.babelrc.js
// içine taşındı. Sebep: Metro'nun cache-key hesaplaması bu kök dosyayı
// filename olmadan okuyor; overrides.test gibi desen eşleştirmesi içeren
// bir kök config bu adımda "no filename was passed to Babel" hatasıyla
// bundling'i düşürüyor. Klasöre özel .babelrc.js aynı sonucu, desen
// eşleştirmesine hiç gerek kalmadan, Metro'yu bozmadan sağlıyor.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ],
  };
};