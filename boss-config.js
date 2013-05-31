importScripts('/javascripts/support/require.js');

requirejs.config({
  baseUrl: '/javascripts',
  paths: {
    'q': 'support/q',
    'underscore': 'support/underscore',
    'backbone': 'support/backbone'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: ['underscore'],
      exports: 'Backbone'
    }
  }
});

function log() {
  postMessage({
    name: 'log',
    value: Array.prototype.slice.call(arguments)
  });
}

require(['boss/drone'], function(Drone) {
  'use strict';
  self.drone = new Drone();
});
