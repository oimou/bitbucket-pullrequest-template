$(function () {
    var port = chrome.runtime.connect({name: "bitbucket-pullrequest-template"});
    var branch = $(".compare-widget").eq(0).attr("data-branch-name");
    var repo = location.href.split('/').slice(3, 5).join('/');
    var $auiButtons;
    var $btnRequest;
    var $btnShow;

    function encode(str) {
        return str.replace(/\//g, "..");
    }

    function checkPreviewCreated() {
        var def = $.Deferred();
        var url = "http://52.68.12.189:18080/preview/show/" + encode(repo) + "/" + encode(branch) + "/dist";

        port.postMessage({
            "type": "check-preview-created",
            "url": url
        });

        port.onMessage.addListener(function (resp) {
            if (resp.type !== "check-preview-created") return;

            if (resp.statusCode === 200) {
                def.resolve(true);
            } else {
                def.resolve(false);
            }
        });

        return def.promise();
    }

    function inputDescriptionTemplate() {
        var TEMPLATE_PULLREQUEST = [
            "### 関連チケット",
            "",
            "",
            "### 概要",
            "",
            "",
            "### 確認方法",
            "",
            ""
        ].join("\n");
        var $description = $("#id_description");

        if (!$description.val()) {
            $description.val(TEMPLATE_PULLREQUEST);
        }
    }

    function insertAuiButtons() {
        var $buttons = $("<div>", {
            "class": "aui-buttons",
            css: {
                "float": "right",
                margin: "15px 0"
            }
        });

        $("#pullrequest-actions").parent().after($buttons);

        $auiButtons = $buttons;
    }

    function insertRequestPreviewServerButton() {
        var $button = $("<a>");
        var $progress = $("<div>");

        $button
            .text("プレビュー環境を用意")
            .addClass("aui-button")
            .css({
                position: "relative"
            });

        $progress
            .attr("data-progress", true)
            .css({
                position: "absolute",
                bottom: 0,
                left: 0,
                background: "#fa3",
                height: 3,
                width: "0%",
                transition: ".1s ease width, .2s ease opacity"
            });

        $button.on("click", requestPreviewServer);

        $progress.appendTo($button);
        $button.appendTo($auiButtons);

        return $button;
    }

    function insertShowPreviewServerButton() {
        var $button = $("<button>");

        $button
            .text("プレビュー")
            .attr("disabled", true)
            .addClass("aui-button");

        $button.on("click", showPreviewServer);

        $button.appendTo($auiButtons);

        return $button;
    }

    function requestPreviewServer() {
        var url = "ws://52.68.12.189:18080/preview/request";

        port.postMessage({
            "type": "request-preview-server",
            "url": url,
            repo: repo,
            branch: branch
        });

        $btnRequest.attr("disabled", true);

        port.onMessage.addListener(function (resp) {
            if (resp.type !== "request-preview-server") return;

            $btnRequest.find("[data-progress]")
                .css({
                    width: (~~(resp.value * 10000) / 100) + "%"
                });

            if (resp.value == 1) {
                setTimeout(function onPreviewServerCreated() {
                    $btnRequest.find("[data-progress]").css("opacity", 0);
                    $btnShow.attr("disabled", false);
                }, 300);
            }
        });
    }

    function showPreviewServer() {
        var url = "http://52.68.12.189:18080/preview/show/" + encode(repo) + "/" + encode(branch) + "/dist";

        window.open(url);
    }

    checkPreviewCreated()
        .then(function (isCreated) {
            if (isCreated) {
                $btnShow.attr("disabled", false);
            }
        });

    inputDescriptionTemplate();
    insertAuiButtons();

    $btnRequest = insertRequestPreviewServerButton();
    $btnShow = insertShowPreviewServerButton();
});
