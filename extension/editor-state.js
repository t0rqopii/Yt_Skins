/* Immutable history and serialized persistence. Browser-independent. */
(function(root) {
  'use strict';
  function create(initial, {normalize, patch, write, onChange = () => {}, onStatus = () => {}, delay = 180}) {
    let value = normalize(initial), past = [], future = [], timer = null, chain = Promise.resolve();
    let revision = 0, savedRevision = 0, group = null, ready = false;
    const ownWrites = new Set();
    function notify() { onChange(value, {undo:past.length > 0, redo:future.length > 0}); }
    function flush() {
      clearTimeout(timer); timer = null;
      if (savedRevision === revision) return chain;
      const snapshot = value, current = revision, signature = JSON.stringify(snapshot);
      chain = chain.catch(() => {}).then(async () => {
        ownWrites.add(signature);
        try {
          await write(snapshot);
          savedRevision = Math.max(savedRevision, current);
          if (current === revision) onStatus('Saved on this device');
        } catch (error) { onStatus('Could not save · change a control to retry'); throw error; }
        finally { ownWrites.delete(signature); }
      });
      chain.catch(() => {});
      return chain;
    }
    function schedule() { revision++; onStatus('Saving…'); clearTimeout(timer); timer = setTimeout(flush, delay); }
    function commit(next, key) {
      const normalized = normalize(next);
      if (JSON.stringify(normalized) === JSON.stringify(value)) return;
      if (!key || key !== group) { past.push(value); if (past.length > 60) past.shift(); }
      group = key || null; future = []; value = normalized; schedule(); notify();
    }
    return {
      get value() { return value; },
      get dirty() { return revision !== savedRevision; },
      initialize(next) { if (ready || revision) return; ready = true; value = normalize(next); notify(); },
      update(changes, key) { commit(patch(value, changes), key); },
      replace(next) { commit(next); },
      endGroup() { group = null; },
      undo() { if (!past.length) return; future.push(value); value = past.pop(); group = null; schedule(); notify(); },
      redo() { if (!future.length) return; past.push(value); value = future.pop(); group = null; schedule(); notify(); },
      receive(next) {
        const normalized = normalize(next), signature = JSON.stringify(normalized);
        if (ownWrites.has(signature) || revision !== savedRevision) return false;
        ready = true;
        if (signature === JSON.stringify(value)) return false;
        past = []; future = []; group = null; value = normalized; notify(); return true;
      },
      flush
    };
  }
  const api = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeEditorState = api;
})(globalThis);
