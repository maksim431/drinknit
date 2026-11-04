// Тексты из админки (content.js) → на страницу. Выполняется после content.js и texts.js, до data.js и desktop.js
(function () {
  try {
    var C = window.DRINKNIT_CONTENT || {};
    if (window.DrinknitTexts) {
      window.DrinknitTexts.apply(document.body, C.texts);
      window.DrinknitTexts.applyMeta(C.meta);
    }
  } catch (e) { /* без текстов из админки страница работает с текстами из разметки */ }
})();
