var get = Em.get, set = Em.set;

/**
@module ember
@submodule ember-touch
*/

/**
Base class to be extended to define specific gesture recognizer. Handles low-level touch, 
state management and provides some utility methods to the extended classes. 


  @class Gesture
  @namespace Ember
  @extends Ember.Object
*/
Em.Gesture = Em.Object.extend({

  /**
    The current state of the gesture recognizer. This value can be any one
    of these states:

      WAITING_FOR_TOUCHES
      POSSIBLE
      BEGAN
      CHANGED
      ENDED
      CANCELLED 

    @property state
    @type Number
  */
  state: null,

  /**
    A string of the gesture recognizer's name. This value is set automatically
    but Em.Gestures when a gesture is registered.

    @property name
    @type String
  */
  name: null,

  /** 
    View in which the gesture must be recognized.
    Assigned on startup.
  */
  view: null,

  /** 
    Assigned on startup.
  */
  applicationGestureManager: null,
  
  /** 
    Specifies whether a gesture is discrete or continuous.

    @property gestureIsDiscrete
    @type Boolean
    @default false
  */
  gestureIsDiscrete: false,


  /**
    This property enables to recognize gestures simultaneously. Whenever a gesture
    is being recognized and its `simultaneously` property is false, it denies other 
    gestures to be recognized at the same time.

    @property simultaneously
    @type Boolean
    @default true
  */
  simultaneously: true,

	/**
    Used this property to assign `GestureDelegate` instance to the `delegate` property
    in `init` process.

    @property delegateName
    @type String
  */
  delegateName: null,
 
  /**	
    Apply a `GestureDelegate` to customize an application's gesture-recognition behavior. 

    @property delegate
    @type Em.GestureDelegate
  */
  delegate: null, 

  /**
    Use this property to disable the gesture recognition.
    Use isEnabledBinding to bind to global or view properties.

    @property isEnabled
    @type Boolean
    @default true
  */
  isEnabled: true,


  /** 
    You can use the `touches` protected property to access the touches hash. The touches 
    hash is keyed on the identifiers of the touches, and the values are the jQuery.Event 
    objects.

    @private 
    @property touches
    @type Hash
  */
  touches: null,

  /** 
    You can also use the numberOfActiveTouches property to inspect how many touches
    are active, this is mostly useful in `shouldBegin` since every other callback can
    assume that there are as many active touches as specified in the 
    `numberOfRequiredTouches` property.

    @private 
    @property numberOfActiveTouches
    @type Number
  */
  numberOfActiveTouches: 0,

  /** 
    Used to specify the number of touches required for the gesture to enter a possible 
    state

    @private 
    @property numberOfRequiredTouches
    @type Number
  */
  numberOfRequiredTouches: 1,

  init: function() {

    this._super();
    this.touches = Em.TouchList.create();
    this.name = get(this, 'name');

    var delegateName =  this.get('delegateName');
    var delegate =  this.get('delegate');

    if (!delegate && delegateName ) {

      var delegates = get(get(this, 'applicationGestureManager'), 'delegates');

      delegate = delegates.find(delegateName);
      Em.assert('empty delegate, attempting to set up delegate based on delegateName', delegate);
      set(this, 'delegate', delegate);

    }

  },

  //..............................................
  // Gesture Protected Methods

  /** 
    Called when a gesture enters a possible state. This means the gesture 
    recognizer has accepted enough touches to match the number of required touches. 
    You would usually initialize your state in this callback.
    @protected 
    @method didBecomePossible
  */
  didBecomePossible: function() { },

  /** 
    Called if a view returns false from a gesture event. 
    This callback allows you to reset internal state if the user 
    rejects an event.
    @protected 
    @method didBegin
  */
  eventWasRejected: function() { },

  /** 
    Called if a view returns false from a gesture event. This callback allows 
    you to reset internal state if the user rejects an event.
    @protected 
    @method shouldBegin
  */
  shouldBegin: function() {
    return true;
  },

  /** 
    Called when the gesture enters a began state. 
    Called before the view receives the Start event.
    @protected 
    @method didBegin
  */
  didBegin: function() { },

  /** 
    Called when the gesture enters a began state, and when one of the touches moves.
    Called before the view receives the Change event.
    @protected 
    @method didChange
  */
  didChange: function(evt) { },

  /** 
    Allows a gesture to block itself from entering an ended state. 
    This callback gets called whenever a tracked touch gets a touchEnd event.
    @protected 
    @method shouldEnd
  */
  shouldEnd: function() {
    return true;
  },

  /** 
    Called when the gesture enters an ended state. 
    Called before the view receives the End event.
    @protected 
    @method didEnd
  */
  didEnd: function() { },

  /** 
    Called when the gesture enters a cancelled state. 
    Called before the view receives the Cancel event.
    @protected 
    @method didCancel
  */
  didCancel: function() { },

  //..............................................
  // Utilities

  /** @private */


  /**
   If `simultaneously` is true, it blocks the `ApplicationGestureManager` instance.
    @private 
    @method blockApplicationGestureManagerIfSimultaneously
   */
  blockApplicationGestureManagerIfSimultaneously: function() {

    if ( !this.simultaneously ) {

      var allowedView = this.view;

      this.applicationGestureManager.block(this.view, function(v) {
        return allowedView === v;
      }); 

    }

  },
  
  /**
    Notify the event to the view and trigger eventWasRejected if the view doesn't implement the API 
    or return false.
    @private 
    @method attemptGestureEventDelivery
  */
  attemptGestureEventDelivery: function(eventName, evt) {

    Em.assert('attemptGestureEventDelivery is called with eventName and event arguments', !!eventName && !!evt);

    var wasNotified =  this._notifyViewOfGestureEvent(eventName, evt);
    if ( !wasNotified ) {
      this.eventWasRejected();
    }             

  },

  /**
    Given two Touch objects, this method returns the distance between them.
    @private 
    @method distance
    @return Number
  */
  distance: function(touches) {

    if (touches.length < 2) {
      return 0;
    }

    var first = touches[0];
    var second = touches[1];

    var x = first.pageX;
    var y = first.pageY;
    var x0 = second.pageX;
    var y0 = second.pageY;

    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
  },

  /**
    Given two Touch objects, this method returns the midpoint between them.

    @private 
    @method centerPointForTouches
    @return Number
  */
  centerPointForTouches: function(touches) {
    var sumX = 0,
        sumY = 0;

    for (var i=0, l=touches.length; i<l; i++) {
      var touch = touches[i];
      sumX += touch.pageX;
      sumY += touch.pageY;
    }

    var location = {
      x: sumX / touches.length,
      y: sumY / touches.length
    };

    return location;
  },

  /**
    Allows the gesture to notify the view it's associated with of a gesture
    event.

    @private 
    @method _notifyViewOfGestureEvent
  */
  _notifyViewOfGestureEvent: function(eventName, evt) {
    var handler = this.view[eventName];
    var result = false;

    if (Em.typeOf(handler) === 'function') {
      result = handler.call(this.view, this, evt);
    }

    return result;
  },

  /**
    @method toString
  */
  toString: function() {
    return Em.Gesture+'<'+Em.guidFor(this)+'>';
  },

  /** 
    Reset the touches list.
    @private 
    @method _resetState
  */
  _resetState: function() {
    this.touches.removeAllTouches();
  },

  //..............................................
  // Touch event handlers
  
  /** 
    Given a `touchstart` event, updates the list of touches,  
    if the `numberOfRequiredTouches` hasn't yet reached, set WAITING_FOR_TOUCHES state,
    otherwise when the gesture is discrete move to BEGAN state and apply its logic or in the
    other hand, continous gestures are setup the POSSIBLE state and executes its `didBecomePossible` 
    method.
    @method touchStart
  */
  touchStart: function(evt) {
    var targetTouches = evt.originalEvent.targetTouches;
    var _touches = this.touches;
    var state = get(this, 'state');

    set(_touches, 'timestamp', Date.now());

    //Collect touches by their identifiers
    for (var i=0, l=targetTouches.length; i<l; i++) {
      var touch = targetTouches[i];

      if(_touches.touchWithId(touch.identifier) === null  ) {

        if ( _touches.get('length') === get(this, 'numberOfRequiredTouches')  ) {
          // restart touches, otherwise a gesture could state on possible state forever 
          _touches.removeAllTouches();
        }
        _touches.addTouch(touch);
      }
    }

    if (_touches.get('length') < get(this, 'numberOfRequiredTouches')) {
      set(this ,'state', Em.Gesture.WAITING_FOR_TOUCHES);

    } else {
      if ( this.gestureIsDiscrete ) {

      // Discrete gestures may skip the possible step if they're ready to begin
        //
        if ( this.shouldBegin() ) {
          this.blockApplicationGestureManagerIfSimultaneously();
          set(this, 'state', Em.Gesture.BEGAN);
          this.didBegin();
        }

      } else {
        set(this, 'state', Em.Gesture.POSSIBLE);
        this.didBecomePossible();
      }
    }

  },

  /** 
    Given a `touchmove` event, updates the list of touches.
    It changes the currentState to BEGAN and fire [gesture]Start view method if the gesture is discrete, 
    the state is POSSIBLE and its `shouldBegin` implementation response true. 
    If the current state is BEGAN or CHANGED and the gesture is continuous, apply CHANGED state
    and fire the [gesture]Change view method.
    @method touchMove
  */
  touchMove: function(evt) {
    var state = get(this, 'state');

    if (state === Em.Gesture.WAITING_FOR_TOUCHES || state === Em.Gesture.ENDED || state === Em.Gesture.CANCELLED) {

      // Nothing to do here
      return;
    }

    var changedTouches = evt.originalEvent.changedTouches;
    var _touches = this.touches;

    set(_touches, 'timestamp', Date.now());

    // Update touches hash
    for (var i=0, l=changedTouches.length; i<l; i++) {
      var touch = changedTouches[i];
      _touches.updateTouch(touch);
    }

    if (state === Em.Gesture.POSSIBLE && !this.gestureIsDiscrete) {

      if ( this.shouldBegin() ) {

        this.blockApplicationGestureManagerIfSimultaneously();
        set(this, 'state', Em.Gesture.BEGAN);
        this.didBegin();

        // Give the gesture a chance to update its state so the view can get 
        // updated information in the Start event 
        this.didChange(evt);
        this.attemptGestureEventDelivery(this.name+'Start', evt);
      }

    } else if (state === Em.Gesture.BEGAN || state === Em.Gesture.CHANGED)  {

      set(this, 'state', Em.Gesture.CHANGED);
      this.didChange(evt);

      // Discrete gestures don't fire changed events
      if ( !this.gestureIsDiscrete ) {

        this.attemptGestureEventDelivery(this.name+'Change', evt);

      }

    }


  },

  /** 
    Given a `touchend` event, updates the list of touches, manages the event and finally
    reset the `touch` list.
    If current state is either BEGAN or CHANGED and `shouldEnd` response is true, 
    it changes the state to ENDED, performs `didEnd` method and fire [gesture]End view method.
    @method touchEnd
  */
  touchEnd: function(evt) {
    var state = get(this, 'state');
    var _touches = this.touches;
    set(_touches, 'timestamp', Date.now());


    var changedTouches = (evt && evt.originalEvent ) ? evt.originalEvent.changedTouches : undefined;
    if ( changedTouches ) {
      // Update touches hash
      for (var i=0, l=changedTouches.length; i<l; i++) {
        var touch = changedTouches[i];
        _touches.updateTouch(touch);
      }
    }

    if ( ( state === Em.Gesture.BEGAN || state === Em.Gesture.CHANGED ) && this.shouldEnd() ) {

      // Discrete gestures use shouldEnd to either accept or decline the gesture.
      set(this, 'state', Em.Gesture.ENDED);
      this.didEnd();
      this.attemptGestureEventDelivery(this.name+'End', evt);

    }
    this._resetState();
  },

  /** 
    Given a `touchcancel` event, reset the `touch` list, and when the 
    current state is different than CANCEL, set the state to CANCEL, performs
    `didCancel` method and if the gesture is continuous fires the [gesture]Cancel
    view method.
    @method touchCancel
  */
  touchCancel: function(evt) {
    var state = get(this, 'state');

    if ( state !== Em.Gesture.CANCELLED) {

      set(this, 'state', Em.Gesture.CANCELLED);
      this.didCancel();

      if ( !this.gestureIsDiscrete ) {
        this.attemptGestureEventDelivery(this.name+'Cancel', evt);
      }

    } 

    this._resetState();

  }

});

Em.GestureDirection = {
  Vertical: 1,
  Horizontal: 2
};


Em.OneGestureDirection = {
  Right: 1,
  Left: 2, 
  Down: 4,
  Up: 8
};

Em.Gesture.WAITING_FOR_TOUCHES = 0;
Em.Gesture.POSSIBLE = 1; // only continuous
Em.Gesture.BEGAN = 2;
Em.Gesture.CHANGED = 3; 
Em.Gesture.ENDED = 4;
Em.Gesture.CANCELLED = 5;
