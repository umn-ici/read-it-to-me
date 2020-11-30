import {playPauseGroup, cancelAudio, setReadItToMe, init as initRITM, isEnabled, eventTracking} from './read-it-to-me';
import {createControlBar} from './control-bar';
import {createRITMGroup} from './group';
import {getPlainTextWithPsuedoSemantics, groupClassName, focusClassName, ritmDisabledClassName} from './utils';

import React from 'react';

export let ControlContext;
export let ContentGroup;

if (typeof React !== 'undefined') {
  const Context = React.createContext(true);
  ControlContext = class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        ritm: false,
        onGroupMounted: this.onGroupMounted.bind(this)
      };
    }

    onGroupMounted() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;

      initRITM(() => {
        this.controlBar = createControlBar({cancelAudio, setReadItToMe}, {document});

        return {
          hideControlBar: this.controlBar.hideControlBar,
          hideCancelButton: this.controlBar.hideCancelButton,
          showCancelButton: this.controlBar.showCancelButton,
          showControlBar: this.controlBar.showControlBar,
          setReadItToMe: this.uiSetReadItToMe.bind(this)
        };
      }, err => {
        if (!err && isEnabled()) {
          this.setState({ritm: isEnabled()});
        }
      });

      eventTracking({
        play: this.onPlay.bind(this),
        pause: this.onPause.bind(this),
        cancel: this.onCancel.bind(this),
        toggle: this.onToggle.bind(this)
      });
    }

    onPlay() {
      if (this.props.onPlay) {
        this.props.onPlay(...arguments);
      }
    }
    onPause() {
      if (this.props.onPause) {
        this.props.onPause(...arguments);
      }
    }

    onCancel() {
      if (this.props.onCancel) {
        this.props.onCancel(...arguments);
      }
    }

    onToggle() {
      if (this.props.onToggle) {
        this.props.onToggle(...arguments);
      }
    }


    uiSetReadItToMe(ritm) {
      if (this.controlBar) {
        this.controlBar.setReadItToMe(ritm);
      }
      this.setState({ritm});
    }

    componentWillUnmount() {
      if (typeof console !== 'undefined') {
        console.error('Having the Read-it-to-Me Control Context unmount may cause unexpected side effects.')
      }
    }

    render() {
      return React.createElement(Context.Provider, {value: this.state}, this.props.children);
    }
  };

  ContentGroup = class extends React.Component {
    constructor(props) {
      super(props);
      this.componentRender = this.componentRender.bind(this);
    }

    componentRender({ritm: ritmState, onGroupMounted}) {
      return React.createElement(ContentGroupComponent, {...this.props, ritmState, onGroupMounted}, this.props.children);
    }

    render() {
      return React.createElement(Context.Consumer, {}, this.componentRender);
    }
  };

  class ContentGroupComponent extends React.Component {
    componentDidMount() {
      const ritmOptionalTrackingIdentifier = this.props.trackingIdentifier; // TODO: Recreate group when this changes?
      const filterOutTheseSelectors = this.props.filterOutTheseSelectors || '';

      const text = () => getPlainTextWithPsuedoSemantics(this.wrapperElement, filterOutTheseSelectors);
      this.ritmGroup = createRITMGroup(
        {playPauseGroup, cancelAudio, focusClassName, ritmDisabledClassName, elem: this.elem, ritmOptionalTrackingIdentifier, text},
        {wrapperElement: this.wrapperElement, controlBubbleElement: this.controlBubbleElement}
      );
      this.ritmGroup.setReadItToMe(this.props.ritmState);

      this.props.onGroupMounted();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.ritmState !== this.props.ritmState) {
        this.ritmGroup.setReadItToMe(this.props.ritmState);
      }
    }

    componentWillUnmount() {
      if (this.ritmGroup) {
        this.ritmGroup.destroy();
        this.ritmGroup = null;
      }
    }

    render() {
      return React.createElement('div', {className: groupClassName, ref: elem => this.elem = elem},
        React.createElement('div', {ref: controlBubbleElement => this.controlBubbleElement = controlBubbleElement}),
        React.createElement('div', {className: 'read-this-to-me', ref: wrapperElement => this.wrapperElement = wrapperElement}, this.props.children)
      );
    }
  }
}