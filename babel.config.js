// babel.config.js
//
// Proje şimdiye kadar Expo'nun varsayılan (dosyasız) babel ayarlarına
// güveniyordu. WatermelonDB modelleri (@field, @date, @children gibi
// decorator'lar — bkz. src/infrastructure/db/models) decorators plugin'i
// gerektirdiği için bu dosya eklendi (E3, Plan Bölüm 10.3/12.3).
//
// legacy: true — WatermelonDB'nin decorator API'si legacy (Stage 1)
// decorator sözdizimine dayanır. Sıralama önemli: decorators plugin,
// class-properties'ten ÖNCE gelmeli (babel-preset-expo bunu zaten içerir,
// biz yalnızca decorators'ı üstüne ekliyoruz).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  };
};
