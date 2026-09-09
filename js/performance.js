(() => {
  'use strict';
  // Prevent repeated rapid clicks from opening the same member feature modal twice.
  const originalFeatureAction = window.featureAction;
  if (typeof originalFeatureAction === 'function' && !originalFeatureAction.__stableWrapped) {
    let featureBusy = false;
    const wrapped = function () {
      if (featureBusy) return;
      featureBusy = true;
      try { return originalFeatureAction.apply(this, arguments); }
      finally { setTimeout(() => { featureBusy = false; }, 180); }
    };
    wrapped.__stableWrapped = true;
    window.featureAction = wrapped;
  }

  // Render expensive card enhancements only when the browser is idle when possible.
  if ('requestIdleCallback' in window && typeof window.enhanceCards === 'function') {
    const baseEnhanceCards = window.enhanceCards;
    if (!baseEnhanceCards.__stableIdleWrapped) {
      const idleWrapped = function () {
        const args = arguments;
        requestIdleCallback(() => baseEnhanceCards.apply(this, args), { timeout: 500 });
      };
      idleWrapped.__stableIdleWrapped = true;
      window.enhanceCards = idleWrapped;
    }
  }
})();
