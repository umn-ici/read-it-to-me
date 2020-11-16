function nullEvent() {}

function eventHandlerWrapper(handler) {
  return event => {
    try {
      handler(event);
    } catch (e) {}
  };
}

export function initEventTracking() {
  const eventsBin = {
    play: nullEvent,
    pause: nullEvent,
    cancel: nullEvent,
    toggle: nullEvent
  };

  function setHandlers(obj) {
    if (obj) {
      if (obj.play && typeof obj.play === 'function') {
        eventsBin.play = eventHandlerWrapper(obj.play);
      }
      if (obj.pause && typeof obj.pause === 'function') {
        eventsBin.pause = eventHandlerWrapper(obj.pause);
      }
      if (obj.cancel && typeof obj.cancel === 'function') {
        eventsBin.cancel = eventHandlerWrapper(obj.cancel);
      }
      if (obj.toggle && typeof obj.toggle === 'function') {
        eventsBin.toggle = eventHandlerWrapper(obj.toggle);
      }
    }
  }

  return {eventsBin, setHandlers};
}