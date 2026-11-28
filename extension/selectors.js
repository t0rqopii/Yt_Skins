/* YouTube compatibility map: edit anchors here, never scatter them through the runtime. */
(function(root) {
  const surfaces = {
    header:'ytd-masthead', sidebar:'ytd-guide-renderer, ytd-mini-guide-renderer',
    chips:'ytd-feed-filter-chip-bar-renderer #chips-wrapper', search:'yt-searchbox .ytSearchboxComponentInputContainer, yt-searchbox:not(:has(.ytSearchboxComponentInputContainer)) form, ytd-searchbox #search-form',
    menus:'ytd-menu-popup-renderer, tp-yt-paper-dialog', player:'.html5-video-player .ytp-chrome-bottom'
  };
  const backdropLayers = 'body, ytd-app, ytd-page-manager, ytd-browse, ytd-watch-flexy, ytd-search, ytd-rich-grid-renderer, #content.ytd-app, ytd-two-column-browse-results-renderer, ytd-section-list-renderer, ytd-rich-grid-renderer > #contents';
  const titleBoxes='#video-title, yt-lockup-view-model h3, yt-lockup-metadata-view-model h3, ytd-watch-metadata h1';
  const thumbnailImages='ytd-thumbnail img, yt-thumbnail-view-model img, yt-thumbnail-view-model > svg';
  const typeTargets = {
    pageFont:'html, body, ytd-app, ytd-app :where(yt-formatted-string, a, button, input, textarea, h1, h2, h3, p, span, yt-content-metadata-view-model)', brandFont:'.yts-brand, .yts-brand > span', titleFont:'#video-title, #video-title-link, yt-lockup-view-model h3, yt-lockup-view-model h3 a, yt-lockup-view-model h3 span, [class*="lockupmetadataviewmodeltitle" i], [class*="lockup-metadata-view-model__title" i]',
    channelFont:'ytd-channel-name, ytd-channel-name :is(a, yt-formatted-string, span), #attributed-channel-name, yt-content-metadata-view-model a[href^="/@"], yt-content-metadata-view-model a[href^="/channel/"]', descriptionFont:'#description, #description-text, #description :is(span, p, a, yt-formatted-string)',
    searchFont:'yt-searchbox input, ytd-searchbox input', categoryFont:'chip-shape .ytChipShapeText, yt-chip-cloud-chip-renderer #text',
    sidebarFont:'ytd-guide-entry-renderer #endpoint, ytd-mini-guide-entry-renderer #endpoint, ytd-guide-entry-renderer :is(yt-formatted-string, .title, span), ytd-mini-guide-entry-renderer :is(yt-formatted-string, .title, span)', metadataFont:'#metadata-line, #metadata-line span, yt-content-metadata-view-model, .ytContentMetadataViewModelMetadataText'
  };
  function hiddenSelectors(s) {
    const hidden = [];
    if (s.hideChannel) hidden.push('ytd-rich-grid-media #channel-name', 'ytd-video-renderer #channel-name', 'ytd-video-renderer #attributed-channel-name', 'ytd-grid-video-renderer #channel-name', 'ytd-compact-video-renderer #channel-name', 'yt-lockup-view-model .ytContentMetadataViewModelIcon', 'yt-lockup-view-model .ytContentMetadataViewModelMetadataRow a[href^="/@"]', 'yt-lockup-view-model .ytContentMetadataViewModelMetadataRow a[href^="/channel/"]');
    if (s.hideViews) hidden.push('ytd-rich-grid-media #metadata-line span.inline-metadata-item:first-of-type', 'ytd-video-renderer #metadata-line span.inline-metadata-item:first-of-type', 'ytd-compact-video-renderer #metadata-line span.inline-metadata-item:first-of-type', 'yt-lockup-view-model .ytContentMetadataViewModelLeadingIcon', 'yt-lockup-view-model .ytContentMetadataViewModelLeadingIcon ~ .ytContentMetadataViewModelMetadataText:not(.ytContentMetadataViewModelMetadataTextLastPart)', 'yt-lockup-view-model .ytContentMetadataViewModelMetadataText[aria-label*="views" i]');
    if (s.hideDate) hidden.push('ytd-rich-grid-media #metadata-line span.inline-metadata-item:nth-of-type(2)', 'ytd-video-renderer #metadata-line span.inline-metadata-item:nth-of-type(2)', 'ytd-compact-video-renderer #metadata-line span.inline-metadata-item:nth-of-type(2)', 'yt-lockup-view-model .ytContentMetadataViewModelMetadataTextLastPart[aria-label]:not([aria-label*="views" i])');
    if (s.hideChannel || s.hideViews || s.hideDate) hidden.push('yt-lockup-view-model .ytContentMetadataViewModelDelimiter');
    if (s.hideAvatars) hidden.push('ytd-rich-grid-media #avatar-link', 'ytd-video-renderer #channel-thumbnail', 'ytd-video-renderer #channel-info #avatar', 'ytd-compact-video-renderer #channel-thumbnail', 'yt-lockup-view-model .ytLockupViewModelAvatar', 'yt-lockup-view-model .ytLockupMetadataViewModelAvatar', 'yt-lockup-view-model yt-avatar-stack-view-model', 'yt-lockup-view-model yt-avatar-view-model');
    if (s.hideShorts) hidden.push('ytd-rich-section-renderer:has(ytd-reel-shelf-renderer)', 'ytd-reel-shelf-renderer', 'ytd-rich-shelf-renderer[is-shorts]', 'grid-shelf-view-model:has(a.shortsLockupViewModelHostEndpoint)', 'ytd-guide-entry-renderer:has(a[href^="/shorts"])', 'ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])');
    if (s.hideComments) hidden.push('ytd-comments', '#comments.ytd-watch-flexy');
    if (s.hideSidebar) hidden.push('ytd-guide-renderer', 'ytd-mini-guide-renderer');
    if (s.hideRecommendations) hidden.push('ytd-watch-flexy #secondary');
    if (s.hideChips) hidden.push('ytd-feed-filter-chip-bar-renderer', 'yt-chip-cloud-renderer');
    if (s.hideEndScreen) hidden.push('.ytp-endscreen-content', '.ytp-ce-element');
    if (s.hideNotifications) hidden.push('ytd-notification-topbar-button-renderer');
    if (s.hideCreate) hidden.push('ytd-masthead #buttons ytd-button-renderer:has(a[href*="upload"])', 'ytd-masthead #create-icon');
    if (s.hideDescription) hidden.push('ytd-watch-metadata #description');
    if (s.hideVideoCount) hidden.push('ytd-playlist-thumbnail #overlays', 'ytd-thumbnail-overlay-bottom-panel-renderer');
    return hidden;
  }
  const elements = {
    card:'ytd-rich-item-renderer > #content, .feed > ytd-rich-item-renderer',
    thumbnail:'ytd-thumbnail, yt-thumbnail-view-model',
    title:'#video-title, yt-lockup-view-model h3', channel:typeTargets.channelFont, metadata:'#metadata-line, yt-content-metadata-view-model',
    search:surfaces.search, category:'.ytChipShapeChip, yt-chip-cloud-chip-renderer',
    button:'ytd-button-renderer button, yt-button-shape button', brand:'.yts-brand',
    description:'ytd-watch-metadata #description', playerFrame:'.html5-video-player'
  };
  typeTargets.titleFont+=', yt-lockup-metadata-view-model h3, yt-lockup-metadata-view-model h3 a, yt-lockup-metadata-view-model h3 span, ytd-watch-metadata h1, ytd-watch-metadata h1 yt-formatted-string';
  // Watch-page surround only; leave the decoded video and its geometry alone.
  const playerBackdrop = 'ytd-watch-flexy #player-container-outer, ytd-watch-flexy #player-container-inner, ytd-watch-flexy #player-full-bleed-container, ytd-watch-flexy #full-bleed-container, ytd-watch-flexy #player, ytd-watch-flexy ytd-player, ytd-watch-flexy ytd-player #container, ytd-watch-flexy .html5-video-player:not(.ytp-fullscreen), ytd-watch-flexy .html5-video-container';
  const watchBackdrop = 'ytd-watch-flexy #columns, ytd-watch-flexy #primary, ytd-watch-flexy #primary-inner, ytd-watch-flexy #secondary, ytd-watch-flexy #secondary-inner, ytd-watch-flexy #below, ytd-watch-metadata';
  const sidebarScrollers = 'ytd-guide-renderer #guide-content, ytd-guide-renderer #guide-inner-content, ytd-guide-renderer tp-yt-app-drawer #contentContainer, ytd-guide-renderer #sections';
  const frameTargets = {
    thumbnail:':is(ytd-thumbnail, yt-thumbnail-view-model)',
    avatar:':is(.ytLockupMetadataViewModelAvatar, .ytLockupViewModelAvatar, ytd-rich-grid-media #avatar-link, ytd-video-renderer #channel-thumbnail, ytd-compact-video-renderer #channel-thumbnail, ytd-video-owner-renderer #avatar, ytd-comment-view-model #author-thumbnail, #avatar-btn, .user-avatar)'
  };
  const api = {surfaces, backdropLayers, typeTargets, hiddenSelectors, elements, titleBoxes, thumbnailImages, playerBackdrop, watchBackdrop, sidebarScrollers, frameTargets};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeSelectors = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
