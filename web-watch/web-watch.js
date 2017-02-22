module.exports = function(RED) {
    "use strict";
    var request = require('request');

    function WebpageWatch(n) {
        RED.nodes.createNode(this,n);
        this.url = n.url;
        this.html = n.html;
        this.interval = parseInt(n.interval);
        var node = this,
            intervalId,
            html;

        node.log("Web watch URL " + this.url);

        var msg = {};
        var url = msg.url || node.url;

        if(msg.hasOwnProperty('payload')) {
            msg._payload = msg.payload;
        }
        if(msg.hasOwnProperty('topic')) {
            msg._topic = msg.topic;
        }
        msg.payload = false;
        msg.topic = url;

        if (!url) {
            node.warn('No url is specified. Either specify in node configuration.');
            return;
        }

        intervalId = setInterval(function() {
            request(node.url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (html == undefined) {
                        html = body;
                    } else if (html != "" && html != body) {
                        html = body;
                        msg.payload = body;
                        node.send(msg);
                    }
                }
            });
        }, node.interval * 1000);

        this.on('close', function() {
            clearInterval(intervalId);
        });
    }
    RED.nodes.registerType("Web watch", WebpageWatch);

    function WebpageWatchIn(n) {
        RED.nodes.createNode(this,n);
        this.url = n.url;
        this.html = n.html;
        this.interval = parseInt(n.interval);
        var node = this,
            intervalId,
            html;

        node.log("Web watch in URL " + this.url);

        this.on("input", function (msg) {
            var url = msg.url || node.url;

            if(msg.hasOwnProperty('payload')) {
                msg._payload = msg.payload;
            }
            if(msg.hasOwnProperty('topic')) {
                msg._topic = msg.topic;
            }
            msg.payload = false;
            msg.topic = url;

            if (!url) {
                node.warn('No url is specified. Either specify in node configuration or by passing in msg.url');
                return;
            }

            intervalId = setInterval(function() {
                request(node.url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        if (html == undefined) {
                            html = body;
                        } else if (html != "" && html != body) {
                            html = body;
                            msg.payload = body;
                            node.send(msg);
                        }
                    }
                });
            }, node.interval * 1000);
        });

        this.on('close', function() {
            clearInterval(intervalId);
        });
    }
    RED.nodes.registerType("Web watch in", WebpageWatchIn);
}
