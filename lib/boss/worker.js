define(['boss/archetype', 'underscore', 'q'],
       function(Archetype, _, Q) {
  'use strict';

  var Worker = Archetype.extend({
    initialize: function() {
      this.send('worker:ready');
      this.workQueue_ = Q.resolve();
    },
    execute: function(id, task, args) {
      var result = Q.defer();

      require([task], function(Task) {
        var instance = new Task();
        var taskResult = instance.run.apply(instance, args);

        result.resolve(taskResult);

        instance.dispose();
      });

      this.workQueue_ = this.workQueue_.then(function() {
        return result.promise;
      });

      return result.promise;
    },
    becomesIdle: function() {
      return this.workQueue_;
    },
    handleMessage_: function(e) {
      var data = e.data;
      var name = data.name;
      var value = data.value;

      switch(name) {
        case 'worker:execute':
          this.execute(value.id, value.task, value.args).then(
              _.bind(function(result) {

            this.send('worker:result', {
              id: value.id,
              result: result
            });
          }, this));
          break;
      }
    }
  });

  return Worker;
});

