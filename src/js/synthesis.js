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

    function utteranceFinished(error) {
      thisUtterance.finished = true;
      result.currentUtterance = null;

      setTimeout(() => callback(error, config), 100);
    }

    u.onend = () => utteranceFinished();

    u.onerror = event => utteranceFinished(event);

    const thisUtterance = result.currentUtterance = {u, config};

    // speak the new utterance
    synth.speak(u);
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
