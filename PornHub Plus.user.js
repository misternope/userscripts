// ==UserScript==
// @author             Mr. Nope
// @version           2022-07-23
// @name                PornHub Plus
// @match              *://*.pornhub.com/*
// @match              *://*.pornhubpremium.com/*
// @description   A kinder PornHub. Because you're worth it.
// @date                2022-07-23
// @license          CC0
// ==/UserScript==

/**
 * # CHANGELOG
 *
 * ## 2022-07-22
 *
 * Adapting the script for modern user script managers that maximise their use of the WebExtension
 * API for higher quality and better performing solutions more integrated with the browser without
 * questionable implementation choices.
 *
 * Changes mean less meta-data and no more wrapper functions. It's currently only being tested in
 * FireMonkey but incompatibilities should be minor and simple to fix.
 *
 * ### Features
 *
 *   - **Redirect to free if a model has no premium videos**
 *     Videos pages of models with no premium content redirects to free, as many popular models
 *     don't make premium videos and there's no way to toggle free content. Removing "premium"
 *     from the URL can reveal tons of videos.
 *
 * ### Chores
 *
 *   - Adding the changelog which for now resides in the script itself.
 *   - Formatting properly and removing unnecessary wrapper functions.
 *   - Adding Prettier and EditorConfig formatter rules (not yet automated).
 *
 * ### Notes
 *
 *   - Switching from SemVer to DateVer for simplicity (nobody gives a shit except the updater).
 *   - Needs a major overhaul and should be rewritten for more structure.
 *   - Tooling would be useful: NPM, linting, formatting, versioning, changelog generation, etc.
 */

'use strict';

setTimeout(() => {
  const OPTIONS = {
    showTitles: JSON.parse(localStorage.getItem('plus_showTitles')) || false,
    loadMore: JSON.parse(localStorage.getItem('plus_loadMore')) || true,
    cinemaMode: JSON.parse(localStorage.getItem('plus_cinemaMode')) || false,
    openWithoutPlaylist: JSON.parse(localStorage.getItem('plus_openWithoutPlaylist')) || true,
    showOnlyHd: JSON.parse(localStorage.getItem('plus_showOnlyHd')) || false,
    redirectToVideos: JSON.parse(localStorage.getItem('plus_redirectToVideos')) || false,
    redirectPremiumVideos: JSON.parse(localStorage.getItem('plus_redirectPremiumVideos')) || false,
    hideWatchedVideos: JSON.parse(localStorage.getItem('plus_hideWatchedVideos')) || false,
    hidePlaylistBar: JSON.parse(localStorage.getItem('plus_hidePlaylistBar')) || false,
    durationFilter: JSON.parse(localStorage.getItem('plus_durationFilter')) || {
      max: 0,
      min: 0
    },
    durationPresets: [{
        label: 'Micro',
        min: 0,
        max: 2
      },
      {
        label: 'Short',
        min: 3,
        max: 8
      },
      {
        label: 'Average',
        min: 8,
        max: 18
      },
      {
        label: 'Long',
        min: 18,
        max: 40
      },
      {
        label: 'Magnum',
        min: 40,
        max: 0
      }
    ],
    relatedColumns: JSON.parse(localStorage.getItem('plus_relatedColumns')) || 3,
  };

  /**
   * Player settings
   *
   * Reference as of 8/16/2022:
   * {
   *   "buildNumber": "220808.544",
   *   "version": "6.2.2",
   *   "adrolls": {
   *     "0": {
   *       "commonTime": 0,
   *       "views": 0,
   *       "timeouts": {
   *         "attempt": 0,
   *         "time": 0,
   *         "report": true
   *        }
   *      }
   *     },
   *     "quality": 1080,
   *     "playbackRate": 1,
   *     "adaptive": {
   *       "hlsLevel": 2
   *     },
   *     "volume": {
   *       "volume": 52,
   *       "muted": false
   *     },
   *     "focusedPlayer": "playerDiv_336166192"
   * }
   */

  // const playerSettings = JSON.parse(localStorage.getItem('mgp_player'));

  // Change default quality from 720p to 1080p
  // playerSettings.quality = 1080;

  // Prevent problem with videos not loading unless clearing cache and reloading.
  // localStorage.setItem('mgp_player', JSON.stringify(playerSettings));

  /**
   * Shared styles
   */
  const sharedStyles = `
    /* Our own elements */

    .plus-buttons {
      background: rgba(27, 27, 27, 0.9);
      box-shadow: 0px 0px 12px rgba(20, 111, 223, 0.9);
      font-size: 12px;
      position: fixed;
      bottom: 10px;
      padding: 10px 22px 8px 24px;
      right: 0;
      z-index: 100;
      transition: all 0.2s ease;

      /* Negative margin-right calculated later based on width of buttons */
    }

    .plus-buttons:hover {
      box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.3);
    }

    .plus-buttons .plus-button {
      margin: 10px 0;
      padding: 6px 15px;
      border-radius: 4px;
      font-weight: 700;
      display: block;
      position: relative;
      text-align: center;
      vertical-align: top;
      cursor: pointer;
      border: none;
      text-decoration: none;
    }

    .plus-buttons a.plus-button {
      background: rgb(221, 221, 221);
      color: rgb(51, 51, 51);
    }

    .plus-buttons a.plus-button:hover {
      background: rgb(187, 187, 187);
      color: rgb(51, 51, 51);
    }

    .plus-buttons a.plus-button.plus-button-isOn {
      background: rgb(20, 111, 223);
      color: rgb(255, 255, 255);
    }

    .plus-buttons a.plus-button.plus-button-isOn:hover {
      background: rgb(0, 91, 203);
      color: rgb(255, 255, 255);
    }

    .plus-hidden {
      display: none !important;
    }

    .plus-letters {
      align-items: center;
      color: #ccc;
      display: flex;
      justify-content: space-between;
      margin: 0 22px 18px;
      text-transform: uppercase;
    }

    .plus-letters span {
      cursor: pointer;
    }
  `;

  /**
   * Color Theme
   */
  const themeStyles = `
    .plus-buttons {
      box-shadow: 0px 0px 12px rgba(255, 153, 0, 0.85);
    }

    .plus-buttons:hover {
      box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.3);
    }

    .plus-buttons a.plus-button {
      background: rgb(47, 47, 47);
      color: rgb(172, 172, 172);
    }

    .plus-buttons a.plus-button:hover {
      background: rgb(79, 79, 79);
      color: rgb(204, 204, 204);
    }

    .plus-buttons a.plus-button.plus-button-isOn {
      background: rgb(255, 153, 0);
      color: rgb(0, 0, 0);
    }

    .plus-buttons a.plus-button.plus-button-isOn:hover {
      background: rgb(255, 153, 0);
      color: rgb(255, 255, 255);
    }
  `;

  /**
   * Site-Specific Styles
   */
  const generalStyles = `
    /* Hide elements */

    .realsex,
    .mhp1138_cinemaState,
    .networkBar,
    .sniperModeEngaged,
    .footer,
    .footer-title,
    .ad-link,
    .removeAdLink,
    .removeAdLink + iframe,
    .abovePlayer,
    .streamatesModelsContainer,
    #welcome,
    #welcomePremium,
    #headerUpgradePremiumBtn,
    #PornhubNetworkBar,
    #js-abContainterMain,
    #hd-rightColVideoPage > :not(#relatedVideosVPage),
    .bottomNotification,
    .trailerUnderplayerPreview,
    .sectionCarousel {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
    }

    /* Allow narrower page width */

    html.supportsGridLayout.fluidContainer .container,
    html.supportsGridLayout.fluidContainer .section_wrapper {
      min-width: 700px !important;
    }

    /* Hide tricky ads with obfuscated tag names */
    .adLinks + *,
    .adLinks + * + *,
    .wrapper.hd + * {
      display: none !important;
    }

    /* Full-width video */
    #vpContentContainer {
      display: block !important;
    }

    /* Recommended videos */
    #recommendedVideosVPage {
      text-align: center !important;
    }

    /* "Recommended Porn" heading */
    #recommendedVideosVPage h3 {
      text-align: center !important;
      display: block !important;
      float: unset !important;
    }

    /* Recommended videos layout */
    #recommendedVideos {
      list-style: none !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      text-align: left !important;
    }

    /* Thumbnail wrapper */
    #recommendedVideosPage .videoBox {
      font-size: 0.813rem !important; /* 13px/16px = 0.813rem */
      color: #a6adc8 !important; /* Mocha -> Subtext0 */
      margin: 0 5px !important;
    }

    /* Thumbnail wrapper */
    #recommendedVideos .videoBox .phimage {
      width: auto !important;
      border-radius: 4px !important;
    }

    /* Thumbnail info wrapper */
    .thumbnail-info-wrapper {
      color: #a6adc8 !important; /* Mocha -> Subtext0 */
      font-size: 0.813rem !important; /* 13px/16px = 0.813rem */
      float: none !important;
      width: auto !important;
    }

    /* Title of video or playlist */
    .thumbnail-info-wrapper .title {
      font-size: 0.813rem !important;
      font-weight: 700 !important;
      margin: 12px 0 3px !important;
    }

    /* The user/channel name wrapper */
    .thumbnail-info-wrapper .usernameWrap {
      margin-top: -1px; /* Fixes slight off-center text */
    }

    /* The user/channel name link */
    .thumbnail-info-wrapper .usernameWrap a {
      font-size: 0.813rem !important; /* 13px/16px = 0.813rem */
      color: #a6adc8 !important;
    }

    /* The verified badge and user/channel name wrapper */
    .thumbnail-info-wrapper .videoUploaderBlock {
      margin-bottom: 5px !important;
    }

    /* The verified badge */
    .thumbnail-info-wrapper .own-video-thumbnail {
      margin-right: 2px !important;
    }

    /* The views and likes wrapper */
    .thumbnail-info-wrapper .videoDetailsBlock {
      margin-bottom: 5px !important;
    }

    /* The views */
    .thumbnail-info-wrapper .videoDetailsBlock .views {
      font-size: 0.813rem !important; /* 13px/16px = 0.813rem */
    }

    /* The rating */
    .thumbnail-info-wrapper .videoDetailsBlock .rating-container i,
    .thumbnail-info-wrapper .videoDetailsBlock .rating-container .value {
      font-size: 0.813rem !important; /* 13px/16px = 0.813rem */
    }

    /* The "load more" button */
    .more_recommended_btn {
      margin: 2rem 0 !important;
    }

    /* Make "HD" icon more visible on thumbnails */

    .hd-thumbnail {
      color: #f90 !important;
    }

    /* Show all playlists without scrolling in "add to" */

    .slimScrollDiv {
      height: auto !important;
    }

    #scrollbar_watch {
      max-height: unset !important;
    }

    /* Hide premium video from related videos sidebar */

    #relateRecommendedItems li:nth-of-type(5) {
      display: none !important;
    }

    /* Prevent animating player size change on each page load */

    #main-container .video-wrapper #player.wide {
      transition: none !important;
    }

    /* Allow narrower player */

    #player {
      min-width: 0 !important;
    }

    /* Fit more playlists into "add to" popup */

    .playlist-menu-addTo {
      display: none;
    }

    .add-to-playlist-menu #scrollThumbs,
    .playlist-option-menu #scrollThumbs {
      height: 320px !important;
      max-height: 35vh !important;
    }

    .add-to-playlist-menu ul.custom-playlist li {
      font-size: 12px;
      height: 24px;
    }

    .add-to-playlist-menu .playlist-menu-createNew {
      font-size: 12px !important;
      height: 38px !important;
    }

    .add-to-playlist-menu .playlist-menu-createNew a {
      padding-top: 8px !important;
      font-weight: 400 !important;
    }

    /* Hide playlist bar if disabled in options */

    .playlist-bar {
      display: ${OPTIONS.hidePlaylistBar ? 'none' : 'block'};
    }

    /**
     * Improve loading indicator lines on thumbnails
     *
     * Using colors from the Catppuccin palette available at https://github.com/catppuccin.
     */

    .preloadLine {
      background: #81c8be;              /* Mocha -> Teal */
      box-shadow: 0 0 3px #1e1e2e;      /* Mocha -> Base */
    }

    /* Fade in and out semitransparent elements */

    .tab-menu-item {
      opacity: 0.4 !important;
      padding: 0 16px !important;
      transition: all 0.2s ease !important;
    }

    .tab-menu-item.active {
      opacity: 0.5 !important;
    }

    .tab-menu-wrapper-cell:hover .tab-menu-item {
      opacity: 1 !important;
    }

    .votes-fav-wrap .icon-wrapper:hover,
    .votes-fav-wrap .icon-wrapper.active:hover {
      opacity: 1 !important;
    }

    .votes-fav-wrap .icon-wrapper {
      opacity: 0.4 !important;
      transition: all 0.2s ease !important;
    }

    .votes-fav-wrap .icon-wrapper.active {
      opacity: 0.7 !important;
    }
  `;

  /**
   * References to video element and container if they exist on the page
   */
  const player = document.querySelector('#player');
  const video = document.querySelector('video');
  const distractions = [
    '.video-info-row:not(.userRow)',
    '#header'
  ];
  const isOnVideoPage =
    /^http[s]*:\/\/[www.]*pornhub\.com\/view_video.php/.test(window.location.href) && player;

  /**
   * Creation of option buttons
   */

  const showTitlesButton = document.createElement('a');
  const showTitlesButtonText = document.createElement('span');
  const showTitlesButtonState = getButtonState(OPTIONS.showTitles);

  const loadMoreButton = document.createElement('a');
  const loadMoreButtonText = document.createElement('span');
  const loadMoreButtonState = getButtonState(OPTIONS.loadMore);

  const cinemaButton = document.createElement('a');
  const cinemaButtonText = document.createElement('span');
  const cinemaButtonState = getButtonState(OPTIONS.cinemaMode);

  const scrollButton = document.createElement('a');
  const scrollButtonText = document.createElement('span');

  const scrollPlaylistsButton = document.createElement('a');
  const scrollPlaylistsButtonText = document.createElement('span');

  const playlistBarButton = document.createElement('a');
  const playlistBarButtonText = document.createElement('span');
  const playlistBarButtonState = getButtonState(OPTIONS.hidePlaylistBar);

  const verifiedButton = document.createElement('a');
  const verifiedButtonText = document.createElement('span');
  const verifiedButtonState = getButtonState(OPTIONS.showOnlyVerified);

  const hideWatchedButton = document.createElement('a');
  const hideWatchedButtonText = document.createElement('span');
  const hideWatchedButtonState = getButtonState(OPTIONS.hideWatchedVideos);

  const hdButton = document.createElement('a');
  const hdButtonText = document.createElement('span');
  const hdButtonState = getButtonState(OPTIONS.showOnlyHd);

  const redirectToVideosButton = document.createElement('a');
  const redirectToVideosButtonText = document.createElement('span');
  const redirectToVideosButtonState = getButtonState(OPTIONS.redirectToVideos);

  const redirectPremiumVideosButton = document.createElement('a');
  const redirectPremiumVideosButtonText = document.createElement('span');
  const redirectPremiumVideosButtonState = getButtonState(OPTIONS.redirectPremiumVideos);

  const durationShortButton = document.createElement('a');
  const durationShortButtonText = document.createElement('span');
  const durationShortButtonState = getButtonState(!OPTIONS.durationFilter.min);

  const durationMediumButton = document.createElement('a');
  const durationMediumButtonText = document.createElement('span');
  const durationMediumButtonState = getButtonState(OPTIONS.durationFilter.min <= 8 && OPTIONS.durationFilter.max >= 20);

  const openWithoutPlaylistButton = document.createElement('a');
  const openWithoutPlaylistButtonText = document.createElement('span');
  const openWithoutPlaylistButtonState = getButtonState(OPTIONS.openWithoutPlaylist);

  const largerButton = document.createElement('a');
  const largerButtonText = document.createElement('span');

  const smallerButton = document.createElement('a');
  const smallerButtonText = document.createElement('span');

  /**
   * Returns an `on` or `off` CSS class name based on the boolean evaluation
   * of the `state` parameter, as convenience method when setting UI state.
   */
  function getButtonState(state) {
    return state ? 'plus-button-isOn' : 'plus-button-isOff';
  }

  cinemaButtonText.textContent = 'Cinema Mode';
  cinemaButtonText.classList.add('text');
  cinemaButton.appendChild(cinemaButtonText);
  cinemaButton.classList.add(cinemaButtonState, 'plus-button');
  cinemaButton.addEventListener('click', () => {
    OPTIONS.cinemaMode = !OPTIONS.cinemaMode;
    localStorage.setItem('plus_cinemaMode', OPTIONS.cinemaMode);

    if (OPTIONS.cinemaMode) {
      cinemaButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      cinemaButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    if (isOnVideoPage) {
      handleDistractions();
    }
  });

  showTitlesButtonText.textContent = "Show video titles";
  showTitlesButtonText.classList.add('text');
  showTitlesButton.appendChild(showTitlesButtonText);
  showTitlesButton.classList.add('plus-button');
  showTitlesButton.addEventListener('click', () => {
    const container = document.querySelector('#main-container');

    if (isOnVideoPage) {
      container.scrollIntoView();
    }
  });

  loadMoreButtonText.textContent = "Autoload more";
  loadMoreButtonText.classList.add('text');
  loadMoreButton.appendChild(loadMoreButtonText);
  loadMoreButton.classList.add('plus-button');
  loadMoreButton.addEventListener('click', () => {
    if (OPTIONS.loadMore) {
      loadMoreButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      loadMoreButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    if (document.querySelector('.videoBox') && OPTIONS.loadMore) {
      loadMore();
    }
  });

  scrollButtonText.textContent = "Scroll to Video";
  scrollButtonText.classList.add('text');
  scrollButton.appendChild(scrollButtonText);
  scrollButton.classList.add('plus-button');
  scrollButton.addEventListener('click', () => {
    const container = document.querySelector('#main-container');

    if (container) {
      container.scrollIntoView();
    }
  });

  scrollPlaylistsButtonText.textContent = "Scroll to Playlists";
  scrollPlaylistsButtonText.classList.add('text');
  scrollPlaylistsButton.appendChild(scrollPlaylistsButtonText);
  scrollPlaylistsButton.classList.add('plus-button');
  scrollPlaylistsButton.addEventListener('click', () => {
    const container = document.querySelector('#under-player-playlists');

    if (container) {
      container.scrollIntoView();
    }
  });

  verifiedButtonText.textContent = 'Verified Only';
  verifiedButtonText.classList.add('text');
  verifiedButton.appendChild(verifiedButtonText);
  verifiedButton.classList.add(verifiedButtonState, 'plus-button');
  verifiedButton.addEventListener('click', () => {
    OPTIONS.showOnlyVerified = !OPTIONS.showOnlyVerified;
    localStorage.setItem('plus_showOnlyVerified', OPTIONS.showOnlyVerified);

    if (OPTIONS.showOnlyVerified) {
      verifiedButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      verifiedButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    filterVideos();
  });

  hdButtonText.textContent = 'HD Only';
  hdButtonText.classList.add('text');
  hdButton.appendChild(hdButtonText);
  hdButton.classList.add(hdButtonState, 'plus-button');
  hdButton.addEventListener('click', () => {
    OPTIONS.showOnlyHd = !OPTIONS.showOnlyHd;
    localStorage.setItem('plus_showOnlyHd', OPTIONS.showOnlyHd);

    if (OPTIONS.showOnlyHd) {
      hdButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      hdButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    filterVideos();
  });


  playlistBarButtonText.textContent = 'Hide Playlist Bar';
  playlistBarButtonText.classList.add('text');
  playlistBarButton.appendChild(playlistBarButtonText);
  playlistBarButton.classList.add(playlistBarButtonState, 'plus-button');
  playlistBarButton.addEventListener('click', () => {
    OPTIONS.hidePlaylistBar = !OPTIONS.hidePlaylistBar;
    localStorage.setItem('plus_hidePlaylistBar', OPTIONS.hidePlaylistBar);

    if (OPTIONS.hidePlaylistBar) {
      playlistBarButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      playlistBarButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    const playlistBar = document.querySelector('.playlist-bar');

    if (playlistBar) {
      playlistBar.style.display = OPTIONS.hidePlaylistBar ? 'none' : 'block';
    }
  });

  hideWatchedButtonText.textContent = 'Unwatched Only';
  hideWatchedButtonText.classList.add('text');
  hideWatchedButton.appendChild(hideWatchedButtonText);
  hideWatchedButton.classList.add(hideWatchedButtonState, 'plus-button');
  hideWatchedButton.addEventListener('click', () => {
    OPTIONS.hideWatchedVideos = !OPTIONS.hideWatchedVideos;
    localStorage.setItem('plus_hideWatchedVideos', OPTIONS.hideWatchedVideos);

    if (OPTIONS.hideWatchedVideos) {
      hideWatchedButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      hideWatchedButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }

    filterVideos();
  });

  redirectToVideosButtonText.textContent = 'Redirect Profiles to Uploads';
  redirectToVideosButtonText.classList.add('text');
  redirectToVideosButton.appendChild(redirectToVideosButtonText);
  redirectToVideosButton.classList.add(redirectToVideosButtonState, 'plus-button');
  redirectToVideosButton.addEventListener('click', () => {
    OPTIONS.redirectToVideos = !OPTIONS.redirectToVideos;
    localStorage.setItem('plus_redirectToVideos', OPTIONS.redirectToVideos);

    if (OPTIONS.redirectToVideos) {
      redirectToVideosButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      redirectToVideosButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }
  });

  redirectPremiumVideosButtonText.textContent = 'Redirect Empty Premium Members To Regular';
  redirectPremiumVideosButtonText.classList.add('text');
  redirectPremiumVideosButton.appendChild(redirectPremiumVideosButtonText);
  redirectPremiumVideosButton.classList.add(redirectPremiumVideosButtonState, 'plus-button');
  redirectPremiumVideosButton.addEventListener('click', () => {
    OPTIONS.redirectPremiumVideos = !OPTIONS.redirectPremiumVideos;
    localStorage.setItem('plus_redirectPremiumVideos', OPTIONS.redirectPremiumVideos);

    if (OPTIONS.redirectPremiumVideos) {
      redirectPremiumVideosButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      redirectPremiumVideosButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }
  });

  durationShortButtonText.textContent = 'Short Videos (< 8 min)';
  durationShortButtonText.classList.add('text');
  durationShortButton.appendChild(durationShortButtonText);
  durationShortButton.classList.add(durationShortButtonState, 'plus-button');
  durationShortButton.addEventListener('click', () => {
    OPTIONS.durationFilter.min = OPTIONS.durationFilter.min ? 0 : 8;
    localStorage.setItem('plus_durationFilter', JSON.stringify(OPTIONS.durationFilter));

    if (!OPTIONS.durationFilter.min) {
      durationShortButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
      filterVideos();
    } else {
      durationShortButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
      filterVideos();
    }
  });

  durationMediumButtonText.textContent = 'Medium Videos (8-20 min)';
  durationMediumButtonText.classList.add('text');
  durationMediumButton.appendChild(durationMediumButtonText);
  durationMediumButton.classList.add(durationMediumButtonState, 'plus-button');
  durationMediumButton.addEventListener('click', () => {
    OPTIONS.durationFilter.min = OPTIONS.durationFilter.min !== 8 ? 8 : 0;
    OPTIONS.durationFilter.max = OPTIONS.durationFilter.max !== 20 ? 20 : 0;

    localStorage.setItem('plus_durationFilter', JSON.stringify(OPTIONS.durationFilter));

    if (OPTIONS.durationFilter.min === 8 && OPTIONS.durationFilter.max === 20) {
      durationMediumButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
      filterVideos();
    } else {
      durationMediumButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
      filterVideos();
    }
  });


  largerButton.textContent = "Larger previews";
  largerButtonText.classList.add('text');
  largerButton.appendChild(largerButtonText);
  largerButton.classList.add('plus-button');
  largerButton.addEventListener('click', () => {
    setRelatedColumns(OPTIONS.relatedColumns - 1)
  });

  smallerButton.textContent = "Smaller previews";
  smallerButtonText.classList.add('text');
  smallerButton.appendChild(smallerButtonText);
  smallerButton.classList.add('plus-button');
  smallerButton.addEventListener('click', () => {
    setRelatedColumns(OPTIONS.relatedColumns + 1)
  });

  /**
   * Order option buttons in a container
   */

  const buttons = document.createElement('div');
  const durationFilters = [];

  buttons.classList.add('plus-buttons');

  buttons.appendChild(cinemaButton);
  buttons.appendChild(scrollButton);
  buttons.appendChild(scrollPlaylistsButton);
  buttons.appendChild(smallerButton);
  buttons.appendChild(largerButton);
  buttons.appendChild(verifiedButton);
  buttons.appendChild(hdButton);
  buttons.appendChild(hideWatchedButton);
  buttons.appendChild(redirectToVideosButton);
  buttons.appendChild(redirectPremiumVideosButton);
  buttons.appendChild(playlistBarButton);

  /**
   * Generate buttons for filtering by duration. Buttons are created based on
   * `OPTIONS.durationPresets`, an array of objects containing max and min duration in minutes,
   * and a label (like "Short Videos").
   */
  OPTIONS.durationPresets.forEach(preset => {
    const button = document.createElement('a');
    const buttonText = document.createElement('span');
    const buttonState = getButtonState(OPTIONS.durationFilter.min === preset.min &&
      OPTIONS.durationFilter.max === preset.max);

    buttonText.textContent = `${preset.label} (${preset.min}-${preset.max} mins)`;
    buttonText.classList.add('text');
    button.appendChild(buttonText);
    button.classList.add(buttonState, 'plus-button');

    durationFilters.push({
      button,
      preset
    });
  });

  /**
   * We needed access to all buttons, their state, and the duration values, to be able to switch
   * all the buttons to off state before we apply the newly selected filters. For simplicity and
   * sanity, only one duration range can be selected at a time.
   */
  durationFilters.forEach(({
    button,
    preset
  }) => {
    buttons.appendChild(button);

    button.addEventListener('click', () => {
      durationFilters.forEach(filter => filter.button.classList.replace('plus-button-isOn', 'plus-button-isOff'));

      OPTIONS.durationFilter.min = OPTIONS.durationFilter.min === preset.min ? 0 : preset.min;
      OPTIONS.durationFilter.max = OPTIONS.durationFilter.max === preset.max ? 0 : preset.max;

      localStorage.setItem('plus_durationFilter', JSON.stringify(OPTIONS.durationFilter));

      if (OPTIONS.durationFilter.min === preset.min &&
        OPTIONS.durationFilter.max === preset.max) {
        button.classList.replace('plus-button-isOff', 'plus-button-isOn');
        filterVideos();
      } else {
        button.classList.replace('plus-button-isOn', 'plus-button-isOff');
        filterVideos();
      }
    });
  });

  document.body.appendChild(buttons); // Button container ready and added to page

  /**
   * Observe for DOM mutations, such as loading more videos.
   */
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (!!mutation.target.className) {
        // Filter videos when loading more
        if (mutation.addedNodes.length) {
          filterVideos();
          showTitles();
        }

        // Always wide player
        if (!!mutation.target.id.match(/\bplayer\b/)) {
          mutation.target.className = "wide";
          return;
        }

        if (!!mutation.target.id.match(/main-container/) && !!mutation.previousSibling && !!mutation.previousSibling.id && !!mutation.previousSibling.id.match(/rightColVideoPage/)) {
          mutation.previousSibling.className = "wide";
          return;
        }

        // Update wide player button / HTML5 only
        if (!!mutation.target.className.match(/mhp1138_front/)) {
          mutation.target.childNodes.forEach(function(node) {
            if (!!node.className.match(/mhp1138_cinema/)) {
              node.className = "mhp1138_cinema mhp1138_cinemaState";
              return;
            }
          });
          return;
        }

        // Center the video
        if (!!mutation.target.className.match(/playerFlvContainer/)) {
          mutation.addedNodes.forEach(function(element) {
            if (!!element && element.id === "pb_template") {
              var node = document.createElement("div");
              node.className = "mhp1138_playerStateIcon";
              node.setAttribute("style", "opacity: 1");
              node.innerHTML =
                "<div class='mhp1138_play' style='display: block'>" +
                "    <div class='mhp1138_icon mhp1138_icon-play'></div>" +
                "</div>" +
                "<div class='mhp1138_background'></div>";
              element.appendChild(node);
              return;
            }
          });
        }
        return;
      }
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });

  /**
   * General UI related functions
   */

  /**
   * Clicking a video on a playlist page opens it without the playlist at the
   * top if the option is enabled.
   */
  function updatePlaylistLinks() {
    if (OPTIONS.openWithoutPlaylist) {
      document.querySelectorAll('#videoPlaylist li a').forEach(link => {
        link.href = link.href.replace('pkey', 'nopkey');
      });
    } else {
      document.querySelectorAll('#videoPlaylist li a').forEach(link => {
        link.href = link.href.replace('nopkey', 'pkey');
      });
    }
  }

  /**
   * Allow scrolling the page when mouse hovers playlists in "add to", by
   * cloning the playlist scroll container to remove the listeners that
   * `preventDefault()`.
   */
  function fixScrollContainer(container) {
    if (container) {
      container.parentNode.replaceChild(container.cloneNode(true), container);
    }
  }

  /**
   * Video thumbnail box related functions
   */

  /**
   * Checks if video box links to a video made by a verified member
   */
  function videoIsVerified(box) {
    return box.querySelector('.own-video-thumbnail');
  }

  /**
   * Checks if video box links to a HD video
   */
  function videoIsHd(box) {
    return box.querySelector('.hd-thumbnail');
  }

  /**
   * Checks if the video box has a "watched" label on it (the video has
   * already been viewed)
   */
  function videoIsWatched(box) {
    return box.querySelector('.watchedVideoText');
  }

  /**
   * Checks if video box links to a video that is within the selected duration
   * range, if one has been selected in options.
   */
  function videoIsWithinDuration(box) {
    // Parse integer minutes from video duration text
    const mins = parseInt(box.querySelector('.duration').textContent.split(":")[0]);
    const minMins = OPTIONS.durationFilter.min;
    const maxMins = OPTIONS.durationFilter.max;

    // If either max or min duration has been selected
    if (minMins || maxMins) {
      // If any max duration is set (otherwise defaults to 0 for no max)
      const hasMaxDuration = !!maxMins;
      // True if the video is shorther than we want (min defaults to 0)
      const isBelowMin = mins < minMins;
      // True if a max duration is set and the video exceeds it
      const isAboveMax = hasMaxDuration && (mins > maxMins - 1);
      // One minute negative offset since we ignore any extra seconds

      return !isBelowMin && !isAboveMax;
    } else {
      return true;
    }
  }

  /**
   * Sorts elements in the "add to playlist" list.
   */
  function sortPlaylistList(list) {
    const playlistItems = {};

    // Get playlist titles
    list.querySelectorAll('li').forEach(item => {
      const name = item.querySelector('.playlist-name').innerText;
      playlistItems[name] = item;
    });

    // Sort by titles and re-insert into list
    Object.keys(playlistItems).sort().forEach(item => {
      list.appendChild(playlistItems[item]);
    });
  }

  /**
   * Automatically load more videos.
   */
  function loadMore() {
    document.querySelector('#loadMoreRelatedVideosCenter').click();
  }

  /**
   * Show video titles.
   */
  function showTitles() {
    if (OPTIONS.showTitles) {
      document.querySelector('.videoUploaderBlock').classList.remove('plus-hidden');
      document.querySelector('.thumbnail-info-wrapper').classList.remove('plus-hidden');
    } else {
      document.querySelector('.videoUploaderBlock').classList.add('plus-hidden');
      document.querySelector('.thumbnail-info-wrapper').classList.add('plus-hidden');
    }
  }

  /**
   * Resets video thumbnail box to its original visible state.
   */
  function resetVideo(box) {
    showVideo(box);
  }

  /**
   * Shows the video thumbnail box.
   */
  function showVideo(box) {
    box.classList.remove('plus-hidden');
  }

  /**
   * Hides the video thumbnail box.
   */
  function hideVideo(box) {
    box.classList.add('plus-hidden');
  }

  /**
   * Does the required checks to filter out unwanted video boxes according to
   * options. Each box is reset to it's original visible state, then it's
   * checked against relevant options to determine if it should be hidden or
   * stay visible.
   */
  function filterVideos() {
    document.querySelectorAll('li.videoblock.videoBox').forEach(box => {
      const state = {
        verified: videoIsVerified(box),
        watched: videoIsWatched(box),
        hd: videoIsHd(box),
        inDurationRange: videoIsWithinDuration(box)
      };

      const shouldHide =
        (OPTIONS.showOnlyHd && !state.hd) ||
        (OPTIONS.showOnlyVerified && !state.verified) ||
        (OPTIONS.hideWatchedVideos && state.watched) ||
        !state.inDurationRange;

      // Reset the box to its original visible state so we can focus only on
      // what to hide instead of also on what to unhide
      resetVideo(box);

      if (shouldHide) {
        hideVideo(box);
      }
    });
  }

  /**
   * Filters "add to playlist" list by letter.
   */
  function filterPlaylistListByCharacter(list, letter) {
    if (list && letter === '#') {
      // Special characters specified
      list.querySelectorAll('li').forEach(item => {
        const name = item.querySelector('.playlist-name').innerText;

        // Hide items with non-alphabetic first characters
        if (!name[0].match(/[a-z]/i)) {
          item.classList.remove('plus-hidden');
        } else {
          item.classList.add('plus-hidden');
        }
      });
    } else if (list && letter && letter.length === 1) {
      // Letter specified
      list.querySelectorAll('li').forEach(item => {
        const name = item.querySelector('.playlist-name').innerText;

        if (name[0].toLowerCase() !== letter.toLowerCase()) {
          item.classList.add('plus-hidden');
        } else {
          item.classList.remove('plus-hidden');
        }
      });
    } else {
      // Reset specified
      list.querySelectorAll('li').forEach(item => item.classList.remove('plus-hidden'));
    }
  }

  const handleDistractions = () => {
    distractions.forEach((distraction) => {
      const element = document.querySelector(distraction);

      if (element) {
        const handleMouseOver = () => {
          element.style.opacity = 1;
        }

        const handleMouseOut = () => {
          element.style.opacity = 0.2;
        }

        if (OPTIONS.cinemaMode) {
          element.style.transition = 'all 0.2s ease';
          element.style.opacity = 0.2;

          element.addEventListener('mouseover', handleMouseOver, false);
          element.addEventListener('mouseout', handleMouseOut, false);
        } else {
          element.style.opacity = 1;
          element.removeEventListener('mouseover', handleMouseOver, false);
          element.removeEventListener('mouseout', handleMouseOut, false);
        }
      }
    });
  };

  const setRelatedColumns = columns => {
    // Removes a column to the video preview grids, making them bigger
    const container = document.getElementById('relatedVideosCenter');

    if (container) {
      const min = 1;
      const max = 8;

      if (columns <= min) {
        columns = min;
      } else if (columns >= max) {
        columns = max;
      }

      container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      localStorage.setItem('plus_relatedColumns', columns);
      OPTIONS.relatedColumns = columns;
    }
  };

  /**
   * Initialize video pages (that contain a valid video element)
   */

  if (isOnVideoPage) {
    // Let us scroll the page despite the mouse pointer hovering over the "Add to" playlist area
    // const scrollContainer = document.querySelector('#scrollbar_watch');

    // if (scrollContainer) {
    //   fixScrollContainer(scrollContainer);
    // }

    handleDistractions();
    setRelatedColumns(OPTIONS.relatedColumns);

    // Listen to "add to" tab clicks
    const addToTab = document.querySelector('[data-tab="add-to-tab"]');
    const addToTabContainer = document.querySelector('.add-to-tab');

    const initSortingFeature = () => {
      // Only run once
      addToTab.removeEventListener('click', initSortingFeature, false);

      // Add sort playlist list button
      const subActions = document.querySelector('.add-to-tab .video-actions-sub-menu');
      const sortItem = document.createElement('div');
      const hideItem = document.createElement('div');

      sortItem.innerHTML = 'Sort alphabetically';
      sortItem.classList.add('js-sortItem', 'tab-sub-menu-item');
      sortItem.addEventListener('click', () => {
        const playlistList = document.querySelector('#custom-playlist-detailed');

        if (playlistList) {
          sortPlaylistList(playlistList);
        }
      });

      // Add hide button
      hideItem.innerHTML = 'Hide';
      hideItem.classList.add('js-sortItem', 'tab-sub-menu-item');
      hideItem.addEventListener('click', () => {
        if (addToTabContainer.classList.contains('active')) {
          addToTabContainer.classList.remove('active');
        }
      });

      subActions.insertBefore(sortItem, subActions.firstElementChild);
      subActions.insertBefore(hideItem, subActions.firstElementChild);


      const letters = document.createElement('div');
      const resetButton = document.createElement('span');
      const specialButton = document.createElement('span');

      for (let i = 0; i < 26; i++) {
        const letter = document.createElement('span');
        const char = (i + 10).toString(36);

        letter.innerHTML = char;
        letter.setAttribute('data-letter', char);
        letters.appendChild(letter);
      }

      resetButton.innerHTML = 'All';
      specialButton.innerHTML = '#';
      specialButton.setAttribute('data-letter', '#')

      letters.insertBefore(specialButton, letters.firstElementChild);
      letters.insertBefore(resetButton, letters.firstElementChild);
      letters.classList.add('plus-letters');
      letters.addEventListener('click', event => {
        const list = document.querySelector('#custom-playlist-detailed');
        const letter = event.target.getAttribute('data-letter');

        filterPlaylistListByCharacter(list, letter);
      });

      subActions.parentNode.insertBefore(letters, subActions);
    };

    // Initialize sorting on "add to" tab click
    // addToTab.addEventListener('click', initSortingFeature);
  }

  /**
   * Initialize any page that contains a video box
   */

  if (document.querySelector('.videoBox')) {
    setTimeout(() => {
      filterVideos();
      updatePlaylistLinks();
      showTitles();
    }, 1000);
  }

  /**
   * Initialize profile pages, channel pages, user pages, star pages
   */

  /**
   * Model, pornstar. user, and channel pages
   */

  if (
    /^https?:\/\/(www\.)?pornhub(premium)?\.com\/pornstar\/([^\/]+)$/.test(location.href) ||
    /^https?:\/\/(www\.)?pornhub(premium)?\.com\/model\/([^\/]+)$/.test(location.href) ||
    /^https?:\/\/(www\.)?pornhub(premium)?\.com\/users\/([^\/]+)$/.test(location.href) ||
    /^https?:\/\/(www\.)?pornhub(premium)?\.com\/channels\/([^\/]+)$/.test(location.href)
  ) {
    /**
     * Redirect profile pages straight to their video uploads page if the setting is
     * enabled, except in case we just came from the video page (don't loop back).
     * Regex checks if /pornstar/ is followed by a word but no more slashes.
     */
    if (OPTIONS.redirectToVideos) {
      // Don't redirect if coming stright from videos (e.g. when navigating back)
      if (!/.+\/videos.*/.test(document.referrer)) {
        location.href += '/videos/upload';
      }
    }
  }

  /**
   * Premium model video pages
   */

  if (
    /^https?:\/\/(www\.)?pornhubpremium\.com\/model\/.+\/videos.*$/.test(location.href) &&
    !/^https?:\/\/(www\.)?pornhubpremium\.com\/model\/.+\/videos.*$/.test(document.referrer) &&
    !/^https?:\/\/(www\.)?pornhubpremium\.com\/pornstars\?performerType=.+/.test(document.referrer)
  ) {
    // If a model has no premium videos then redirect to the free site
    if (OPTIONS.redirectPremiumVideos) {
      // Check for the empty icon
      const isEmpty = document.querySelector('.video.emptyIcon');

      if (isEmpty) {
        location.hostname = 'pornhub.com';
      }
    }
  }


  /*
   * Add styles
   */

  GM_addStyle(sharedStyles);
  GM_addStyle(themeStyles);
  GM_addStyle(generalStyles);

  /*
   * Add dynamic styles
   */

  const dynamicStyles = `
    .plus-buttons {
      margin-right: -${buttons.getBoundingClientRect().width - 18}px;
      margin-top: -${buttons.getBoundingClientRect().height - 18}px;
    }

    .plus-buttons:hover {
      margin-right: 0;
      margin-left: 0;
    }
  `;

  GM_addStyle(dynamicStyles);
}, 1000);