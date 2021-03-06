var SCWorker = require("socketcluster/scworker");
var express = require("express");
var serveStatic = require("serve-static");
var path = require("path");
var morgan = require("morgan");
var healthChecker = require("sc-framework-health-check");
var scCodecMinBin = require("sc-codec-min-bin");

class Worker extends SCWorker {
  run() {
    console.log("   >> Worker PID:", process.pid);
    var environment = this.options.environment;

    var app = express();

    var httpServer = this.httpServer;
    var scServer = this.scServer;
    scServer.setCodecEngine(scCodecMinBin);

    if (environment === "dev") {
      // Log every HTTP request.
      // See https://github.com/expressjs/morgan for other available formats.
      app.use(morgan("dev"));
    }
    app.use(serveStatic(path.resolve(__dirname, "public")));

    healthChecker.attach(this, app);

    httpServer.on("request", app);
    scServer.on("connection", function (socket) {
      scServer.exchange.publish("user_uttered", {
        id: socket.id
      });
      socket.on("disconnect", function () {});
    });
  }
}

new Worker();
