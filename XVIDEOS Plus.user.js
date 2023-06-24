// ==UserScript==
// @author      Mr. Nope
// @version     2022-12-17
// @name        XVIDEOS Plus
// @description A kinder XVIDEOS. Because you're worth it.
// @match       *://*.xvideos.com/*
// @match       *://*.xvideos.red/*
// @run-at      document_idle
// @grant       GM_addStyle
// @icon        https://seeklogo.com/images/X/xvideos-logo-77E7B4F168-seeklogo.com.png
// ==/UserScript==

'use strict';


const OPTIONS = {
  scrollToVideo: Boolean(JSON.parse(localStorage.getItem('plus_scrollToVideo'))),
  autoplay: Boolean(JSON.parse(localStorage.getItem('plus_autoplay'))),
  cinemaMode: Boolean(JSON.parse(localStorage.getItem('plus_cinemaMode'))),
  autoGoToRed: Boolean(JSON.parse(localStorage.getItem('plus_autoGoToRed'))),
  autoGoToRegular: Boolean(JSON.parse(localStorage.getItem('plus_autoGoToRegular')))
};

/**
 * Site-specific styles
 */
const rootStyles = `
  /* Variables */

  :root {
    --color-brand-primary: rgb(178, 14, 0);
    --color-brand-primary-hover: rgb(198, 34, 0);
  }
`;

/**
   * Shared Styles
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
      transition: all 0.3s ease;

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
  `;

/**
   * Color Theme
   */
const themeStyles = `
    .plus-buttons {
      box-shadow: 0px 0px 12px rgb(135, 0, 0);
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
      background: var(--color-brand-primary);
      color: rgb(204, 204, 204);
    }

    .plus-buttons a.plus-button.plus-button-isOn:hover {
      background: var(--color-brand-primary-hover);
      color: rgb(232, 232, 232);
    }
  `;

/**
   * Site-Specific Styles
   */
const generalStyles = `
    /* Hidden */

    #video-sponsor-links,
    .related-content .related-content__btns::before {
      display: none !important;
    }

    /* Related videos and playlists tabs */

    .related-content .related-content__btns {
      margin: 9px 0 6px 0;
    }

    .related-content .related-content__btns a.link {
      border-bottom: none;
    }

    .related-content .related-content__btns a.link.active {
      color: var(--color-brand-primary);
      font-weight: 700;
    }

    /* Thumbnails */

    #related-videos .thumb-block {
      opacity: 0.75;
      transition: opacity ease-in 1000ms 1000ms;
    }

    #related-videos .thumb-block:hover {
      opacity: 1;
      transition: opacity ease-out 500ms;
    }

    /* Add to favorites */

    .favlist-elem-line,
    .favlist-elem-small-line {
      margin: 0;
      padding: 1px;
    }

    .favlist-elem-line .favlist-e-title,
    .favlist-elem-small-line .favlist-e-title {
      font-size: 14px;
    }

    .favlist-elem-line .favlist-e-left > *,
    .favlist-elem-small-line .favlist-e-left > * {
      vertical-align: middle;
    }

    .x-overlay.favlist-opverlay .x-body {
      transform: scale(0.6);
    }

    .x-overlay.favlist-overlay .x-body {
      padding: 25px;
      position: relative;
      max-width: 120ch;
    }

    .x-overlay.x-overlay-box .x-body {
      height: auto;
      margin: 80px auto 5px;
      padding: 25px;
      font-size: 14px;
      line-height: 1;
    }
  `;

/**
  * Video player
  */

const video = document.getElementsByTagName('video')[0]; // References the HTML5 Video element

/**
 * Create option buttons
 */

const buttons = document.createElement('div');

const scrollToTopButton = document.createElement('a');
const scrollToTopButtonText = document.createElement('span');

const scrollToVideoButton = document.createElement('a');
const scrollToVideoButtonText = document.createElement('span');
const scrollToVideoButtonState = OPTIONS.scrollToVideo ? 'plus-button-isOn' : 'plus-button-isOff';

const autoplayButton = document.createElement('a');
const autoplayButtonText = document.createElement('span');
const autoplayButtonState = OPTIONS.autoplay ? 'plus-button-isOn' : 'plus-button-isOff';

const cinemaModeButton = document.createElement('a');
const cinemaModeButtonText = document.createElement('span');
const cinemaModeButtonState = OPTIONS.cinemaMode ? 'plus-button-isOn' : 'plus-button-isOff';


const goToRedButton = document.createElement('a');
const goToRedButtonText = document.createElement('span');

const autoGoToRedButton = document.createElement('a');
const autoGoToRedButtonText = document.createElement('span');
const autoGoToRedButtonState = OPTIONS.autoGoToRed ? 'plus-button-isOn' : 'plus-button-isOff';

const autoGoToRegularButton = document.createElement('a');
const autoGoToRegularButtonText = document.createElement('span');
const autoGoToRegularButtonState = OPTIONS.autoGoToRegular ? 'plus-button-isOn' : 'plus-button-isOff';

scrollToTopButtonText.textContent = "Scroll to top";
scrollToTopButtonText.classList.add('text');
scrollToTopButton.appendChild(scrollToTopButtonText);
scrollToTopButton.classList.add('plus-button');
scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0 });
});

scrollToVideoButtonText.textContent = "Scroll to video";
scrollToVideoButtonText.classList.add('text');
scrollToVideoButton.appendChild(scrollToVideoButtonText);
scrollToVideoButton.classList.add(scrollToVideoButtonState, 'plus-button');
scrollToVideoButton.addEventListener('click', () => {
  OPTIONS.scrollToVideo = !OPTIONS.scrollToVideo;
  localStorage.setItem('plus_scrollToVideo', OPTIONS.scrollToVideo);

  if (OPTIONS.scrollToVideo) {
    scrollToVideoButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    const videoContainer = document.querySelector('#content');
    const top = videoContainer.offsetTop;

    window.scrollTo({ top });
  } else {
    scrollToVideoButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});



autoplayButtonText.textContent = 'Autoplay';
autoplayButtonText.classList.add('text');
autoplayButton.appendChild(autoplayButtonText);
autoplayButton.classList.add(autoplayButtonState, 'plus-button');
autoplayButton.addEventListener('click', () => {
  OPTIONS.autoplay = !OPTIONS.autoplay;
  localStorage.setItem('plus_autoplay', OPTIONS.autoplay);

  if (OPTIONS.autoplay) {
    autoplayButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
  } else {
    autoplayButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});

cinemaModeButtonText.textContent = 'Cinema mode';
cinemaModeButtonText.classList.add('text');
cinemaModeButton.appendChild(cinemaModeButtonText);
cinemaModeButton.classList.add(cinemaModeButtonState, 'plus-button');
cinemaModeButton.addEventListener('click', () => {
  OPTIONS.cinemaMode = !OPTIONS.cinemaMode;
  localStorage.setItem('plus_cinemaMode', OPTIONS.cinemaMode);

  if (OPTIONS.cinemaMode) {
    cinemaModeButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
  } else {
    cinemaModeButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});

goToRedButtonText.textContent = `Switch to ${location.hostname.endsWith('xvideos.red') ? 'Regular' : 'RED'}`;
goToRedButtonText.classList.add('text');
goToRedButton.appendChild(goToRedButtonText);
goToRedButton.classList.add('plus-button');
goToRedButton.addEventListener('click', () => {
  if (location.hostname.endsWith('xvideos.com')) {
    location.hostname = location.hostname.replace('xvideos.com', 'xvideos.red');
  } else if (location.hostname.endsWith('xvideos.red')) {
    location.hostname = location.hostname.replace('xvideos.red', 'xvideos.com');
  }
});

autoGoToRedButtonText.textContent = "Auto-switch to RED";
autoGoToRedButtonText.classList.add('text');
autoGoToRedButton.appendChild(autoGoToRedButtonText);
autoGoToRedButton.classList.add(autoGoToRedButtonState, 'plus-button');
autoGoToRedButton.addEventListener('click', () => {
  OPTIONS.autoGoToRed = !OPTIONS.autoGoToRed;
  localStorage.setItem('plus_autoGoToRed', OPTIONS.autoGoToRed);

  if (OPTIONS.autoGoToRed) {
    autoGoToRedButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
  } else {
    autoGoToRedButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});

autoGoToRegularButtonText.textContent = 'Auto-switch to Regular';
autoGoToRegularButtonText.classList.add('text');
autoGoToRegularButton.appendChild(autoGoToRegularButtonText);
autoGoToRegularButton.classList.add(autoGoToRegularButtonState, 'plus-button');
autoGoToRegularButton.addEventListener('click', () => {
  OPTIONS.autoGoToRegular = !OPTIONS.autoGoToRegular;
  localStorage.setItem('plus_autoGoToRegular', OPTIONS.autoGoToRegular);

  if (OPTIONS.autoGoToRegular) {
    autoGoToRegularButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
  } else {
    autoGoToRegularButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});

if (OPTIONS.autoGoToRed && location.hostname.endsWith('xvideos.com')) {
  location.hostname = location.hostname.replace('xvideos.com', 'xvideos.red');
}

if (OPTIONS.autoGoToRegular && location.hostname.endsWith('xvideos.red')) {
  location.hostname = location.hostname.replace('xvideos.red', 'xvideos.com');
}

autoplayButtonText.textContent = 'Autoplay';
autoplayButtonText.classList.add('text');
autoplayButton.appendChild(autoplayButtonText);
autoplayButton.classList.add(autoplayButtonState, 'plus-button');
autoplayButton.addEventListener('click', () => {
  OPTIONS.autoplay = !OPTIONS.autoplay;
  localStorage.setItem('plus_autoplay', OPTIONS.autoplay);

  if (OPTIONS.autoplay) {
    autoplayButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
  } else {
    autoplayButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
  }
});

buttons.classList.add('plus-buttons');

buttons.appendChild(scrollToTopButton);
buttons.appendChild(scrollToVideoButton);
buttons.appendChild(autoplayButton);
buttons.appendChild(cinemaModeButton);
buttons.appendChild(autoGoToRedButton);
buttons.appendChild(goToRedButton);

document.body.appendChild(buttons);

/**
 * Initialize video pages containing valid video element
 */
if (video) {
   /**
    * Autoscroll to video
    */
  if (OPTIONS.scrollToVideo) {
    const videoContainer = document.querySelector('#content');
    const top = videoContainer.offsetTop;

    scrollToVideoButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    window.scrollTo({ top });
  }

  /**
   * "Always go RED" buttons
   */
  if (OPTIONS.scrollToVideo) {
    const videoContainer = document.querySelector('#content');
    const top = videoContainer.offsetTop;

    scrollToVideoButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    window.scrollTo({ top });
  }

  /**
    * Auto-enable cinema mode if enabled
    */
  if (OPTIONS.cinemaMode && !document.querySelector('.player-enlarged')) {
    const button = document.querySelector('#content .buttons-bar img[src*="icon-screen-expand"]');

    if (button) {
      button.dispatchEvent(new MouseEvent('click'));
    }
  }

  /**
    * Autoplay video if enabled
    */
  if (OPTIONS.autoplay) {
    document.querySelector('.buttons-bar img[src*="icon-play"]').dispatchEvent(new MouseEvent('click'));
  }
}

/**
 * Print some stuff to the console.
 */

const selectors = new Map();
selectors.set('playlist', new Map());
selectors.get('playlist').set('items', '.favlist-elem');
selectors.get('playlist').set('count', '.favlist-e-nb-videos');
selectors.get('playlist').set('tags', '.tag');

const counts = new Map();
counts.set('playlist', new Map());
counts.get('playlist').set('total', 0);
counts.set('videos', new Map());
counts.get('videos').set('total', 0);
counts.get('videos').set('public', 0);
counts.get('videos').set('private', 0);
counts.set('tags', new Map());
counts.get('tags')[Symbol.iterator] = function* () {
  // Sort by number of times the tag is used for a playlist.
  yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
};

const playlists = document.querySelectorAll(selectors.get('playlist').get('items'));

counts.get('playlist').set('total', playlists.length);

for (const playlist of playlists) {
  const tagSelector = selectors.get('playlist').get('tags');
  const tagNodes = playlist.querySelectorAll(tagSelector);
  const countSelector = selectors.get('playlist').get('count');
  const countNode = playlist.querySelector(countSelector);
  const countText = countNode.textContent;
  const countAdded = Number.parseInt(countText) || Number(0);
  const countOld = counts.get('videos').get('total');
  const countNew = countOld + countAdded;

  counts.get('videos').set('total', countNew);

  for (const tag of tagNodes) {
    const tagText = tag.textContent;
    const tagExists = counts.get('tags').has(tagText);
    const tagOld = tagExists ? counts.get('tags').get(tagText) : 0;
    const tagNew = tagOld + 1;

    counts.get('tags').set(tagText, tagNew);
  }
}

console.group('XVIDEOS Plus · Statistics');
console.info('Total videos: %s', counts.get('videos').get('total')),
console.info('Total playlists: %s', counts.get('playlist').get('total')),
console.table([...(counts.get('tags'))]);
console.groupEnd();

/**
  * Add styles
  */

GM_addStyle(rootStyles);
GM_addStyle(sharedStyles);
GM_addStyle(themeStyles);
GM_addStyle(generalStyles);

/**
  * Add dynamic styles
  */

const dynamicStyles = `
  .plus-buttons {
    margin-right: -${buttons.getBoundingClientRect().width - 23}px;
  }

  .plus-buttons:hover {
    margin-right: 0;
  }
`;

GM_addStyle(dynamicStyles);