/* One storage subscription per tab. Initial reads cannot overwrite newer events. */
(function(root) {
  'use strict';
  function create(storage, normalize) {
    const listeners = new Set(), changed = new Set();
    let state = {}, ready = false;
    function emit(keys) { for (const fn of listeners) fn(state, keys); }
    function onChange(changes, area) {
      if (area !== 'local') return;
      const keys = Object.keys(changes).filter(k => ['theme','profiles','activeProfile'].includes(k));
      if (!keys.length) return;
      for (const key of keys) { changed.add(key); state[key] = key === 'theme' ? normalize(changes[key].newValue) : changes[key].newValue; }
      if (ready) emit(keys);
    }
    storage.onChanged.addListener(onChange);
    storage.local.get(['theme','profiles','activeProfile'], data => {
      for (const key of ['theme','profiles','activeProfile']) if (!changed.has(key)) state[key] = key === 'theme' ? normalize(data[key]) : data[key];
      ready = true; emit(['theme','profiles','activeProfile']);
    });
    return {
      subscribe(fn) { listeners.add(fn); if (ready) fn(state, ['theme','profiles','activeProfile']); return () => listeners.delete(fn); },
      destroy() { listeners.clear(); storage.onChanged.removeListener(onChange); }
    };
  }
  root.ThemeRuntime = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  else root.ThemeState = create(chrome.storage, ThemeStudio.normalize);
})(typeof globalThis !== 'undefined' ? globalThis : this);
