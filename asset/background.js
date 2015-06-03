"use strict";

function checkPreviewCreated(url, port) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.onload = function () {
        port.postMessage({
            type: "check-preview-created",
            statusCode: this.status
        });
    };
    xhr.send();
}

function requestPreviewServer(url, repo, branch, port) {
    var ws = new WebSocket(url);

    ws.onopen = function () {
        ws.send(JSON.stringify({
            type: "preview-request",
            repo: repo,
            branch: branch
        }));

        port.postMessage({
            type: "request-preview-server",
            value: 0
        });
    };

    ws.onmessage = function (message) {
        message = JSON.parse(message.data);

        port.postMessage({
            type: "request-preview-server",
            value: message.value
        });
    };

    ws.onerror = function () {
        port.postMessage({
            type: "request-preview-server",
            value: 1
        });
    };
}

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name === "bitbucket-pullrequest-template");

    port.onMessage.addListener(function (message) {
        switch (message.type) {
        case "check-preview-created":
            checkPreviewCreated(message.url, port);
            break;

        case "request-preview-server":
            requestPreviewServer(
                message.url,
                message.repo,
                message.branch,
                port
            );
            break;

        default:
            port.postMessage({});
            break;
        }
    });

    /*
    var url = message.url;
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, false);
    xhr.onload = function () {
        var txt = this.responseText;

        sendResponse({
            txt: txt
        });
    };
    xhr.send();
    */
});
