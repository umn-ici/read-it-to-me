export const ritmDisabledClassName = 'ritm-disabled';
export const groupClassName = 'read-it-to-me-content-group';
export const focusClassName = 'focusin';

export const PLAYING_STATE = {
  STOPPED: 0,
  PAUSED: 1,
  PLAYING: 2
};

export let getPlainTextWithPsuedoSemantics = (textAncestor, filterOutTheseSelectors) => {
  let clonedTextAncestor = textAncestor.cloneNode(true);
  const filterOutTheseSelectorsAndUI = filterOutTheseSelectors === '' ? '.read-it-to-me-control-bubble' : filterOutTheseSelectors + ', .read-it-to-me-control-bubble';

  // Remove elements we don't want RITM reading
  clonedTextAncestor.querySelectorAll(filterOutTheseSelectorsAndUI).forEach((elem) => {
    elem.remove();
  });

  // Replace images with alt text with the alt text
  clonedTextAncestor.querySelectorAll('img[alt]').forEach((elem) => {
    const altText = elem.alt;
    if (altText.length > 0) {
      elem.replaceWith(`Image description begin. ${altText} Image description end.`);
    }
  });

  // Pepper in some punctuation for the purpose of adding meaningful pauses and 'emphasis' during text readout.
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