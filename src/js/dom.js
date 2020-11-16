import {playPauseGroup, cancelAudio, setReadItToMe} from './read-it-to-me';
import {createControlBar} from './control-bar';
import {createRITMGroup} from './group';
import {getPlainTextWithPsuedoSemantics, groupClassName, focusClassName, ritmDisabledClassName} from './utils';

export function init(initRITM, selectors) {
  // If there's nothing to read, don't initialize
  if (!((selectors && document.querySelectorAll(selectors).length > 0) || document.querySelectorAll(`.${groupClassName}`).length > 0)) {
    return;
  }

  function setupUI() {
    // if custom selectors were passed in, give the associated elements the default group class
    if (selectors && document.querySelectorAll(selectors).length > 0) {
      document.querySelectorAll(selectors).forEach((elem) => {
        elem.classList.add(groupClassName);
      });
    }

    let controlBar;
    let contentGroups = [];

    const groupSelectorElements = document.querySelectorAll(`.${groupClassName}`);
    groupSelectorElements.forEach((elem) => {
      const text = () => getPlainTextWithPsuedoSemantics(elem.querySelector('.read-this-to-me'));
      const ritmOptionalTrackingIdentifier = elem.dataset.ritmOptionalTrackingIdentifier || false;
      const group = createRITMGroup({playPauseGroup, cancelAudio, focusClassName, ritmDisabledClassName, elem, ritmOptionalTrackingIdentifier, text}, {document});

      contentGroups.push(group);
    });

    // build the control bar
    controlBar = createControlBar({cancelAudio, setReadItToMe}, {document});

    function uiSetReadItToMe(enabled) {
      controlBar.setReadItToMe(enabled);
      contentGroups.forEach(group => group.setReadItToMe(enabled));
    }

    return {
      hideControlBar: controlBar.hideControlBar,
      hideCancelButton: controlBar.hideCancelButton,
      showCancelButton: controlBar.showCancelButton,
      showControlBar: controlBar.showControlBar,
      setReadItToMe: uiSetReadItToMe
    }
  }

  initRITM(setupUI, error => {
    if (error) {
      // strip out classes that would apply ReadItToMe visuals
      document.querySelectorAll(`.${groupClassName}`).forEach((elem) => {
        elem.classList.remove(groupClassName, focusClassName);
      });
    }
  });
}