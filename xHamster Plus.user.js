// ==UserScript==
// @author            Mr. Nope
// @version          20230612
// @name               xHamster Plus
// @description  A kinder xHamster. Because you're worth it.
// @include         *xhamster.com*
// @grant             GM_addStyle
// @license          CC0
// @icon               https://static-cl.xhcdn.com/xh-tpl3/images/favicon/apple-touch-icon.png
// ==/UserScript==

'use strict';

(() => {
  const OPTIONS = {
    cinemaMode: JSON.parse(localStorage.getItem('plus_cinemaMode')) || true,
    autoLanguage: JSON.parse(localStorage.getItem('plus_autoLanguage')) || false
  };

  /**
   * Shared Styles
   */

  const sharedStyles = `
      /* Our own elements */

      .plus-buttons {
        background: rgba(67, 67, 67, 0.85);
        box-shadow: 0px 0px 12px rgba(20, 111, 223, 0.85);
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
        box-shadow: 0px 0px 18px rgba(227, 68, 73, 1);
      }

      .plus-buttons:hover {
        box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.3);
      }

      .plus-buttons a.plus-button {
        background: rgb(218, 218, 218);
        color: rgb(48, 48, 48);
      }

      .plus-buttons a.plus-button:hover {
        background: rgb(204, 204, 204);
        color: rgb(48, 48, 48);
      }

      .plus-buttons a.plus-button.plus-button-isOn {
        background: rgb(227, 68, 73);
        color: rgb(255, 255, 255);
      }

      .plus-buttons a.plus-button.plus-button-isOn:hover {
        background: rgb(212, 32, 37);
        color: rgb(255, 255, 255);
      }
    `;

  /**
   * Site-Specific Styles
   */

  const generalStyles = `
      /* Hide elements */

      .yld-pdright-rectangle,
      .main-wrap > aside,
      .up-arrow,
      .premium-overlay,
      .bottom-widget-section,
      .clipstore-bottom,
      .wid-spot-container,
      .wid-banner-container,
      .wixx-eplayer,
      .wixx-ecam-thumb,
      .wixx-epremium-overlay,
      .wixx-eright-rectangle,
      aside[data-role="promo"],
      .ytd-j,
      .ytd-jcam-thumb,
      div[data-role="ytd-jbanner-underplayer"],
      div[data-role="wixx-ebanner-underplayer"] {
        display: none !important;
      }

      /* Remove right-side banner/sponsors from category pages/searches */

      .thumb-list--banner {
        height: auto !important;
        width: auto !important;
      }

      /* Remove bottom banner, under video player */

      .video-page .controls {
        margin-top: 15px;
      }

      /* Increase large player size */

      .video-page.video-page--large-mode .player-container__player {
        height: 720px;
      }

      /* Show all playlists without scrolling when adding to favorites */

      .favorites-dropdown__list {
        max-height: unset !important;
      }

      /* Fix z-index of comments so playlists are positioned above */

      .video-page .comments-container {
        position: relative !important;
        z-index: 0 !important;
      }

      .video-page:not(.video-page--large-mode) .player-container {
        margin: 10px auto 0;
      }

      .video-page:not(.video-page--large-mode) .entity-container,
      .video-page:not(.video-page--large-mode) .comments-wrap {
        margin: 0 auto;
      }

      /* Minor stylistic improvements */

      .entity-container {
        margin: 22px 0;
        margin-bottom: 22px;
        border-top: 1px solid #ccc;
      }
    `;

  /**
   * Checks for a subdomain, and if found it hacks it to pieces and puts them in a blender.
   * Returns an object containing a boolean `isModified`, `true` if the returned hostname
   * differs from the initial, and hopefully the desired hostname in `to` and the initial
   * hostname in `from`.
   *
   * @example
   *
   *     // ru.example.com => example.com in this snippet:
   *
   *     const { isModified, to, from } = changeTopLevelHost({ to: 'example.com' });
   *
   * @param {object} opts - Arguments object, cleaner than separate parameters.
   * @param {string} opts.to - Valid hostname to strip down to, e.g. `example.com`.
   * @returns {object} - Object with `newHostname`, `oldHostname`, and `hasChanged`.
   * @throws {TypeError} - Throws on invalid hostname parameter.
   */
  const changeTopLevelHost = ({ to }) => {
    // Constructor gives an empty string if `hostname` is undefined, prevents errors.
    const validParts = String(to).split('.');

    // Need to provide string with two or more parts separated by periods, e.g. `xhamster.com`. If
    // only `xhamster` is specified, `.com` would be stripped and the redirect would break.
    if (validParts.length < 2) {
      throw new TypeError(
        `Function "${changeTopLevelHost.name}" expects a valid hostname (domain and TLD).`
      );
    }

    // Filter out unwanted parts of hostname and check if the result differs.
    const fromHostname = location.hostname;
    const toHostname = to.split('.').filter(part => validParts.includes(part)).join('.');
    const isModified = fromHostname !== toHostname;

    // Throw if new hostname doesn't have 2+ parts, i.e. valid parameters were not provided.
    if (toHostname.split('.').length < 2) {
      throw new TypeError(
        `Function "${changeTopLevelHost.name}" resulted in an invalid URL: ${toHostname}`
      );
    }

    // Skip `Object` prototype as we only need these properties.
    return Object.create(null, {
      isModified: { value: isModified },
      from: { value: fromHostname },
      to: { value: toHostname },
    });
  };

  /**
    * Store shit in variables for faster access
    */

  const player = document.querySelector('#player-container');
  const video = document.querySelector('#player-container video');
  const html = document.querySelector('html');

  /**
    * Switch to English
    */

  if (OPTIONS.autoLanguage && html.lang !== 'us') {
    console.info('NX: Changing language to English.');

    try {
      const { pathname } = location;
      const { to: newHostname } = changeTopLevelHost({ to: 'xhamster.com' }); // Make desired hostname.
      const { href: newUrl } = new URL(pathname, `https://${newHostname}`); // HTTPS always.

      // We need to set the `lang` cookie...
      document.cookie = 'lang=us; domain=xhamster.com; path=/';

      // ...and then redirect to the English site.
      window.location = newUrl;

      console.info('NX: Language change successful.'); // Persistent console needed to see this.
    } catch (error) {
      console.error(`Unable to change language to English. Error: ${error}`);
    }
  }

  /**
   * Toggle cinema mode
   */

  if (video && OPTIONS.cinemaMode) {
    // Button is not always available right away, so we wait for `canplay`
    video.addEventListener('canplay', function onCanPlay() {
      const largePlayerButton = document.querySelector('.large-mode');

      // Click large player button
      largePlayerButton.dispatchEvent(new MouseEvent('click'));

      // Only run once
      video.removeEventListener('canplay', onCanPlay, false);
    });
  }

  /**
   * Show video "about" section by default.
   */

  const aboutButton = document.querySelector('.xh-button.about-control');
  const aboutContainer = document.querySelector('.ab-info.controls-info__item.xh-helper-hidden');

  if (aboutContainer && aboutButton) {
    aboutButton.classList.add('selected');
    aboutContainer.classList.remove('xh-helper-hidden');
  }

  /**
   * Auto-pause background tabs
   */

  const channel = new BroadcastChannel('autopause');

  const triggerPauseVideo = () => {
    channel.postMessage(null);
  };

  const doPauseVideo = () => {
    video.pause();
  };

  const setAutoPause = (shouldPause) => {
    if (OPTIONS.autoPause && video) {
      if (shouldPause) {
        video.addEventListener('play', triggerPauseVideo);
        channel.addEventListener('message', doPauseVideo);
      } else {
        video.removeEventListener('play', triggerPauseVideo);
        channel.removeEventListener('message', doPauseVideo);
      }
    }
  };

  if (OPTIONS.autoPause && video) {
    setAutoPause(true);
  }

  /**
   * Create buttons for options
   */

  const buttons = document.createElement('div');
  const scrollButton = document.createElement('a');
  const scrollButtonText = document.createElement('span');
  const cinemaModeButton = document.createElement('a');
  const cinemaModeButtonText = document.createElement('span');
  const cinemaModeButtonState = OPTIONS.cinemaMode ? 'plus-button-isOn' : 'plus-button-isOff';
  const languageButton = document.createElement('a');
  const languageButtonText = document.createElement('span');
  const languageButtonState = OPTIONS.autoLanguage ? 'plus-button-isOn' : 'plus-button-isOff';

  scrollButtonText.textContent = "Scroll to Top";
  scrollButtonText.classList.add('text');
  scrollButton.appendChild(scrollButtonText);
  scrollButton.classList.add('plus-button');
  scrollButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0
    });
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

  languageButtonText.textContent = 'Auto-redirect to English';
  languageButtonText.classList.add('text');
  languageButton.appendChild(languageButtonText);
  languageButton.classList.add(languageButtonState, 'plus-button');
  languageButton.addEventListener('click', () => {
    OPTIONS.autoLanguage = !OPTIONS.autoLanguage;
    localStorage.setItem('plus_autoLanguage', OPTIONS.autoLanguage);

    if (OPTIONS.autoLanguage) {
      languageButton.classList.replace('plus-button-isOff', 'plus-button-isOn');
    } else {
      languageButton.classList.replace('plus-button-isOn', 'plus-button-isOff');
    }
  });

  buttons.classList.add('plus-buttons');

  buttons.appendChild(scrollButton);
  buttons.appendChild(cinemaModeButton);
  buttons.appendChild(languageButton);

  document.body.appendChild(buttons);

  /**
   * Add styles
   */

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

    .video-page.video-page--large-mode .player-container__player {
      max-height: ${window.innerHeight - 60}px;
    }
  `;

  GM_addStyle(dynamicStyles);

  /**
   * Updating dynamic styles on window resize
   */

  if (player) {
    window.addEventListener('resize', () => {
      if (player.classList.contains('xplayer-large-mode')) {
        player.style.maxHeight = `${window.innerHeight - 60}px`;
      }
    });
  }
})();