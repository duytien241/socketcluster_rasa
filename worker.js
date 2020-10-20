var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var scCodecMinBin = require('sc-codec-min-bin');

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

    var app = express();

    var httpServer = this.httpServer;
    var scServer = this.scServer;
    scServer.setCodecEngine(scCodecMinBin);

    if (environment === 'dev') {
      // Log every HTTP request.
      // See https://github.com/expressjs/morgan for other available formats.
      app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Listen for HTTP GET "/health-check".
    healthChecker.attach(this, app);

    httpServer.on('request', app);
    var count = 0
    scServer.on("connection", function (socket) {
      console.log(socket.id)
      socket.on(`bot_uttered${socket.id}`, function (data) {
        console.log("Handled sampleClientEvent", data);
        scServer.exchange.publish("user_uttered", {id:socket.id, message: data});
      });

      scServer.exchange.emit("customRemoteEvent", count);
      scServer.exchange.publish("customProc", count, (err) => {
        console.log(err);
      });
      var interval = setInterval(function () {
        socket.emit("random", {
          number: Math.floor(Math.random() * 5),
        });
      }, 1000);

      socket.on("disconnect", function () {
        clearInterval(interval);
      });
    });

    /**
     * NOTE: Be sure to replace the following sample logic with your own logic.
     */

    /**
    var count = 0;
    // Handle incoming websocket connections and listen for events.
    scServer.on('connection', function (socket) {

      socket.on('sampleClientEvent', function (data) {
        count++;
        console.log('Handled sampleClientEvent', data);
        scServer.exchange.publish('sample', count);
      });

      var interval = setInterval(function () {
        socket.emit('random', {
          number: Math.floor(Math.random() * 5)
        });
      }, 1000);

      socket.on('disconnect', function () {
        clearInterval(interval);
      });

    });
    */
  }
}

new Worker();
