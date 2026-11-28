/* Local extension storage for background assets, keyed by version. */
(function (root) {
  'use strict';
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('youtube-theme-studio-assets', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('assets');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  async function transaction(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', mode);
      const request = action(tx.objectStore('assets'));
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error('Asset storage was interrupted')); };
    });
  }
  root.ThemeMedia = {
    get: async version => {
      if (!version) return undefined;
      const asset = await transaction('readonly', store => store.get(version));
      if (asset) return asset;
      const legacy = await transaction('readonly', store => store.get('background'));
      return legacy && legacy.version === version ? legacy : undefined;
    },
    put: asset => transaction('readwrite', store => store.put(asset, asset.version)),
    remove: version => transaction('readwrite', store => store.delete(version))
  };
})(globalThis);
