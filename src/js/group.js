export const PLAYING_STATE = {
  STOPPED: 0,
  PAUSED: 1,
  PLAYING: 2
};

export function createRITMGroup({playPauseGroup, cancelAudio, focusClassName, ritmDisabledClassName, ritmOptionalTrackingIdentifier, elem, text}, {wrapperElement, controlBubbleElement, document}) {
  // Inner wrap each readable group in a new div.read-this-to-me
  const wrapper = wrapperElement || document.createElement('div');
  wrapper.classList.add('read-this-to-me');

  if (!wrapperElement) {
    elem.appendChild(wrapper);
    while (elem.firstChild !== wrapper) {
      wrapper.appendChild(elem.firstChild);
    }
  }

  // build the control bubble
  const controlBubble = controlBubbleElement || document.createElement('div');
  controlBubble.classList.add('read-it-to-me-control-bubble');
  controlBubble.tabIndex = -1;
  controlBubble.innerHTML = '<p class="read-it-to-me-label"></p><button type="button" class="play-pause-resume"></button><button type="button" class="cancel-audio"><span class="visually-hidden">Cancel audio</a></button>';

  const pausePlayButton = controlBubble.querySelector('button.play-pause-resume');
  const cancelButton = controlBubble.querySelector('button.cancel-audio');

  const focusInListener = e => {
    // don't want this bubbling up from nested groups
    e.stopPropagation();

    elem.classList.add(focusClassName);
  };

  const focusOutListener = e => {
    // don't want this bubbling up from nested groups
    e.stopPropagation();

    elem.classList.remove(focusClassName);
  };

  const playPauseListener = e => {
    e.stopPropagation();
    playPauseGroup(group);
  };

  const cancelListener = cancelAudio(controlBubble);

  const setReadItToMe = enabled => {
    if (enabled) {
      elem.classList.remove(ritmDisabledClassName);
    }
    else {
      elem.classList.add(ritmDisabledClassName);
    }
    pausePlayButton.disabled = !enabled;
    cancelButton.disabled = !enabled;
  };

  const setState = state => {
    group.state = state;

    if (state === PLAYING_STATE.STOPPED) {
      elem.classList.remove('read-it-to-me-play');
      elem.classList.remove('read-it-to-me-pause');
    } else if (state === PLAYING_STATE.PLAYING) {
      elem.classList.add('read-it-to-me-play');
      elem.classList.remove('read-it-to-me-pause');
    } else if (state === PLAYING_STATE.PAUSED) {
      elem.classList.remove('read-it-to-me-play');
      elem.classList.add('read-it-to-me-pause');
    }
  };

  const destroy = () => {
    controlBubble.removeEventListener('focusin', focusInListener);
    controlBubble.removeEventListener('focusout', focusOutListener);
    pausePlayButton.removeEventListener('click', playPauseListener);
    cancelButton.removeEventListener('click', cancelListener);
  };

  controlBubble.addEventListener('focusin', focusInListener);
  controlBubble.addEventListener('focusout', focusOutListener);
  pausePlayButton.addEventListener('click', playPauseListener);
  cancelButton.addEventListener('click', cancelListener);

  if (!controlBubbleElement) {
    elem.insertBefore(controlBubble, wrapper);
  }

  const group = {
    setReadItToMe,
    setState,
    state: PLAYING_STATE.STOPPED,
    destroy,
    text,
    ritmOptionalTrackingIdentifier
  };

  return group;
}