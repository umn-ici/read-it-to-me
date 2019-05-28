import {initSynthesis} from './synthesis';
import {initEventTracking} from './events';
import {PLAYING_STATE, focusClassName} from './utils';

let synth;
let ui;
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
  synth.cancel();
};

let playPauseGroup = (group) => {
  if (synth.currentUtterance && synth.currentUtterance.config.group === group && group.state !== PLAYING_STATE.STOPPED) {
    if (group.state === PLAYING_STATE.PAUSED) {
      synth.resume();
    } else if (group.state === PLAYING_STATE.PLAYING) {
      synth.pause();
    }
  } else {
    // setup the new utterance
    const config = {text: group.text(), group, playTracked: false};

    synth.play(config, utteranceUpdated);
  }
};

let utteranceUpdated = (e, state, config) => {
  config.group.setState(state);

  if (state === PLAYING_STATE.STOPPED) {
    ui.hideControlBar();
    ui.hideCancelButton();
  } else {
    ui.showControlBar();
    ui.showCancelButton();
  }

  if (state === PLAYING_STATE.PLAYING) {
    if (!config.playTracked) {
      eventsBin.play();
      config.playTracked = true;
    }
  } else if (state === PLAYING_STATE.PAUSED) {
    eventsBin.pause();
  }
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