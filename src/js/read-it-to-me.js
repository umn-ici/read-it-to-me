import '../scss/read-it-to-me.scss';

let synth = window.speechSynthesis;
const ritmDisabledClassName = 'ritm-disabled';
const groupClassName = 'read-it-to-me-content-group';
const focusClassName = 'focusin';
let contentQueue = [];
let controlBubble;
let controlBar;
let voices = [];
let u;
let timeoutID;
let ritmEnabled = true;
let eventsBin = {
  play: null,
  pause: null,
  cancel: null,
  toggle: null
};

let setup = () => {
  //populate voices [chrome currently will only do this in the context of the onvoiceschanged event]
  voices = synth.getVoices();
  if (voices.length === 0) {
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = function () {
        voices = synth.getVoices();
      };
    }
  }

  addReadItToMeElements();
  attachEvents();

  // Toggle RITM off if set as disabled in sessionStorage
  if (sessionStorage.getItem('readItToMeDisabled')) {
    controlBar.querySelector('input.switch-input').checked = false;
    toggleReadItToMe();
  }
};

let makeElemTabable = (elem) => {
  if (!elem.hasAttribute('tabindex')) {
    elem.setAttribute('tabindex', '0');
  }
  else {
    if (!elem.classList.contains('ritm-do-not-strip-tabindex')) {
      elem.classList.add('ritm-do-not-strip-tabindex');
    }
  }
};

let addReadItToMeElements = () => {
  let groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
  // Inner wrap each readable group in a new div.read-this-to-me
  let wrapSource = document.createElement('div');
  wrapSource.classList.add('read-this-to-me');
  groupSelectorElements.forEach((elem) => {
    let wrapper = wrapSource.cloneNode(false);
    elem.appendChild(wrapper);
    while (elem.firstChild !== wrapper) {
      wrapper.appendChild(elem.firstChild);
    }
  });

  // build the control bubble
  controlBubble = document.createElement('div');
  controlBubble.classList.add('read-it-to-me-control-bubble');
  controlBubble.innerHTML = '<p class="read-it-to-me-label"></p><button type="button" class="play-pause-resume"></button><button type="button" class="cancel-audio"><span class="visually-hidden">Cancel audio</a></button>';

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
  docBody.appendChild(controlBubble);
};

/* Why a try...catch?  To deal with the interesting behavior that comes out of using appendChild in a blur or focusout listener.
   Ex: focusout listener runs appendChild which fires a blur event, your focusout listener runs again, attempting
   to run appendChild again.  At the second run of appendChild your element will still have it's parentNode defined,
   but your element isn't among it's children anymore! And an exception is thrown:
   Uncaught DOMException: Failed to execute 'appendChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?
*/
let attachControlBubbleToGroup = (elem) => {
  if (controlBubble.parentNode !== elem) {
    try {
      elem.insertBefore(controlBubble, elem.firstChild);
    }
    catch (e) {}
  }
};

let moveControlBubbleToBody = () => {
  try {
    document.body.appendChild(controlBubble);
  }
  catch (e) {}
};

let clearStrayFocus = () => {
  let strayFocus = document.querySelector(`.${focusClassName}`);
  if (strayFocus) {
    strayFocus.classList.remove(focusClassName);
  }
};

let groupSelectorEnter = (e) => {
  if (!ritmEnabled) {return false;}

  // clean up stray focusin class if there is one
  clearStrayFocus();

  let targ = e.target;
  if (targ && targ.matches(`.${groupClassName}`) && !targ.querySelector('.read-it-to-me-control-bubble')) {
    attachControlBubbleToGroup(targ);
  }
};

let groupSelectorLeave = (e) => {
  if (!ritmEnabled) {return false;}

  let group = e.relatedTarget ? e.relatedTarget.closest(`.${groupClassName}`) : null;

  if (group) {
    attachControlBubbleToGroup(group);
  }
  else {
    moveControlBubbleToBody();
  }
};

let groupFocusInListener = (e) => {
  if (!ritmEnabled) {return false;}

  // don't want this bubbling up from nested groups
  e.stopPropagation();

  let targ = e.target;
  let relTarg = e.relatedTarget;
  let relTargIsInTarg;

  if (targ) {
    // see if target is a RITM group wrapper (which is what we need)
    if (targ.matches(`.${groupClassName}`)) {
      // set our flag here to true if relatedTarget is our control bubble button.
      relTargIsInTarg = relTarg && targ.firstChild.querySelector('button') === relTarg ? true : false;

      // give it a class to apply some focus visuals (if it doesn't already have one)
      if (!targ.classList.contains(focusClassName)) {
        targ.classList.add(focusClassName);
      }
      // and then slap the control bubble in there if it isn't there already
      if (!targ.querySelector('.read-it-to-me-control-bubble')) {
        attachControlBubbleToGroup(targ);
      }

      /* if relTargIsInTarg is true than it means the user is in reverse (shift-tabbing) and so
       we DO NOT want to move focus (back to) the control bubble button (infinite behavior loop traps are bad mkay). */
      if (!relTargIsInTarg) {
        // save y scroll and then restore it after focus so users don't experience a disorienting page jump
        let preFocusPositionY = window.scrollY;
        targ.firstChild.querySelector('button').focus();
        window.scroll(0, preFocusPositionY);
      }
    }
  }
};

let groupFocusOutListener = (e) => {
  if (!ritmEnabled) {return false;}

  // don't want this bubbling up from nested groups
  e.stopPropagation();

  let targ = e.target;
  let relTarg = e.relatedTarget;
  let parentGroup;

  if (targ && relTarg) {

    // Bail if focus is moving from wrapper to control bubble, or vice versa
    if (targ.matches(`.${groupClassName}`) && relTarg.matches('.read-it-to-me-control-bubble button') && targ.contains(relTarg)) {
      return false;
    }
    // Bail if focus is moving from control bubble to it's parent group
    if (targ.matches('.read-it-to-me-control-bubble button') && relTarg.matches(`.${groupClassName}`) && relTarg.contains(targ)) {
      return false;
    }
    // Bail if focus is moving from one control bubble button to another
    if (targ.matches('.read-it-to-me-control-bubble button') && relTarg.matches('.read-it-to-me-control-bubble button')) {
      return false;
    }

    // get the group wrapper
    if (targ.matches(`.${groupClassName}`)) {
      parentGroup = targ;
    }
    else {
      parentGroup = targ.closest(`.${groupClassName}`);
    }

    // remove focus class from group wrapper and move the control bubble out of sight
    parentGroup.classList.remove(focusClassName);

    moveControlBubbleToBody();
  }
};

let toggleReadItToMe = (e) => {
  let toggleSwitch = e ? e.target : controlBar.querySelector('input.switch-input');
  let groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
  if (toggleSwitch.checked) {
    ritmEnabled = true;
    sessionStorage.removeItem('readItToMeDisabled');
    groupSelectorElements.forEach((elem) => {
      elem.classList.remove(ritmDisabledClassName);
      makeElemTabable(elem);
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

let cancelAudio = () => {
  // optional track cancel event
  if (eventsBin.cancel) {
    try {
      eventsBin.cancel();
    }
    catch (e) {}
  }
  // move focus to appropriate place, because the cancel button is about to disappear
  if (controlBar.contains(this)) {
    controlBar.focus();
  }
  if (controlBubble.contains(this)) {
    controlBubble.focus();
  }
  cancel();
};

let attachEvents = () => {
  controlBubble.querySelector('button.play-pause-resume').addEventListener('click', (e) => {
    if (!ritmEnabled) {return false;}

    e.stopPropagation();
    let currentContentGroup = e.target.closest(`.${groupClassName}`);
    contentGroupManager(currentContentGroup);
  });
  controlBubble.querySelector('button.cancel-audio').addEventListener('click', cancelAudio);

  controlBar.querySelector('button').addEventListener('click', cancelAudio);
  controlBar.querySelector('input.switch-input').addEventListener('change', toggleReadItToMe);
  controlBar.addEventListener('focusin', controlBarFocusIn);
  controlBar.addEventListener('focusout', controlBarFocusOut);

  let groups = document.querySelectorAll(`.${groupClassName}`);
  groups.forEach((elem) => {
    elem.addEventListener('mouseenter', groupSelectorEnter);
    elem.addEventListener('click', groupSelectorEnter);
    elem.addEventListener('mouseleave', groupSelectorLeave);
    elem.addEventListener('focusin', groupFocusInListener);
    elem.addEventListener('focusout', groupFocusOutListener);
  });

  // without this initial cancel, Chrome will pretty consistently fail to play the very first utterance (then works on every other utterance)
  synth.cancel();
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
  //reset timeoutID
  timeoutID = null;
};

let play = () => {
  // setup the new utterance
  let enhancedText = getPlainTextWithPsuedoSemantics(contentQueue[0].querySelector('.read-this-to-me'));
  u = new SpeechSynthesisUtterance(enhancedText);
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
  u.onend = utteranceEnd;
  u.onerror = () => {
    if (!timeoutID) {
      timeoutID = window.setTimeout(utteranceEnd, 100);
    }
  };

  // speak the new utterance
  synth.speak(u);
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
  if (synth) {
    // if custom selectors were passed in, give the associated elements the default group class
    if (selectors && document.querySelectorAll(selectors).length > 0) {
      document.querySelectorAll(selectors).forEach((elem) => {
        elem.classList.add(groupClassName);
      });
    }
    // make all groups tabable
    document.querySelectorAll(`.${groupClassName}`).forEach((elem) => {
      makeElemTabable(elem);
    });
    // preceed with setup if there is at least one group
    if (document.querySelectorAll(`.${groupClassName}`)) {
      setup();
    }
  }
  else {
    // strip out classes that would apply ReadItToMe visuals
    document.querySelectorAll(`.${groupClassName}`).forEach((elem) => {
      elem.classList.remove(groupClassName, focusClassName);
    });
  }
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