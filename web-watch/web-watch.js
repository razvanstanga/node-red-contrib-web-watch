module.exports = function(RED) {
    "use strict";
    var request = require("request");

    function WebpageWatch(config) {
        RED.nodes.createNode(this, config);
        this.active = config.active;
        var node = this;

        if (!config.url) {
            node.warn("No URL is specified. Please specify in node configuration.");
            return;
        }

        config.interval = parseInt(config.interval);
        node.intervalId = null;
        node.cacheHtml = null;
        var msg = {
            url: config.url,
            node: node.type
        };
        runInterval(msg, node, config);
        node.log("URL (" + config.interval + " seconds): " + config.url);

        node.on("close", function() {
            if (this.intervalId != null) {
                clearInterval(this.intervalId);
            }
        });
    }
    RED.nodes.registerType("Web watch", WebpageWatch);

    function WebpageWatchIn(config) {
        RED.nodes.createNode(this, config);
        this.active = config.active;
        var node = this;

        config.interval = parseInt(config.interval);
        node.intervalId = null;
        node.cacheHtml = null;
        var msg = {
            url: config.url,
            node: node.type
        };

        if (config.url) {
            node.log("URL (" + config.interval + " seconds): " + config.url);
            runInterval(msg, node, config);
        }

        node.on("input", function (msg) {
            // try json parse on msg.payload first
            try {
                var _msg = JSON.parse(msg.payload);
                if (typeof _msg === "object") {
                    if(_msg.hasOwnProperty("url")) {
                        msg.url = _msg.url;
                    }
                    if(_msg.hasOwnProperty("interval")) {
                        msg.interval = _msg.interval;
                    }
                }
            }
            catch (ex){
                console.log (ex);
            }

            if (!msg.url) {
                this.warn("No URL is specified. Either specify in node configuration or by passing in msg.url");
                return;
            }

            config.url = msg.url;
            config.interval = msg.interval || config.interval;

            this.log("URL (" + config.interval + " seconds): " + config.url);

            if(msg.hasOwnProperty("payload")) {
                msg._payload = msg.payload;
            }
            if(msg.hasOwnProperty("topic")) {
                msg._topic = msg.topic;
            }
            msg.node = this.type;
            runInterval(msg, this, config);
        });

        node.on("close", function() {
            if (this.intervalId != null) {
                clearInterval(this.intervalId);
            }
        });
    }
    RED.nodes.registerType("Web watch in", WebpageWatchIn);

    RED.httpAdmin.post("/web-watch/:id/:state", RED.auth.needsPermission("web-watch.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        var state = req.params.state;
        if (node !== null && typeof node !== "undefined" ) {
            if (state === "enable") {
                node.active = true;
                res.sendStatus(200);
            } else if (state === "disable") {
                node.active = false;
                res.sendStatus(201);
            } else {
                res.sendStatus(404);
            }
        } else {
            res.sendStatus(404);
        }
    });

    function runInterval(msg, node, config) {
        if (node.intervalId != null) {
            clearInterval(node.intervalId);
        }

        node.intervalId = setInterval(function() {
            if (node.active == false) return;
            request(config.url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (node.cacheHtml == null) {
                        node.cacheHtml = body;
                    } else if (node.cacheHtml != "" && node.cacheHtml != body) {
                        node.cacheHtml = body;
                        msg.headers = response.headers;
                        msg.payload = body;
                        node.send(msg);
                    }
                }
            });
        }, config.interval * 1000);
    }
}
