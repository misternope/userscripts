// ==UserScript==
// @author      Mr. Nope
// @version     1.0
// @name        XNXX Plus
// @description A kinder XNXX. Because you're worth it.
// @namespace   Nope
// @date        2019-02-23
// @include     *xnxx.com*
// @run-at      document-start
// @grant       none
// @license     Public Domain
// @icon        http://www.viraltrendzz.com/facts/disappointing-truths-porn-industry/attachment/xnxx-logo/
// @grant       GM_addStyle
// ==/UserScript==

'use strict';

(() => {
  const OPTIONS = {
    autoplay: JSON.parse(localStorage.getItem('plus_autoplay')) || false,
    cinemaMode: JSON.parse(localStorage.getItem('plus_cinemaMode')) || false
  };

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
      box-shadow: 0px 0px 12px rgba(102, 147, 241, 0.85);
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
      background: rgb(102, 147, 241);
      color: rgb(255, 255, 255);
    }

    .plus-buttons a.plus-button.plus-button-isOn:hover {
      background: rgb(102, 147, 241);
      color: rgb(0, 0, 0);
    }
  `;

  /**
   * Site-Specific Styles
   */
  const generalStyles = `
    /* Hide elements */

    .abovePlayer,
    .streamatesModelsContainer,
    #headerUpgradePremiumBtn,
    #headerUploadBtn,
    #PornhubNetworkBar,
    #js-abContainterMain,
    #hd-rightColVideoPage > :not(#relatedVideosVPage) {
      display: none !important;
    }

    #related-videos .thumb-block {
      opacity: 1;
    }

    #related-videos .thumb-block:hover {
      opacity: 1;
    }
  `;

  /**
   * Run on page load
   */
  window.addEventListener('DOMContentLoaded', () => {
    const video = document.querySelector('#html5video video'); // References the HTML5 Video element

    /**
     * Create option buttons
     */

    const buttons = document.createElement('div');

    const scrollButton = document.createElement('a');
    const scrollButtonText = document.createElement('span');

    const autoplayButton = document.createElement('a');
    const autoplayButtonText = document.createElement('span');
    const autoplayButtonState = OPTIONS.autoplay ? 'plus-button-isOn' : 'plus-button-isOff';

    const cinemaModeButton = document.createElement('a');
    const cinemaModeButtonText = document.createElement('span');
    const cinemaModeButtonState = OPTIONS.cinemaMode ? 'plus-button-isOn' : 'plus-button-isOff';

    scrollButtonText.textContent = "Scroll to Top";
    scrollButtonText.classList.add('text');
    scrollButton.appendChild(scrollButtonText);
    scrollButton.classList.add('plus-button');
    scrollButton.addEventListener('click', () => {
      window.scrollTo({ top: 0 });
    });

    cinemaModeButtonText.textContent = 'Cinema Mode';
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

    buttons.appendChild(scrollButton);
    buttons.appendChild(autoplayButton);
    buttons.appendChild(cinemaModeButton);

    document.body.appendChild(buttons);

    /**
     * Initialize video pages containing valid video element
     */

    if (/^http[s]*:\/\/[www.]*xnxx\.com\/video/.test(window.location.href) && video) {

      /**
       * Toggle cinema mode if enabled
       */
      if (video && OPTIONS.cinemaMode) {
        document.querySelector('#content').classList.add('player-enlarged');
        document.querySelector('.mobile-hide').style.display = 'none';

        console.log('test');
        // Button is not always available right away, so we wait for `canplay`
        video.addEventListener('canplay', function onCanPlay() {
          document.querySelector('.buttons-bar.right :nth-child(3)').dispatchEvent(new MouseEvent('click'));

          // Only run once
          video.removeEventListener('canplay', onCanPlay, false);
        });
      }

      /**
       * Autoplay video if enabled
       */
      if (video && OPTIONS.autoplay) {
        video.addEventListener('canplay', function onCanPlay() {
          document.querySelector('.big-buttons .play').dispatchEvent(new MouseEvent('click'));

          // Only run once
          video.removeEventListener('canplay', onCanPlay, false);
        });

      }
    }

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
    `;

    GM_addStyle(dynamicStyles);
  });
})();