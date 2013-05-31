define(['backbone', 'underscore'], function(Backbone, _) {
  'use strict';

  var global = this;

  if (typeof window !== 'undefined') {
    global = window;
  } else if (typeof self !== 'undefined') {
    global = self;
  }

  function Archetype(options) {
    options = _.defaults(options || {}, {
      global: global
    });

    this.boundHandleMessage_ = _.bind(this.handleMessage_, this);
    this.global_ = options.global;
    this.global_.addEventListener('message',
                                  this.boundHandleMessage_, false);

    this.initialize.call(this, options);
  }

  Archetype.extend = Backbone.View.extend;

  Archetype.prototype.initialize = function() {};
  Archetype.prototype.cleanup = function() {};
  Archetype.prototype.run = function() {};

  Archetype.prototype.dispose = function() {
    this.cleanup();
    this.global_.removeEventListener('message',
                                     this.boundHandleMessage_, false);
  };

  Archetype.prototype.send = function(name, value) {
    this.global_.postMessage({
      name: name,
      value: value
    });
  };

  Archetype.prototype.handleMessage_ = function() {};

  return Archetype;
});
