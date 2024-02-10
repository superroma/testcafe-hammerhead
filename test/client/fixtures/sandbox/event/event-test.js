var browserUtils     = hammerhead.utils.browser;
// var featureDetection = hammerhead.utils.featureDetection;
// var eventUtils       = hammerhead.utils.event;
// var nativeMethods    = hammerhead.nativeMethods;
// var listeners        = hammerhead.sandbox.event.listeners;
// var focusBlur        = hammerhead.sandbox.event.focusBlur;
// var eventSimulator   = hammerhead.sandbox.event.eventSimulator;
// var listeningCtx     = hammerhead.sandboxUtils.listeningContext;

if (browserUtils.isWebKit) {
    asyncTest('the "Illegal invocation" error after svg element focused (#82)', function () {
        var $svgElement = $(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">' +
            '<rect id="rect" width="300" height="300" fill="red" tabIndex="1"></rect>' +
            '</svg>').appendTo('body');

        $('<div>').text('Before processDomMeth').appendTo('body');

        try {
            processDomMeth($svgElement[0]);
        }
        catch (e) {
            $('<div>').text('Error: ' + e.message).appendTo('body');
        }

        $('<div>').text('Text after processDomMeth').appendTo('body');

        var rectElement = document.getElementById('rect');

        rectElement.onfocus = function () {
            rectElement.onblur = function () {
                $('<div>').text('Inside blur').appendTo('body');
                ok(true);
                $('<div>').text('After assertion').appendTo('body');
                $svgElement.remove();
                $('<div>').text('After svg remove').appendTo('body');
                start();
            };
            $('<div>').text('Before blur').appendTo('body');
            var focusEvent = new Event('blur');

            rectElement.dispatchEvent(focusEvent);
        };
        $('<div>').text('Before focus').appendTo('body');
        var focusEvent = new Event('focus');

        rectElement.dispatchEvent(focusEvent);
    });
}
