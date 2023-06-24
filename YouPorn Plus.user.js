// ==UserScript==
// @author      			Mr. Nope
// @version     			2023-05-25
// @name								YouPorn Plus
// @match       			*://*.youporn.com/*
// @match       			*://*.youpornpremium.com/*
// @description 	A kinder YouPorn. Because you're worth it.
// @run-at						document_end
// @date        				2023-05-25
// @license     			MIT
// ==/UserScript==

'use strict';

setTimeout(() => {
  const OPTIONS = {
    cinemaMode: JSON.parse(localStorage.getItem('plus_cinemaMode')) || false
  };

  console.log(document);
  console.log(window);

  console.log(unsafeWindow);

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
t by defining these APIs in the content script (ISOLATED) world, supported by the extension APIs available to the ISOLATED world. By forcing user scripts to move from ISOLATED to USERSCRIPT, these extension-defined APIs would at first lose access to the privileged APIs.

    This access can be restored by establishing a (synchronous) communication channel between the ISOLATED and USERSCRIPT worlds. This can achieved with existing DOM APIs, e.g. with a pre-shared secret (event name) + custom events on shared document/window. This technique may be familiar to some, as it is a way to communicate between MAIN and ISOLATED. Although used in practice, I discourage the use of window.postMessage for communication because that can be intercepted and/or break web pages (for previous discussion, see Proposal: deprecate window.postMessage(message, '*') for use with extensions #78).
    In the future, a dedicated API to communicate between worlds could be considered.

When multiple scripts match and have the same
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
      box-shadow: 0px 0px 12px rgba(236, 86, 124, 0.85);
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
      background: rgb(236, 86, 124);
      color: rgb(235, 235, 235);
    }

    .plus-buttons a.plus-button.plus-button-isOn:hover {
      background: rgb(236, 86, 124);
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
  const videoContainer = document.querySelector('#videoContainer');
  const distractions = [
    'header'
  ];
  const isOnVideoPage =
    /^http[s]*:\/\/(www\.)*youporn(premium)?\.com\/watch\//.test(window.location.href) && !!videoContainer;

  const handleDistractions = () => {
    distractions.forEach((distraction) => {
      console.log(distraction);
      const element = document.querySelector(distraction);

      if (element) {
        const handleMouseOver = () => {
          element.style.opacity = 1;
        };

        const handleMouseOut = () => {
          element.style.opacity = 0.2;
        };

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

  /**
   * Returns an `on` or `off` CSS class name based on the boolean evaluation
   * of the `state` parameter, as convenience method when setting UI state.
   */
  const getButtonState = state => {
    return state ? 'plus-button-isOn' : 'plus-button-isOff';
  };

  /**
   * Option buttons
   */

  const cinemaButton = document.createElement('a');
  const cinemaButtonText = document.createElement('span');
  const cinemaButtonState = getButtonState(OPTIONS.cinemaMode);

  const scrollButton = document.createElement('a');
  const scrollButtonText = document.createElement('span');

  cinemaButtonText.textContent = 'Cinema mode';
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

  scrollButtonText.textContent = "Scroll to video";
  scrollButtonText.classList.add('text');
  scrollButton.appendChild(scrollButtonText);
  scrollButton.classList.add('plus-button');
  scrollButton.addEventListener('click', () => {
    const container = document.querySelector('.main_content');
    const header = document.querySelector('header');

    if (container && header) {
      const destination = {
        left: container.scrollX,
        top: container.offsetTop - header.scrollHeight,
        behavior: 'smooth'
      };
      window.scroll(destination);
    }
  });

  /**
   * Order option buttons in a container
   */

  const buttons = document.createElement('div');

  buttons.classList.add('plus-buttons');

  buttons.appendChild(cinemaButton);
  buttons.appendChild(scrollButton);

  document.body.appendChild(buttons); // Button container ready and added to page

  if (isOnVideoPage) {
    let timer = setInterval(() => {
      if (typeof window.expandHD === 'function') {
        console.log(unsafeWindow);
        window.expandHD();
        clearInterval(timer);
      }
    }, 500);
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