import '../scss/read-it-to-me.scss';

import {initSynthesis} from './synthesis';
import {createControlBar} from './control-bar';
import {createRITMGroup, PLAYING_STATE} from './group';
import {initEventTracking} from './events';

let synth;
const ritmDisabledClassName = 'ritm-disabled';
const groupClassName = 'read-it-to-me-content-group';
const focusClassName = 'focusin';
let controlBar;
let contentGroups = [];
let currentGroup;
let nextGroup;
let ritmEnabled = true;
const {eventsBin, setHandlers} = initEventTracking();

let setup = () => {
  addReadItToMeElements();

  // Toggle RITM off if set as disabled in sessionStorage
  if (sessionStorage.getItem('readItToMeDisabled')) {
    setReadItToMe(false);
  }
};

let addReadItToMeElements = () => {
  const groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
  groupSelectorElements.forEach((elem) => {
    const text = () => getPlainTextWithPsuedoSemantics(elem.querySelector('.read-this-to-me'));
    const ritmOptionalTrackingIdentifier = elem.dataset.ritmOptionalTrackingIdentifier || false;
    const group = createRITMGroup({playPauseGroup, cancelAudio, focusClassName, ritmDisabledClassName, elem, ritmOptionalTrackingIdentifier, text}, {document});

    contentGroups.push(group);
  });

  // build the control bar
  controlBar = createControlBar({cancelAudio, setReadItToMe}, {document});
};

let clearStrayFocus = () => {
  let strayFocus = document.querySelector(`.${focusClassName}`);
  if (strayFocus) {
    strayFocus.classList.remove(focusClassName);
  }
};

let setReadItToMe = (enabled, logEvent) => {
  if (enabled) {
    ritmEnabled = true;
    sessionStorage.removeItem('readItToMeDisabled');
  }
  else {
    ritmEnabled = false;
    clearStrayFocus();
    nextGroup = null;
    synth.cancel();
    sessionStorage.setItem('readItToMeDisabled', '1');
  }

  controlBar.setReadItToMe(ritmEnabled);
  contentGroups.forEach(group => group.setReadItToMe(ritmEnabled));

  // optional track toggle event
  if (logEvent) {
    eventsBin.toggle(enabled);
  }
};

let cancelAudio = toFocus => function() {
  // optional track cancel event
  eventsBin.cancel();
  // move focus to appropriate place, because the cancel button is about to disappear
  if (toFocus.contains(this)) {
    toFocus.focus();
  }
  cancel();
};

let playPauseGroup = (group) => {
  if (currentGroup === group) {
    if (group.state === PLAYING_STATE.STOPPED) {
      // currentGroup === group and the group being stopped should never occur. But, just in case, we'll handle it
      nextGroup = group;
      utteranceEnd();
    } else if (group.state === PLAYING_STATE.PAUSED) {
      resume();
    } else if (group.state === PLAYING_STATE.PLAYING) {
      pause();
    }
  } else {
    nextGroup = group;
    if (currentGroup) {
      cancel();
    } else {
      utteranceEnd();
    }
  }
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
  if (currentGroup) {
    currentGroup.setState(PLAYING_STATE.STOPPED);
    currentGroup = null;
    controlBar.hideControlBar();
    controlBar.hideCancelButton();
  }

  if (nextGroup) {
    currentGroup = nextGroup;
    nextGroup = null;
  }

  if (currentGroup) {
    play();
  }
};

let play = () => {
  // setup the new utterance
  let enhancedText = currentGroup.text();
  synth.play({text: enhancedText}, utteranceEnd);
  controlBar.showCancelButton();
  controlBar.showControlBar();
  currentGroup.setState(PLAYING_STATE.PLAYING);

  // optional track play event
  eventsBin.play();
};

let pause = () => {
  synth.pause();
  currentGroup.setState(PLAYING_STATE.PAUSED);

  // optional track pause event
  eventsBin.pause();
};

let resume = () => {
  synth.resume();
  currentGroup.setState(PLAYING_STATE.PLAYING);
};

let cancel = () => {
  controlBar.hideCancelButton();
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
  return (currentGroup && currentGroup.ritmOptionalTrackingIdentifier) || false;
}

export const eventTracking = setHandlers;