import '../scss/read-it-to-me.scss';

import {initSynthesis} from './synthesis';

let synth;
const ritmDisabledClassName = 'ritm-disabled';
const groupClassName = 'read-it-to-me-content-group';
const focusClassName = 'focusin';
let contentQueue = [];
let controlBar;
let ritmEnabled = true;
let eventsBin = {
  play: null,
  pause: null,
  cancel: null,
  toggle: null
};

let setup = () => {
  addReadItToMeElements();
  attachEvents();

  // Toggle RITM off if set as disabled in sessionStorage
  if (sessionStorage.getItem('readItToMeDisabled')) {
    controlBar.querySelector('input.switch-input').checked = false;
    toggleReadItToMe();
  }
};

let addReadItToMeElements = () => {
  // build the control bubble
  const controlBubble = document.createElement('div');
  controlBubble.classList.add('read-it-to-me-control-bubble');
  controlBubble.tabIndex = -1;
  controlBubble.innerHTML = '<p class="read-it-to-me-label"></p><button type="button" class="play-pause-resume"></button><button type="button" class="cancel-audio"><span class="visually-hidden">Cancel audio</a></button>';

  const groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
  // Inner wrap each readable group in a new div.read-this-to-me
  const wrapSource = document.createElement('div');
  wrapSource.classList.add('read-this-to-me');
  groupSelectorElements.forEach((elem) => {
    let wrapper = wrapSource.cloneNode(false);
    elem.appendChild(wrapper);
    while (elem.firstChild !== wrapper) {
      wrapper.appendChild(elem.firstChild);
    }

    const clonedControlBubble = controlBubble.cloneNode(true);

    clonedControlBubble.addEventListener('focusin', focusInListener(elem));
    clonedControlBubble.addEventListener('focusout', focusOutListener(elem));
    clonedControlBubble.querySelector('button.play-pause-resume').addEventListener('click', (e) => {
      if (!ritmEnabled) {return false;}

      e.stopPropagation();
      let currentContentGroup = e.target.closest(`.${groupClassName}`);
      contentGroupManager(currentContentGroup);
    });
    clonedControlBubble.querySelector('button.cancel-audio').addEventListener('click', cancelAudio(clonedControlBubble));

    elem.insertBefore(clonedControlBubble, wrapper);
  });

  // build the control bar
  controlBar = document.createElement('div');
  controlBar.classList.add('read-it-to-me-control-bar');
  controlBar.setAttribute('tabindex', '0');
  controlBar.setAttribute('aria-describedby', 'ritm-sr-message');
  controlBar.innerHTML = `<div class="toggle-wrapper">
                            <p class="visually-hidden" id="ritm-sr-message">Screen-reader users: there is a rudimentary "on-demand" read-aloud feature in use on this page called "Read-it-to-Me".  This new feature, which isn't meant as a screen-reader alternative, adds more tabable areas in the document which are great for keyboard users not using screen-readers, but are likely to be annoying for you. You can toggle off/on "Read-it-to-Me" using this checkbox.</p>
                            <p class="read-it-to-me-label">Toggle Read-it-to-Me</p>
                            <label class="switch" aria-label="Toggle Read-it-to-Me." aria-describedby="ritm-sr-message">
                              <input type="checkbox" class="switch-input" checked>
                              <span class="switch-outline"></span>
                              <span class="switch-label" data-on="On" data-off="Off"></span>
                              <span class="switch-handle"></span>
                            </label>
                          </div>
                          <div class="cancel-audio-wrapper">
                            <button type="button" class="btn btn-default btn-lg">Cancel audio</button>
                          </div>`;

  // append the control bar to body where it's least likely to be effected by layout styling and the control bubble so we can attach events to it.
  let docBody = document.body;
  docBody.insertBefore(controlBar, docBody.firstChild);
};

let clearStrayFocus = () => {
  let strayFocus = document.querySelector(`.${focusClassName}`);
  if (strayFocus) {
    strayFocus.classList.remove(focusClassName);
  }
};

const focusInListener = elem => e => {
  if (!ritmEnabled) {return false;}

  // don't want this bubbling up from nested groups
  e.stopPropagation();

  elem.classList.add(focusClassName);
};

const focusOutListener = elem => e => {
  // don't want this bubbling up from nested groups
  e.stopPropagation();

  elem.classList.remove(focusClassName);
};

let toggleReadItToMe = (e) => {
  let toggleSwitch = e ? e.target : controlBar.querySelector('input.switch-input');
  let groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
  if (toggleSwitch.checked) {
    ritmEnabled = true;
    sessionStorage.removeItem('readItToMeDisabled');
    groupSelectorElements.forEach((elem) => {
      elem.classList.remove(ritmDisabledClassName);
    });
  }
  else {
    ritmEnabled = false;
    clearStrayFocus();
    synth.cancel();
    sessionStorage.setItem('readItToMeDisabled', '1');
    groupSelectorElements.forEach((elem) => {
      elem.classList.add(ritmDisabledClassName);
      if (!elem.classList.contains('ritm-do-not-strip-tabindex')) {
        elem.removeAttribute('tabindex');
      }
    });
  }

  // optional track toggle event
  if (e && eventsBin.toggle) {
    eventsBin.toggle();
  }
};

let controlBarFocusIn = (e) => {
  if (e.target && controlBar.contains(e.target)) {
    if (!controlBar.classList.contains('control-bar-show')) {
      showControlBar();
    }
  }
};

let controlBarFocusOut = (e) => {
  if ((e.relatedTarget && !controlBar.contains(e.relatedTarget)) || !e.relatedTarget) {
    hideControlBar();
  }
};

let cancelAudio = toFocus => function() {
  // optional track cancel event
  if (eventsBin.cancel) {
    try {
      eventsBin.cancel();
    }
    catch (e) {}
  }
  // move focus to appropriate place, because the cancel button is about to disappear
  if (toFocus.contains(this)) {
    toFocus.focus();
  }
  cancel();
};

let attachEvents = () => {
  controlBar.querySelector('button').addEventListener('click', cancelAudio(controlBar));
  controlBar.querySelector('input.switch-input').addEventListener('change', toggleReadItToMe);
  controlBar.addEventListener('focusin', controlBarFocusIn);
  controlBar.addEventListener('focusout', controlBarFocusOut);
};

let contentGroupManager = (currentContentGroup) => {
  if (!currentContentGroup.classList.contains('read-it-to-me-play') && !currentContentGroup.classList.contains('read-it-to-me-pause')) {
    contentQueue.push(currentContentGroup);
    if (document.querySelectorAll('.read-it-to-me-play').length > 0 || document.querySelectorAll('.read-it-to-me-pause').length > 0) {
      cancel();
    }
    else {
      play();
    }
    currentContentGroup.classList.toggle('read-it-to-me-play');
  }
  else if (currentContentGroup.classList.contains('read-it-to-me-play')) {
    pause();
    currentContentGroup.classList.toggle('read-it-to-me-play');
    currentContentGroup.classList.toggle('read-it-to-me-pause');
  }
  else if (currentContentGroup.classList.contains('read-it-to-me-pause')) {
    resume();
    currentContentGroup.classList.toggle('read-it-to-me-play');
    currentContentGroup.classList.toggle('read-it-to-me-pause');
  }
};

let clearContentGroup = (contentGroup) => {
  contentGroup.classList.remove('read-it-to-me-play');
  contentGroup.classList.remove('read-it-to-me-pause');
};

let showCancelButton = () => {
  controlBar.classList.add('show-ritm-cancel');
};

let hideCancelButton = () => {
  controlBar.classList.remove('show-ritm-cancel');
};

let showControlBar = () => {
  controlBar.classList.add('control-bar-show');
};

let hideControlBar = () => {
  controlBar.classList.remove('control-bar-show');
};

let getPlainTextWithPsuedoSemantics = (textAncestor) => {
  // In a copy of the node list, pepper in (dramatically misuse, hehe) some punctuation for the purpose of adding meaningful pauses and 'emphasis' during text readout.
  let clonedTextAncestor = textAncestor.cloneNode(true);
  clonedTextAncestor.querySelectorAll('p, li, abbr, strong, em, h1, h2, h3, h4, h5, h6').forEach((elem) => {
    let tag = elem.tagName.toUpperCase();
    if (tag === 'P') {
      elem.appendChild(document.createTextNode('. '));
    }
    else if (tag === "ABBR") {
      let elemText = elem.textContent;
      let arr = elemText.split('');
      elem.textContent = arr.join('.');
    }
    else if (tag === 'STRONG' || tag === 'EM') {
      elem.insertBefore(document.createTextNode(', '), elem.firstChild);
      elem.appendChild(document.createTextNode(', '));
    }
    else if (tag === 'LI') {
      elem.appendChild(document.createTextNode(', '));
    }
    else if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
      elem.appendChild(document.createTextNode(', '));
    }
  });

  // return the modified text
  return clonedTextAncestor.textContent;
};

let utteranceEnd = () => {
  if (contentQueue.length > 0) {
    clearContentGroup(contentQueue[0]);
    hideControlBar();
    hideCancelButton();
    contentQueue.shift();
  }
  if (contentQueue.length > 0) {
    play();
  }
};

let play = () => {
  // setup the new utterance
  let enhancedText = getPlainTextWithPsuedoSemantics(contentQueue[0].querySelector('.read-this-to-me'));
  synth.play({text: enhancedText}, utteranceEnd);
  showCancelButton();
  showControlBar();

  // optional track play event
  if (eventsBin.play) {
    eventsBin.play();
  }
};

let pause = () => {
  synth.pause();

  // optional track pause event
  if (eventsBin.pause) {
    eventsBin.pause();
  }
};

let resume = () => {
  synth.resume();
};

let cancel = () => {
  hideCancelButton();
  synth.cancel();
};

export function init(selectors) {
  // If there's nothing to read, don't initialize
  if (!((selectors && document.querySelectorAll(selectors).length > 0) || document.querySelectorAll(`.${groupClassName}`).length > 0)) {
    return;
  }

  initSynthesis(undefined, (error, synthesis) => {
    if (!error && synthesis) {
      synth = synthesis;

      // if custom selectors were passed in, give the associated elements the default group class
      if (selectors && document.querySelectorAll(selectors).length > 0) {
        document.querySelectorAll(selectors).forEach((elem) => {
          elem.classList.add(groupClassName);
        });
      }

      setup();
    }
    else {
      // strip out classes that would apply ReadItToMe visuals
      document.querySelectorAll(`.${groupClassName}`).forEach((elem) => {
        elem.classList.remove(groupClassName, focusClassName);
      });
    }
  });
}

export function isEnabled () {
  return ritmEnabled;
}

export function currentUtteranceIdentifier() {
  if (contentQueue[0] && contentQueue[0].dataset.ritmOptionalTrackingIdentifier && contentQueue[0].dataset.ritmOptionalTrackingIdentifier !== "") {
    return contentQueue[0].dataset.ritmOptionalTrackingIdentifier;
  }
  return false;
}

export function eventTracking(obj) {
  if (obj) {
    if (obj.play && typeof obj.play === 'function') {
      eventsBin.play = obj.play;
    }
    if (obj.pause && typeof obj.pause === 'function') {
      eventsBin.pause = obj.pause;
    }
    if (obj.cancel && typeof obj.cancel === 'function') {
      eventsBin.cancel = obj.cancel;
    }
    if (obj.toggle && typeof obj.toggle === 'function') {
      eventsBin.toggle = obj.toggle;
    }
  }
}