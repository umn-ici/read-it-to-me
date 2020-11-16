export const ritmDisabledClassName = 'ritm-disabled';
export const groupClassName = 'read-it-to-me-content-group';
export const focusClassName = 'focusin';

export const PLAYING_STATE = {
  STOPPED: 0,
  PAUSED: 1,
  PLAYING: 2
};

export let getPlainTextWithPsuedoSemantics = (textAncestor) => {
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