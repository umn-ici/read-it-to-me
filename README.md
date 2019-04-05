# Read-it-to-Me
A text read-aloud tool utilizing the SpeechSynthesis interface of the Web Speech API incorporated into modern browsers.

Not meant as a replacement for screen-reader assistive technology (JAWS, NVDA, etc), but rather as a fairly simple read-aloud tool, easily added to most web pages, to increase access to information.

*Inspired by the principle of Universal Design and a few young people I know facing some Dyslexia reading challenges.*

Brought to you by developers from the [Institute on Community Integration (ICI)](https://ici.umn.edu/) at the University of Minnesota.

## Using Read-it-to-Me on your site
[Read-it-to-Me demo](https://umn-ici.github.io/read-it-to-me/dist/example/)

### Add Read-it-to-Me files to your page

```html
<link rel="stylesheet" href="css/read-it-to-me.min.css">
<script src="js/read-it-to-me.min.js"></script>
```

### Initialize the script

#### By adding a class to your elements
Add class `read-it-to-me-content-group` to the html elements you want the script to run on.
```javascript
ReadItToMe.init();
```

#### By passing in selectors for your elements
Pass in a comma separated string of selectors for the elements you want the script to run on.
```javascript
ReadItToMe.init('selector1, selector2, selectorN');
```

*If you need to (or find it useful) you can add the class to some elements and pass in selectors for the rest in order to cover all the elements you have in mind*

### You can nest Read-it-to-Me groups
See this in action at the bottom of the main example file.

### Optional tracking hooks
If you've got a web analytics system which supports events and you'd like to record Read-it-to-Me events you can tie into event hooks we've provided for: play, pause, cancel, toggle.

For example if you're using Google Analytics:

```javascript
ReadItToMe.eventTracking({
  play: function(){
    var utteranceId = ReadItToMe.currentUtteranceIdentifier();
    var thisUtterance = utteranceId ? utteranceId : '';
    gtag('event', `Play Utterance [${thisUtterance}]`, {
      'event_label': 'User Interaction',
      'event_category': 'Read-it-to-Me'
    });
  },
  pause: function(){
    var utteranceId = ReadItToMe.currentUtteranceIdentifier();
    var thisUtterance = utteranceId ? utteranceId : '';
    gtag('event', `Pause Utterance [${thisUtterance}]`, {
      'event_label': 'User Interaction',
      'event_category': 'Read-it-to-Me'
    });
  },
  cancel: function(){
    var utteranceId = ReadItToMe.currentUtteranceIdentifier();
    var thisUtterance = utteranceId ? utteranceId : '';
    gtag('event', `Cancel Utterance [${thisUtterance}]`, {
      'event_label': 'User Interaction',
      'event_category': 'Read-it-to-Me'
    });
  },
  toggle: function(){
    var toggleAction = ReadItToMe.isEnabled() ? "[ On ]" : "[ Off ]";
    gtag('event', `Toggled ${toggleAction}`, {
      'event_label': 'User Interaction',
      'event_category': 'Read-it-to-Me'
    });
  }
});

ReadItToMe.init();
```

#### Optional better descriptions for each of your groups
There is an optional attribute you can add in your HTML to better describe each `read-it-to-me-content-group`: `data-ritm-optional-tracking-identifier`.  For instance in the Read-it-to-Me example files we use it a few times including like so:

```html
<article data-ritm-optional-tracking-identifier="Semantics demo - Blade Runner Tears in Rain.">
...
</article>
```

You can then access this descriptor in your event tracking functions via `ReadItToMe.currentUtteranceIdentifier()`. See this optional descriptor in use in the event tracking example above via lines like this:

```javascript
var utteranceId = ReadItToMe.currentUtteranceIdentifier();
```
