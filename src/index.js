function initConfigs(shouldCreateTooltip = false, e) {
  const userSettingsKeys = Object.keys(configs);

  /// Load user settings
  chrome.storage.local.get(
    userSettingsKeys, function (loadedConfigs) {
      configs.changeTextSelectionColor = loadedConfigs.changeTextSelectionColor ?? false;
      configs.textSelectionBackground = loadedConfigs.textSelectionBackground || '#338FFF';
      configs.textSelectionColor = loadedConfigs.textSelectionColor || '#ffffff';
      configs.textSelectionBackgroundOpacity = loadedConfigs.textSelectionBackgroundOpacity || 1.0;
      configs.shouldOverrideWebsiteSelectionColor = loadedConfigs.shouldOverrideWebsiteSelectionColor ?? false;
      configs.enabled = loadedConfigs.enabled ?? true;

      /// Check for domain to be in black list
      configs.excludedDomains = loadedConfigs.excludedDomains || '';

      if (configs.excludedDomains !== null && configs.excludedDomains !== undefined && configs.excludedDomains !== '')
        configs.excludedDomains.split(',').forEach(function (domain) {
          if (window.location.href.includes(domain.trim().toLowerCase())) configs.enabled = false;
        });

      if (configs.enabled) {
        if (configs.changeTextSelectionColor)
          setTimeout(function () {
            setTextSelectionColor();
          }, 1);

        /// Assign loaded values to config variable
        const keys = Object.keys(configs);
        for (let i = 0, l = keys.length; i < l; i++) {
          try {
            let key = keys[i];
            if (loadedConfigs[key] !== null && loadedConfigs[key] !== undefined)
              configs[key] = loadedConfigs[key];
          } catch (e) {
            console.log('Selecton failed to restore config: ' + keys[i].toString());
            console.log('Error: ' + e.toString());
          }
        }

        /// Check for incorrect values
        if (configs.animationDuration < 0) configs.animationDuration = 0;
        if (configs.updateRatesEveryDays < 0) configs.updateRatesEveryDays = 14;

        addButtonIcons = configs.buttonsStyle == 'onlyicon' || configs.buttonsStyle == 'iconlabel';
        verticalSecondaryTooltip = configs.secondaryTooltipLayout == 'verticalLayout';

        if (configs.debugMode) {
          console.log('Loaded Selecton settings from memory:');
          console.log(configs);
        }

        /// Run only on first load
        if (configsWereLoaded == false) {

          /// Get translated button labels
          copyLabel = chrome.i18n.getMessage("copyLabel");
          searchLabel = chrome.i18n.getMessage("searchLabel");
          translateLabel = chrome.i18n.getMessage("translateLabel");
          openLinkLabel = chrome.i18n.getMessage("openLinkLabel");
          showOnMapLabel = chrome.i18n.getMessage("showOnMap");
          cutLabel = chrome.i18n.getMessage("cutLabel");
          pasteLabel = chrome.i18n.getMessage("pasteLabel");
          dictionaryLabel = chrome.i18n.getMessage("dictionaryLabel");

          setTimeout(function () {
            if (configs.addActionButtonsForTextFields)
              initMouseListeners();
            else
              document.addEventListener('selectionchange', selectionChangeInitListener);
          }, 1);

          configsWereLoaded = true;

          /// Fix for older browsers which don't support String.replaceAll (used here in a lot of places)
          if (!String.prototype.replaceAll) {
            String.prototype.replaceAll = function (find, replace) {
              return this.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
            };
          }
        }

        /// Set font-size
        document.documentElement.style.setProperty('--selecton-font-size', `${configs.useCustomStyle ? configs.fontSize : 12.5}px`);

        /// styles of tooltip button icon
        document.documentElement.style.setProperty('--selecton-button-icon-height', `${configs.fontSize * 1.35}px`);

        /// Set border radius
        document.documentElement.style.setProperty('--selecton-border-radius', `${configs.useCustomStyle ? configs.borderRadius : 3}px`);

        /// pop-up buttons border
        document.documentElement.style.setProperty('--selecton-button-border-left', configs.reverseTooltipButtonsOrder ? 'none' : '1px solid var(--selection-button-background-hover)');
        document.documentElement.style.setProperty('--selecton-button-border-right', configs.reverseTooltipButtonsOrder ? '1px solid var(--selection-button-background-hover)' : 'none');

        /// pop-up inner and button inner paddings
        document.documentElement.style.setProperty('--selecton-tooltip-inner-padding', '2px');

        switch (configs.buttonsStyle) {
          case 'onlylabel': {
            document.documentElement.style.setProperty('--selecton-button-padding', '4px 10px');
          } break;
          case 'onlyicon': {
            document.documentElement.style.setProperty('--selecton-button-padding', '3px 10px');
          } break;
          case 'iconlabel': {
            document.documentElement.style.setProperty('--selecton-button-padding', '3px 8px');
          } break;
          default: {
            document.documentElement.style.setProperty('--selecton-button-padding', '4px 10px');
          } break;
        }

        /// selection handle circle radius
        document.documentElement.style.setProperty('--selecton-handle-circle-radius', '12.5px');

        /// search tooltip icon size
        document.documentElement.style.setProperty('--selecton-search-tooltip-icon-size', `${configs.secondaryTooltipIconSize}px`);

        /// Anim duration
        document.documentElement.style.setProperty('--selecton-anim-duration', `${configs.animationDuration}ms`);

        /// Check browser locales on first launch (language and metric system)
        if (loadedConfigs.preferredMetricsSystem == null || loadedConfigs.preferredMetricsSystem == undefined)
          try { setDefaultLocales(); } catch (e) { }

        /// Check if word snapping is allowed on page
        domainIsBlacklistedForSnapping = false;
        if (configs.snapSelectionToWord && configs.wordSnappingBlacklist !== null && configs.wordSnappingBlacklist !== undefined && configs.wordSnappingBlacklist !== '')
          configs.wordSnappingBlacklist.split(',').forEach(function (domain) {
            if (window.location.href.includes(domain.trim().toLowerCase())) domainIsBlacklistedForSnapping = true;
          });

        /// Fetch or load currency rates from storage
        // fetchCurrencyRates(); /// enforce rates fetch for testing

        if (configs.convertCurrencies) {
          ratesLastFetchedDate = loadedConfigs.ratesLastFetchedDate;

          if (ratesLastFetchedDate == null || ratesLastFetchedDate == undefined || ratesLastFetchedDate == '')
            fetchCurrencyRates();
          else {
            let today = new Date();
            let dayOfNextFetch = new Date(ratesLastFetchedDate);
            const oneDayInMilliseconds = 1000 * 60 * 60 * 24;

            if (configs.debugMode) {
              console.log('--- Check dates to update currency rates ---');
              console.log('Today: ' + today);
              console.log('Date of last fetch: ' + dayOfNextFetch);
            }

            today = today.getTime();
            dayOfNextFetch = new Date(dayOfNextFetch.getTime() + (configs.updateRatesEveryDays * oneDayInMilliseconds));

            if (configs.debugMode) {
              console.log('Rates update interval: ' + configs.updateRatesEveryDays);
              console.log('Date of next fetch: ' + dayOfNextFetch);
              console.log('--- Finished checking dates ---');
            }

            if (today >= dayOfNextFetch) fetchCurrencyRates(); /// update rates from server
            else loadCurrencyRatesFromMemory();
          }
        }

        if (shouldCreateTooltip)
          createTooltip(e);
      }
    });
}

function setTextSelectionColor() {
  let importance = configs.shouldOverrideWebsiteSelectionColor ? '!important' : '';

  // CSS rules
  let selectionBackgroundRgb = hexToRgb(configs.textSelectionBackground);

  let rule = `::selection {background-color: rgba(${selectionBackgroundRgb.red}, ${selectionBackgroundRgb.green}, ${selectionBackgroundRgb.blue}, ${configs.textSelectionBackgroundOpacity}) ${importance}; color: ${configs.textSelectionColor} ${importance}; }`;
  rule += `::-moz-selection {background-color: rgba(${selectionBackgroundRgb.red}, ${selectionBackgroundRgb.green}, ${selectionBackgroundRgb.blue}, ${configs.textSelectionBackgroundOpacity}) ${importance}; color: ${configs.textSelectionColor} ${importance};}`;

  let css = document.createElement('style');
  css.type = 'text/css';
  css.appendChild(document.createTextNode(rule)); // Support for the rest
  document.getElementsByTagName("head")[0].appendChild(css);

  if (configs.debugMode)
    console.log('Selecton applied custom selection color')
}

function initMouseListeners() {
  document.addEventListener("mousedown", function (e) {
    if (isDraggingTooltip || isDraggingDragHandle) return;
    if (tooltipIsShown == false) return;

    /// Middle button click
    if (e.button == 1 && configs.middleClickHidesTooltip) {
      selection = null;
      hideTooltip();
      hideDragHandles();
    }
  });

  document.addEventListener("mouseup", function (e) {
    if (!configs.enabled) return;
    if (isDraggingTooltip) return;
    if (tooltipIsShown && e.detail < 3) return;

    /// Don't recreate tooltip when some text selected on page — and user clicked on link or button
    const documentActiveElTag = document.activeElement.tagName;
    if (documentActiveElTag == 'A' || documentActiveElTag == 'BUTTON') return;

    /// Special handling for triple mouse click (paragraph selection)
    if (e.detail == 3) {
      hideDragHandles(false);
      return;
    }

    /// Get page selection
    selection = window.getSelection();
    selectedText = selection.toString().trim();

    /// Check if clicked on text field
    // if (configs.addActionButtonsForTextFields && e.detail == 1) checkTextField(e);
    checkTextField(e);

    if (selectedText.length > 0) {
      /// create tooltip for selection
      setCssStyles();
      initTooltip(e);
    } else {
      /// no selection on page - check if textfield is focused to create 'Paste' tooltip
      // if (configs.addActionButtonsForTextFields && isTextFieldFocused) {
      if (configs.addActionButtonsForTextFields && isTextFieldFocused) {
        setCssStyles();
        initTooltip(e);
      }
    }
  });

  function setCssStyles() {
    if (configs.debugMode)
      console.log('--- Creating Selecton tooltip ---');

    /// Check page to have dark background
    setTimeout(function () {
      let isDarkPage = false;

      if (configs.invertColorOnDarkWebsite)
        try {
          const anchornode = selection.anchorNode;
          if (anchornode)
            isDarkPage = checkSelectionToHaveDarkBackground(anchornode);
        } catch (e) { }

      /// Set css styles
      if (configs.useCustomStyle) {
        /// Custom style from settings
        const bgColor = isDarkPage ? configs.tooltipInvertedBackground : configs.tooltipBackground;
        document.documentElement.style.setProperty('--selecton-background-color', bgColor);
        getTextColorForBackground(bgColor);

        document.documentElement.style.setProperty('--selection-button-foreground', isDarkTooltip ? 'rgb(255,255,255)' : 'rgb(0,0,0)');
        document.documentElement.style.setProperty('--selection-button-background-hover', isDarkTooltip ? 'rgba(255,255,255, 0.3)' : 'rgba(0,0,0, 0.5)');
        document.documentElement.style.setProperty('--selecton-outline-color', isDarkTooltip ? 'rgba(255,255,255, 0.2)' : 'rgba(0,0,0, 0.2)');
        secondaryColor = isDarkTooltip ? 'lightBlue' : 'royalBlue';
      } else {
        /// Default style
        document.documentElement.style.setProperty('--selecton-background-color', isDarkPage ? '#bfbfbf' : '#4c4c4c');
        document.documentElement.style.setProperty('--selection-button-foreground', isDarkPage ? '#000000' : '#ffffff');
        document.documentElement.style.setProperty('--selection-button-background-hover', isDarkPage ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)');
        document.documentElement.style.setProperty('--selecton-outline-color', isDarkPage ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)');
        secondaryColor = isDarkPage ? 'royalBlue' : 'lightBlue';
        isDarkTooltip = !isDarkPage;
      }

      /// Invert buttons icons when dark tooltip
      document.documentElement.style.setProperty('--selecton-button-icon-invert', `invert(${isDarkTooltip ? '100' : '0'}%)`);

      /// Accent color for convert result buttons
      document.documentElement.style.setProperty('--selecton-secondary-color', secondaryColor);
    }, 0);
  }

  function checkTextField() {
    /// check if textfield is focused

    const activeEl = document.activeElement;
    isTextFieldFocused = (activeEl.tagName === "INPUT" && (activeEl.getAttribute('type') == 'text') || activeEl.getAttribute('name') == 'text') ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.getAttribute('contenteditable') !== null;

    if (isTextFieldFocused && configs.addActionButtonsForTextFields) {

      /// Special handling for Firefox 
      /// (https://stackoverflow.com/questions/20419515/window-getselection-of-textarea-not-working-in-firefox)
      if (selectedText == '' && navigator.userAgent.indexOf("Firefox") > -1) {
        const ta = document.querySelector(':focus');
        if (ta != null && ta.value != undefined) {
          selectedText = ta.value.substring(ta.selectionStart, ta.selectionEnd);
          selection = ta.value.substring(ta.selectionStart, ta.selectionEnd);
        }
      }

      if (selectedText == '') hideTooltip(); /// Hide previous 'paste' button

      if (configs.addPasteOnlyEmptyField) {
        /// Ignore single click on text field with inputted value
        try {
          if (activeEl.getAttribute('contenteditable') != null && activeEl.innerHTML != '' && selectedText == '' && activeEl.innerHTML != '<br>')
            isTextFieldFocused = false;
          else
            if (activeEl.value.trim() !== '' && selectedText == '') isTextFieldFocused = false;
        } catch (e) { console.log(e); }
      }
    }
  }

  function initTooltip(e) {
    if (configs.applyConfigsImmediately)
      initConfigs(true, e); /// createTooltip will be called after checking for updated configs
    else
      createTooltip(e);
  }

  try {
    window.addEventListener('popstate', function () {
      hideTooltip();
      hideDragHandles();
      if (configs.debugMode) console.log('Selecton tooltip was hidden on url change');
    });
  } catch (error) {
    if (configs.debugMode)
      console.log(error);
  }

  /// Hide tooltip on scroll
  document.addEventListener('wheel', hideOnScrollListener);
  document.addEventListener('scroll', hideOnScrollListener);

  function hideOnScrollListener(e) {
    if (isDraggingDragHandle)
      hideDragHandles(true, true);

    if (tooltipIsShown == false) return;

    if (configs.floatingOffscreenTooltip) /// dont hide tooltip if it's floating
      if (floatingTooltipTop != false) {
        if (window.scrollY >= floatingTooltipTop) return;
      } else if (floatingTooltipBottom != false) {
        if (window.scrollY <= floatingTooltipBottom) return;
      }

    hideTooltip(false);
    hideDragHandles(false);
    recreateTooltip();
  }

  /// Hide tooltip on window resize
  window.addEventListener('resize', function (e) {
    if (tooltipIsShown == false) return;

    if (configs.debugMode)
      console.log('hiding all Selecton overlays on window resize...');

    hideTooltip(false);
    hideDragHandles(false);
    recreateTooltip();
  });

  /// Hide tooltip when any key is pressed
  if (configs.hideOnKeypress)
    document.addEventListener("keydown", function (e) {
      if (tooltipIsShown == false) return;
      if (e.key == 'Control') return;
      if (e.shiftKey) return;

      hideTooltip();
      hideDragHandles();
    });

  if (configs.debugMode)
    console.log('Selection initiated mouse listeners');
}

function recreateTooltip() {
  if (configs.recreateTooltipAfterScroll == false) return;

  if (timerToRecreateOverlays !== null) {
    clearTimeout(timerToRecreateOverlays);
    timerToRecreateOverlays = null;
  }

  timerToRecreateOverlays = setTimeout(function () {
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection) {
      selection = document.selection.createRange();
    }

    if ((selection !== null && selection !== undefined && selection.toString().trim().length > 0)) {
      createTooltip(lastMouseUpEvent, true);
    }
  }, 650);
}

function selectionChangeInitListener() {
  if (!configs.enabled) return;
  if (document.getSelection().toString().length < 1) return;
  document.removeEventListener('selectionchange', selectionChangeInitListener);

  try {
    initMouseListeners();
  } catch (e) {
    if (configs.debugMode)
      console.log('Error while setting Selecton mouse listeners: ' + e);
  }
}

// function domLoadedListener() {
//   document.removeEventListener('DOMContentLoaded', domLoadedListener);
//   initConfigs(false);
// }

// document.addEventListener('DOMContentLoaded', domLoadedListener);

initConfigs(false);