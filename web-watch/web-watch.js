module.exports = function(RED) {
    "use strict";
    var request = require('request');

    function WebpageWatch(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        if (!config.url) {
            node.warn('Web watch URL: No URL is specified. Please specify in node configuration.');
            return;
        }

        config.interval = parseInt(config.interval);
        var intervalId = null;
        var cacheHtml = null;
        var msg = {
            payload : {
                headers: null,
                url: config.url,
                body: null
            }
        };

        node.log("Web watch URL (" + config.interval + " seconds): " + config.url);

        intervalId = setInterval(function() {
            request(config.url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (cacheHtml == undefined) {
                        cacheHtml = body;
                    } else if (cacheHtml != "" && cacheHtml != body) {
                        cacheHtml = body;
                        msg.payload.headers = response.headers;
                        msg.payload.body = body;
                        node.send(msg);
                    }
                }
            });
        }, config.interval * 1000);

        node.on('close', function() {
            if (intervalId != null) {
                clearInterval(intervalId);
            }
        });
    }
    RED.nodes.registerType("Web watch", WebpageWatch);

    function WebpageWatchIn(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        config.interval = parseInt(config.interval);
        var intervalId = null;
        var cacheHtml = null;
        var msg = {
            headers: null,
            url: config.url,
            payload: null
        };

        function runInterval(msg) {
            if (intervalId != null) {
                clearInterval(intervalId);
            }

            intervalId = setInterval(function() {
                request(config.url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        if (cacheHtml == undefined) {
                            cacheHtml = body;
                        } else if (cacheHtml != "" && cacheHtml != body) {
                            cacheHtml = body;
                            msg.headers = response.headers;
                            msg.payload = body;
                            node.send(msg);
                        }
                    }
                });
            }, config.interval * 1000);
        }

        if (config.url) {
            node.log("Web watch in URL (" + config.interval + " seconds): " + config.url);
            runInterval(msg);
        }

        node.on("input", function (msg) {
            // try json parse on msg.payload first
            try {
                var _msg = JSON.parse(msg.payload);
                if (typeof _msg === 'object') {
                    if(_msg.hasOwnProperty('url')) {
                        msg.url = _msg.url;
                    }
                    if(_msg.hasOwnProperty('interval')) {
                        msg.interval = _msg.interval;
                    }
                }
            }
            catch (ex){
                console.log (ex);
            }

            if (!msg.url) {
                node.warn('Web watch in: No URL is specified. Either specify in node configuration or by passing in msg.url');
                return;
            }

            config.url = msg.url;
            config.interval = msg.interval || config.interval;

            node.log("Web watch in URL (" + config.interval + " seconds): " + config.url);

            if(msg.hasOwnProperty('payload')) {
                msg._payload = msg.payload;
            }
            if(msg.hasOwnProperty('topic')) {
                msg._topic = msg.topic;
            }

            runInterval(msg);
        });

        node.on('close', function() {
            if (intervalId != null) {
                clearInterval(intervalId);
            }
        });
    }
    RED.nodes.registerType("Web watch in", WebpageWatchIn);
}
