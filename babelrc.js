// Bu klasöre özel Babel ayarı — kök babel.config.js'teki overrides.test
// deseninin yerine geçti (Metro'nun cache-key hesaplamasıyla çakışıyordu).
// WatermelonDB modelleri (@field, @date, @children decorator'ları) burada
// tanımlı sınıf alanlarını "loose" modda derlemek için gerekli.
module.exports = {
  plugins: [
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ],
};