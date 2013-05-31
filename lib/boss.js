define(['underscore', 'backbone', 'boss/thread'],
       function(_, Backbone, Thread) {
  'use strict';

  function Boss(options) {
    options = _.defaults(options || {}, {
      workers: 1,
      config: 'boss-config.js'
    });
    this.instanceQueue_ = [];
    this.nextInstanceIndex_ = 0;
    this.config_ = options.config;

    for (var i = 0; i < options.workers; ++i) {
      this.addWorker();
    }
  }

  _.extend(Boss.prototype, Backbone.Events);

  Boss.prototype.addWorker = function() {
    var thread = new Thread(this.config_);
    this.instanceQueue_.push(thread);
  };

  Boss.prototype.removeWorker = function() {
    var thread = this.instanceQueue_.pop();
    thread.becomesIdle().then(function() {
      thread.dispose();
    });
  };

  Boss.prototype.setWorkers = function(count) {
    while (this.instanceQueue_.length > count) {
      this.removeWorker();
    }

    while (this.instanceQueue_.length < count) {
      this.addWorker();
    }
  };

  Boss.prototype.dispose = function() {
    _.each(this.instanceQueue_, function(thread) {
      thread.dispose();
    }, this);
    this.instanceQueue_ = null;
  };

  Boss.prototype.delegateTask = function(task, args) {
    return this.getNextInstance_().executeTask(task, args);
  };

  Boss.prototype.getNextInstance_ = function() {
    var instance;

    if (!this.instanceQueue_.length) {
      this.addWorker();
      this.nextInstanceIndex_ = 0;
    }

    instance = this.instanceQueue_[this.nextInstanceIndex_];
    this.nextInstanceIndex_ = (this.nextInstanceIndex_ + 1) %
                              this.instanceQueue_.length;

    return instance;
  };

  return Boss;
});
