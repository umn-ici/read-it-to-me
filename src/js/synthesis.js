import {PLAYING_STATE} from './utils';

export function initSynthesis(synth, callback) {
  let voices = [], failedToLoadVoices = false;

  if (!synth && typeof speechSynthesis !== 'undefined') {
    synth = speechSynthesis;
  }

  if (!synth) {
    callback(new Error('Speech Synthesis is unavailable.'));
    return;
  }

  let play = (config, callback = () => {}) => {
    const u = new SpeechSynthesisUtterance(config.text);
    u.lang = 'en-US';
    u.rate = .8;
    //if voices is populated and the 'Samantha' voice is present on the browser/device, load her up, otherwise don't set a voice so the default is allowed to do it's thing.
    if (voices.length > 0) {
      for (let i = 0; i < voices.length; i++) {
        if (voices[i].lang.indexOf('en') === 0) {
          if (voices[i].name === 'Samantha') {
            u.voice = voices[i];
            break;
          }
        }
      }
    }

    result.nextUttarance = {u, config, callback};

    if (!result.currentUtterance) {
      playNextUtterance();
    } else {
      synth.cancel();
    }
  };

  let playNextUtterance = () => {
    const thisUtterance = result.currentUtterance = result.nextUttarance;
    result.nextUttarance = null;

    function utteranceFinished(error) {
      thisUtterance.callback(error, PLAYING_STATE.STOPPED, thisUtterance.config);
      if (result.nextUttarance) {
        playNextUtterance();
      } else {
        result.currentUtterance = null;
      }
    }

    thisUtterance.u.onend = () => setTimeout(utteranceFinished, 100);

    thisUtterance.u.onerror = event => setTimeout(utteranceFinished.bind(null, event.error || new Error('Unknown speech synthesis error')), 100);

    thisUtterance.u.onstart = () => thisUtterance.callback(null, PLAYING_STATE.PLAYING, thisUtterance.config);

    thisUtterance.u.onpause = () => thisUtterance.callback(null, PLAYING_STATE.PAUSED, thisUtterance.config);

    thisUtterance.u.onresume = () => thisUtterance.callback(null, PLAYING_STATE.PLAYING, thisUtterance.config);

    // speak the new utterance
    synth.speak(thisUtterance.u);
  };

  let pause = () => {
    synth.pause();
  };

  let resume = () => {
    synth.resume();
  };

  let cancel = () => {
    synth.cancel();
  };

  const result = {play, pause, resume, cancel};

  //populate voices [chrome currently will only do this in the context of the onvoiceschanged event]
  voices = synth.getVoices();
  if (voices.length === 0) {
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = function () {
        voices = synth.getVoices();
        callback(null, result);
      };
    } else {
      failedToLoadVoices = true;
    }
  }

  // without this initial cancel, Chrome will pretty consistently fail to play the very first utterance (then works on every other utterance)
  synth.cancel();

  if (!voices.length && failedToLoadVoices) {
    callback(new Error('Unable to load voice list'));
  } else if (voices.length) {
    callback(null, result);
  }
}
