importScripts('media-store.js');
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type !== 'get-background-asset' || sender.id !== chrome.runtime.id || !sender.tab || !sender.url?.startsWith('https://www.youtube.com/')) return;
  ThemeMedia.get(request.version).then(async asset => {
    if (!asset || asset.version !== request.version || !(asset.blob instanceof Blob)) return sendResponse(null);
    const bytes = new Uint8Array(await asset.blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    sendResponse({ version: asset.version, type: asset.type, data: btoa(binary) });
  }).catch(() => sendResponse(null));
  return true;
});
