/* SL Sakura Language System */
(function () {
  'use strict';

  const dictionaries = {
    en: {
      admin:'Admin', badges:'Badges', blog:'Blog', chatbot:'AI Chatbot', coffee:'Buy Me a Coffee',
      contact:'Contact / Email', favorites:'Favorites', flashcards:'Flashcards', forum:'Forum',
      googleSignin:'Sign in with Google', guest:'Guest', leaderboard:'Leaderboard', login:'Login',
      logout:'Logout', mocktest:'JLPT Mock Test', news:'Japan Updates', notLoggedIn:'Not logged in',
      progress:'Progress', quiz:'Quiz', resources:'Resources', search:'Search Resources', signup:'Sign Up',
      spacedrepetition:'Review', support:'Support', vocabulary:'Vocabulary', whatsapp:'WhatsApp Support'
    },
    si: {
      admin:'පරිපාලක', badges:'බැජ්', blog:'බ්ලොග්', chatbot:'AI චැට්බොට්', coffee:'මට Coffee එකක් දෙන්න',
      contact:'සම්බන්ධ වන්න / Email', favorites:'ප්‍රියතම', flashcards:'ෆ්ලෑෂ් කාඩ්', forum:'සාකච්ඡා මණ්ඩපය',
      googleSignin:'Google සමඟ ලොග් වන්න', guest:'අමුත්තා', leaderboard:'ප්‍රමුඛතා පුවරුව', login:'ලොග් වන්න',
      logout:'ඉවත් වන්න', mocktest:'JLPT ආදර්ශ පරීක්ෂණය', news:'ජපාන යාවත්කාලීන', notLoggedIn:'ලොග් වී නැත',
      progress:'ප්‍රගතිය', quiz:'ප්‍රශ්නාවලිය', resources:'සම්පත්', search:'සම්පත් සොයන්න', signup:'ලියාපදිංචි වන්න',
      spacedrepetition:'නැවත අධ්‍යයනය', support:'සහාය', vocabulary:'වචන මාලාව', whatsapp:'WhatsApp සහාය'
    },
    ja: {
      admin:'管理者', badges:'バッジ', blog:'ブログ', chatbot:'AIチャット', coffee:'コーヒーで応援',
      contact:'お問い合わせ / メール', favorites:'お気に入り', flashcards:'フラッシュカード', forum:'フォーラム',
      googleSignin:'Googleでログイン', guest:'ゲスト', leaderboard:'ランキング', login:'ログイン',
      logout:'ログアウト', mocktest:'JLPT模擬試験', news:'日本アップデート', notLoggedIn:'未ログイン',
      progress:'学習進捗', quiz:'クイズ', resources:'教材', search:'教材を検索', signup:'新規登録',
      spacedrepetition:'復習', support:'サポート', vocabulary:'語彙', whatsapp:'WhatsAppサポート'
    }
  };

  const staticTranslations = {
    en: {
      'Login to Unlock More Features!':'Login to Unlock More Features!',
      'Get personalized learning experience':'Get personalized learning experience',
      'Member Features':'Member Features',
      'Personalized Learning Path':'Personalized Learning Path',
      'Resource Collections':'Resource Collections',
      'Daily Japanese Challenge':'Daily Japanese Challenge',
      'Advanced Resource Filters':'Advanced Resource Filters',
      'Japanese Study Assistant':'Japanese Study Assistant',
      'Study Planner':'Study Planner',
      'Download Center':'Download Center'
    },
    si: {
      'Login to Unlock More Features!':'තවත් පහසුකම් ලබාගැනීමට ලොග් වන්න!',
      'Get personalized learning experience':'ඔබටම ගැළපෙන අධ්‍යයන අත්දැකීමක් ලබාගන්න',
      'Member Features':'සාමාජික පහසුකම්',
      'Personalized Learning Path':'පුද්ගලීකරණය කළ අධ්‍යයන මාර්ගය',
      'Resource Collections':'සම්පත් එකතුව',
      'Daily Japanese Challenge':'දෛනික ජපන් අභියෝගය',
      'Advanced Resource Filters':'උසස් සම්පත් පෙරහන්',
      'Japanese Study Assistant':'ජපන් අධ්‍යයන සහායක',
      'Study Planner':'අධ්‍යයන සැලසුම්කරු',
      'Download Center':'බාගත කිරීමේ මධ්‍යස්ථානය'
    },
    ja: {
      'Login to Unlock More Features!':'ログインしてさらに多くの機能を利用！',
      'Get personalized learning experience':'自分に合った学習体験を始めよう',
      'Member Features':'メンバー機能',
      'Personalized Learning Path':'パーソナライズ学習パス',
      'Resource Collections':'教材コレクション',
      'Daily Japanese Challenge':'毎日の日本語チャレンジ',
      'Advanced Resource Filters':'高度な教材フィルター',
      'Japanese Study Assistant':'日本語学習アシスタント',
      'Study Planner':'学習プランナー',
      'Download Center':'ダウンロードセンター'
    }
  };

  let activeLang = localStorage.getItem('slSakuraLanguage') || 'en';

  function translateStatic(lang) {
    const map = staticTranslations[lang] || staticTranslations.en;
    document.querySelectorAll('h1,h2,h3,h4,p,button,span,div').forEach(el => {
      if (el.children.length === 0 && el.dataset.langStatic !== undefined) {
        const key = el.dataset.langStatic;
        if (map[key]) el.textContent = map[key];
      }
    });
  }

  function markStaticTexts() {
    const english = staticTranslations.en;
    document.querySelectorAll('h1,h2,h3,h4,p,button,span,div').forEach(el => {
      if (el.children.length === 0 && !el.dataset.langStatic) {
        const text = (el.textContent || '').trim();
        if (Object.prototype.hasOwnProperty.call(english, text)) el.dataset.langStatic = text;
      }
    });
  }

  function applyLanguage(lang) {
    if (!dictionaries[lang]) lang = 'en';
    activeLang = lang;
    localStorage.setItem('slSakuraLanguage', lang);
    document.documentElement.lang = lang;

    const dict = dictionaries[lang];
    document.querySelectorAll('[data-lang]').forEach(el => {
      const key = el.dataset.lang;
      if (dict[key]) el.textContent = dict[key];
    });

    markStaticTexts();
    translateStatic(lang);

    const selector = document.getElementById('langSelector');
    if (selector && selector.value !== lang) selector.value = lang;

    document.dispatchEvent(new CustomEvent('slSakuraLanguageChanged', { detail: { lang } }));
  }

  window.changeLanguage = function(lang) {
    applyLanguage(lang);
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyLanguage(activeLang);
    const selector = document.getElementById('langSelector');
    if (selector) selector.addEventListener('change', e => applyLanguage(e.target.value));

    // Re-apply translations after dynamic auth/menu content is inserted.
    const observer = new MutationObserver(() => {
      if (activeLang !== 'en') {
        clearTimeout(window.__slLangTimer);
        window.__slLangTimer = setTimeout(() => applyLanguage(activeLang), 80);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
