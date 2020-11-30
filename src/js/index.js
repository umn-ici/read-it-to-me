import '../scss/read-it-to-me.scss';

import * as ritm from './read-it-to-me';
import {init as domInit} from './dom';
import * as ritmReact from './react';

export const initRITM = ritm.init;
export const isEnabled = ritm.isEnabled;
export const currentUtteranceIdentifier = ritm.currentUtteranceIdentifier;
export const eventTracking = ritm.eventTracking;

export const ControlContext = ritmReact.ControlContext;
export const ContentGroup = ritmReact.ContentGroup;

export function init(selectors, filterOutTheseSelectors='') {
  return domInit(ritm.init, selectors, filterOutTheseSelectors);
}