define(['underscore', 'backbone', 'q'], function(_, Backbone, Q) {
  'use strict';
  function Thread(module) {
    this.id = _.uniqueId();
    this.module_ = module;
    this.instanceReadies_ = this.createInstance_();
    this.taskResultMap_ = {};
    this.workQueue_ = Q.resolve();
  }

  _.extend(Thread.prototype, Backbone.Events);

  Thread.prototype.supportsWebWorkers_ = function() {
    return !(typeof Worker === 'undefined' &&
             typeof WebKitWorker === 'undefined' &&
             typeof MozWorker === 'undefined');
  };

  Thread.prototype.dispose = function() {
    if (this.instanceReadies_) {
      this.instanceReadies_.then(function(instance) {
        instance.terminate();
      });
      this.instanceReadies_ = null;
    }
    this.taskResultMap_ = null;
  };

  Thread.prototype.createInstance_ = function() {
    var result = Q.defer();
    var worker = this;
    var instance;

    if (typeof window.Worker !== 'undefined') {
      instance = new window.Worker(this.module_);
    } else if (typeof window.WebKitWorker !== 'undefined') {
      instance = new window.WebKitWorker(this.module_);
    } else if (typeof window.MozWorker !== 'undefined') {
      instance =  new window.MozWorker(this.module_);
    } else {
      // No worker implementation available..
      instance = {};
    }

    instance.addEventListener('message', function(e) {
      var data = e.data;
      var name = data.name;
      var value = data.value;
      if (name === 'log') {
        console.log.apply(console, value);
      }
    }, true);

    instance.addEventListener('message', function onReady(e) {
      var data = e.data;
      var name = data && data.name;

      if (name === 'worker:ready') {
        instance.removeEventListener('message', onReady, false);
        instance.addEventListener(
            'message', _.bind(worker.handleMessage_, worker), false);

        result.resolve(instance);
      }
    }, false);

    return result.promise;
  };

  Thread.prototype.handleMessage_ = function(e) {
    var data = e.data;
    var name = data.name;
    var value = data.value;

    switch (name) {
      case 'worker:result':
        this.taskResultMap_[value.id].resolve(value.result);
        this.taskResultMap_[value.id] = null;
        break;
    }
  };

  Thread.prototype.becomesIdle = function() {
    return this.workQueue_;
  };

  Thread.prototype.executeTask = function(task, args) {
    var result = Q.defer();
    var id = _.uniqueId();

    this.taskResultMap_[id] = result;
    this.instanceReadies_.then(function(instance) {
      instance.postMessage({
        name: 'worker:execute',
        value: {
          id: id,
          task: task,
          args: args
        }
      });
    });

    this.workQueue_ = this.workQueue_.then(function() {
      return result.promise;
    });

    return result.promise;
  };

  return Thread;
});
