var iframeSandbox = hammerhead.sandbox.iframe;
var windowStorage = hammerhead.sandbox.windowStorage;

QUnit.testStart(function () {
    iframeSandbox.on(iframeSandbox.RUN_TASK_SCRIPT_EVENT, initIframeTestHandler);
    iframeSandbox.off(iframeSandbox.RUN_TASK_SCRIPT_EVENT, iframeSandbox.iframeReadyToInitHandler);
});

QUnit.testDone(function () {
    iframeSandbox.off(iframeSandbox.RUN_TASK_SCRIPT_EVENT, initIframeTestHandler);
});

test('iframe', function () {
    var iframe = document.createElement('iframe');

    iframe.id   = 'test_unique_id_ea366my0l';
    iframe.name = 'test_iframe';
    document.body.appendChild(iframe);

    ok(windowStorage.findByName('test_iframe'));
    ok(!windowStorage.findByName('wrong_iframe_name'));

    iframe.parentNode.removeChild(iframe);

    ok(!windowStorage.findByName('test_iframe'));
});

test('top window', function () {
    var storedWindowName = window.name;

    window.name = 'test_top_window';

    ok(windowStorage.findByName('test_top_window'));
    ok(!windowStorage.findByName('non_existing_window_name'));

    window.name = storedWindowName;
});

module('regression');

test('should not raise an error for a cross-domain iframe (GH-669)', function () {
    var src = '../../data/code-instrumentation/iframe.html';

    return window.createTestIframe(window.getCrossDomainPageUrl(src))
        .then(function () {
            return window.createTestIframe({
                src:  window.getSameDomainPageUrl(src),
                name: 'same_domain_iframe'
            });
        })
        .then(function () {
            ok(windowStorage.findByName('same_domain_iframe'));
        });
});
