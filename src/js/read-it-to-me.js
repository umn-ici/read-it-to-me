import {initSynthesis} from './synthesis';
import {PLAYING_STATE} from './group';
import {initEventTracking} from './events';
import {focusClassName} from './utils';

let synth;
let ui;
let nextGroup;
let ritmEnabled = true;
const {eventsBin, setHandlers} = initEventTracking();

let setup = (uiConfig) => {
  ui = uiConfig;

  // Toggle RITM off if set as disabled in sessionStorage
  if (sessionStorage.getItem('readItToMeDisabled')) {
    setReadItToMe(false);
  }
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

  ui.setReadItToMe(ritmEnabled);

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
  if (synth.currentUtterance && synth.currentUtterance.config.group === group && group.state !== PLAYING_STATE.STOPPED) {
    if (group.state === PLAYING_STATE.PAUSED) {
      resume();
    } else if (group.state === PLAYING_STATE.PLAYING) {
      pause();
    }
  } else {
    nextGroup = group;
    if (synth.currentUtterance) {
      cancel();
    } else {
      play();
    }
  }
};

let utteranceEnd = (e, config) => {
  config.group.setState(PLAYING_STATE.STOPPED);

  if (nextGroup) {
    play();
  } else {
    ui.hideControlBar();
    ui.hideCancelButton();
  }
};

let play = () => {
  // setup the new utterance
  const config = {text: nextGroup.text(), group: nextGroup};
  nextGroup.setState(PLAYING_STATE.PLAYING);
  nextGroup = null;

  synth.play(config, utteranceEnd);
  ui.showCancelButton();
  ui.showControlBar();

  // optional track play event
  eventsBin.play();
};

let pause = () => {
  if (synth.currentUtterance) {
    synth.pause();
    synth.currentUtterance.config.group.setState(PLAYING_STATE.PAUSED);

    // optional track pause event
    eventsBin.pause();
  }
};

let resume = () => {
  if (synth.currentUtterance) {
    synth.resume();
    synth.currentUtterance.config.group.setState(PLAYING_STATE.PLAYING);
  }
};

let cancel = () => {
  ui.hideCancelButton();
  synth.cancel();
};

export function init(setupUI, callback) {
  initSynthesis(undefined, (error, synthesis) => {
    if (!error && synthesis) {
      synth = synthesis;

      const config = setupUI({playPauseGroup, cancelAudio, setReadItToMe});

      if (!(config && config.hideControlBar && config.hideCancelButton && config.showCancelButton && config.showControlBar && config.setReadItToMe)) {
        error = new Error('UI library did not provide necessary callbacks.');
      } else {
        setup(config);
      }
    }

    callback(error);
  });
}

export function isEnabled () {
  return ritmEnabled;
}

export function currentUtteranceIdentifier() {
  return (synth.currentUtterance && synth.currentUtterance.config.group.ritmOptionalTrackingIdentifier) || false;
}

export const eventTracking = setHandlers;