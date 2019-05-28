import '../scss/read-it-to-me.scss';

import * as ritm from './read-it-to-me';
import {init as domInit} from './dom';

export const initRITM = ritm.init;
export const isEnabled = ritm.isEnabled;
export const currentUtteranceIdentifier = ritm.currentUtteranceIdentifier;
export const eventTracking = ritm.eventTracking;

export function init(selectors) {
  return domInit(ritm.init, selectors);
}