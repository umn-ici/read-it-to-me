export function createControlBar({cancelAudio, setReadItToMe}, {document, controlBarElement}) {
  // build the control bar
  const controlBar = controlBarElement || document.createElement('div');
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

  const cancelButton = controlBar.querySelector('button');
  const inputSwitch = controlBar.querySelector('input.switch-input');

  const toggleReadItToMe = (e) => {
    setReadItToMe(e.target.checked, true);
  };

  const setReadItToMeStatus = status => inputSwitch.checked = status;

  const controlBarFocusIn = (e) => {
    if (e.target && controlBar.contains(e.target)) {
      if (!controlBar.classList.contains('control-bar-show')) {
        showControlBar();
      }
    }
  };

  const controlBarFocusOut = (e) => {
    if ((e.relatedTarget && !controlBar.contains(e.relatedTarget)) || !e.relatedTarget) {
      hideControlBar();
    }
  };

  const showCancelButton = () => {
    controlBar.classList.add('show-ritm-cancel');
  };

  const hideCancelButton = () => {
    controlBar.classList.remove('show-ritm-cancel');
  };

  const showControlBar = () => {
    controlBar.classList.add('control-bar-show');
  };

  const hideControlBar = () => {
    controlBar.classList.remove('control-bar-show');
  };

  cancelButton.addEventListener('click', cancelAudio(controlBar));
  inputSwitch.addEventListener('change', toggleReadItToMe);
  controlBar.addEventListener('focusin', controlBarFocusIn);
  controlBar.addEventListener('focusout', controlBarFocusOut);

  if (!controlBarElement) {
    // append the control bar to body where it's least likely to be effected by layout styling and the control bubble so we can attach events to it.
    let docBody = document.body;
    docBody.insertBefore(controlBar, docBody.firstChild);
  }

  return {
    showCancelButton,
    hideCancelButton,
    showControlBar,
    hideControlBar,
    setReadItToMe: setReadItToMeStatus
  };
}