var INTERNAL_PROPS  = Hammerhead.get('../processing/dom/internal-properties');
var Promise         = Hammerhead.get('es6-promise').Promise;
var urlUtils        = Hammerhead.get('./utils/url');
var domProcessor    = Hammerhead.get('./dom-processor');
var scriptProcessor = Hammerhead.get('../processing/script');

var jsProcessor           = Hammerhead.jsProcessor;
var nativeMethods         = Hammerhead.nativeMethods;
var browserUtils          = Hammerhead.utils.browser;
var iframeSandbox         = Hammerhead.sandbox.iframe;
var elementEditingWatcher = Hammerhead.sandbox.event.elementEditingWatcher;
var eventSimulator        = Hammerhead.sandbox.event.eventSimulator;

QUnit.testStart(function () {
    iframeSandbox.on(iframeSandbox.IFRAME_READY_TO_INIT_EVENT, initIframeTestHandler);
    iframeSandbox.off(iframeSandbox.IFRAME_READY_TO_INIT_EVENT, iframeSandbox.iframeReadyToInitHandler);
});

QUnit.testDone(function () {
    iframeSandbox.off(iframeSandbox.IFRAME_READY_TO_INIT_EVENT, initIframeTestHandler);
});

/* eslint-disable no-implied-eval */
test('script.textContent', function () {
    var script     = document.createElement('script');
    var scriptCode = 'var test = window.href;';

    eval(processScript('script.textContent="' + scriptCode + '"'));

    notEqual(script.textContent, scriptCode);
    strictEqual(script.textContent.replace(/\s/g, ''), scriptProcessor.process(scriptCode).replace(/\s/g, ''));
});

test('unsupported protocol', function () {
    var img = document.createElement('img');

    eval(processScript('img.src = "about:blank";'));
    strictEqual(getProperty(img, 'src'), 'about:blank');
    strictEqual(img.src, 'about:blank');
});

test('anchor', function () {
    var anchor = document.createElement('a');
    /* eslint-disable no-unused-vars */
    var emptyAnchor = document.createElement('a');
    /* eslint-enable no-unused-vars */
    var anchorWithNotSupportedProtocol       = document.createElement('a');
    var etalonAnchor                         = document.createElement('a');
    var etalonEmptyAnchor                    = document.createElement('a');
    var etalonAnchorWithNotSupportedProtocol = document.createElement('a');
    var url                                  = 'https://google.com:1888/index.html?value#yo';
    var proxyUrl                             = urlUtils.getProxyUrl(url);

    etalonAnchor.href = url;
    anchor.href       = proxyUrl;

    var execScript    = function (script) {
        return eval(processScript(script));
    };

    strictEqual(execScript('anchor.port'), etalonAnchor.port, 'Anchor - port');
    strictEqual(execScript('anchor.host'), etalonAnchor.host, 'Anchor - host');
    strictEqual(execScript('anchor.hostname'), etalonAnchor.hostname, 'Anchor - hostname');
    strictEqual(execScript('anchor.protocol'), etalonAnchor.protocol, 'Anchor - protocol');
    strictEqual(execScript('anchor.pathname'), etalonAnchor.pathname, 'Anchor - pathname');
    strictEqual(execScript('anchor.search'), etalonAnchor.search, 'Anchor - search');
    strictEqual(execScript('anchor.hash'), etalonAnchor.hash, 'Anchor - hash');


    if ('origin' in anchor)
        strictEqual(execScript('anchor.origin'), etalonAnchor.origin);

    strictEqual(execScript('emptyAnchor.port'), etalonEmptyAnchor.port);
    strictEqual(execScript('emptyAnchor.host'), etalonEmptyAnchor.host);
    strictEqual(execScript('emptyAnchor.hostname'), etalonEmptyAnchor.hostname);
    strictEqual(execScript('emptyAnchor.protocol'), etalonEmptyAnchor.protocol);
    strictEqual(execScript('emptyAnchor.pathname'), etalonEmptyAnchor.pathname);
    strictEqual(execScript('emptyAnchor.search'), etalonEmptyAnchor.search);

    if ('origin' in etalonEmptyAnchor)
        strictEqual(execScript('emptyAnchor.origin'), etalonEmptyAnchor.origin);

    // Port
    execScript('anchor.port="8080";');
    etalonAnchor.port = '8080';
    strictEqual(execScript('anchor.port'), etalonAnchor.port);

    etalonEmptyAnchor.port     = '8080';
    execScript('emptyAnchor.port="8080";');
    strictEqual(execScript('emptyAnchor.port'), etalonEmptyAnchor.port);

    // Host
    execScript('anchor.host="yandex.com";');
    etalonAnchor.host          = 'yandex.com';
    strictEqual(execScript('anchor.host'), etalonAnchor.host);

    execScript('emptyAnchor.host="yandex.com";');
    etalonEmptyAnchor.host     = 'yandex.com';
    strictEqual(execScript('emptyAnchor.host'), etalonEmptyAnchor.host);

    // Hostname
    execScript('anchor.hostname="yandex.ru";');
    etalonAnchor.hostname      = 'yandex.ru';
    strictEqual(execScript('anchor.hostname'), etalonAnchor.hostname);

    execScript('emptyAnchor.hostname="yandex.ru";');
    etalonEmptyAnchor.hostname = 'yandex.ru';
    strictEqual(execScript('emptyAnchor.hostname'), etalonEmptyAnchor.hostname);

    // Protocol
    execScript('anchor.protocol="http:";');
    etalonAnchor.protocol      = 'http:';
    strictEqual(execScript('anchor.protocol'), etalonAnchor.protocol);


    if (!browserUtils.isSafari) {
        execScript('emptyAnchor.protocol="https:";');
        etalonEmptyAnchor.protocol = 'https:';
        strictEqual(execScript('emptyAnchor.protocol'), etalonEmptyAnchor.protocol);
    }

    // Pathname
    var newPathName       = etalonAnchor.pathname + '/index.php';

    execScript('anchor.pathname="' + newPathName + '"');
    etalonAnchor.pathname = newPathName;
    strictEqual(execScript('anchor.pathname'), etalonAnchor.pathname);

    execScript('emptyAnchor.pathname="temp/index.php";'); // TODO: iOS!!!
    etalonEmptyAnchor.pathname = 'temp/index.php';
    strictEqual(execScript('emptyAnchor.pathname'), etalonEmptyAnchor.pathname);

    // Origin
    // IE has no origin property
    if ('origin' in etalonEmptyAnchor) {
        execScript('anchor.origin="http://yandex.ru:2000"');
        etalonAnchor.origin      = 'http://yandex.ru:2000';
        strictEqual(execScript('anchor.origin'), etalonAnchor.origin);

        execScript('emptyAnchor.origin="http://yandex.ru:2000";');
        etalonEmptyAnchor.origin = 'http://yandex.ru:2000';
        strictEqual(execScript('emptyAnchor.origin'), etalonEmptyAnchor.origin);
    }

    // Search
    execScript('anchor.search="?test=temp"');
    etalonAnchor.search        = '?test=temp';
    strictEqual(execScript('anchor.search'), etalonAnchor.search);

    execScript('emptyAnchor.search="?test=temp"');
    etalonEmptyAnchor.search   = '?test=temp';
    strictEqual(execScript('emptyAnchor.search'), etalonEmptyAnchor.search);

    anchorWithNotSupportedProtocol.href       = 'javascript:;';
    etalonAnchorWithNotSupportedProtocol.href = 'javascript:;';

    strictEqual(execScript('anchorWithNotSupportedProtocol.port'), etalonAnchorWithNotSupportedProtocol.port);
    strictEqual(execScript('anchorWithNotSupportedProtocol.host'), etalonAnchorWithNotSupportedProtocol.host);
    strictEqual(execScript('anchorWithNotSupportedProtocol.hostname'), etalonAnchorWithNotSupportedProtocol.hostname);
    strictEqual(execScript('anchorWithNotSupportedProtocol.protocol'), etalonAnchorWithNotSupportedProtocol.protocol);
    strictEqual(execScript('anchorWithNotSupportedProtocol.pathname'), etalonAnchorWithNotSupportedProtocol.pathname);
    strictEqual(execScript('anchorWithNotSupportedProtocol.search'), etalonAnchorWithNotSupportedProtocol.search);

    if ('origin' in anchorWithNotSupportedProtocol)
        strictEqual(execScript('anchorWithNotSupportedProtocol.origin'), etalonAnchorWithNotSupportedProtocol.origin);
});

test('location as a local var', function () {
    var location = '';

    eval(processScript('location = "test"'));
    strictEqual(location, 'test');

    eval(processScript('location = null'));
    strictEqual(location, null);

    eval(processScript('location = undefined'));
    strictEqual(location, void 0);

    eval(processScript('location = ""'));
    strictEqual(location, '');
});

test('simple type', function () {
    strictEqual(setProperty(1, 'prop_name', 2), 2);
});

test('script text', function () {
    var script = document.createElement('script');

    eval(processScript('script.text="var test = window.href;"'));
    ok(jsProcessor.isScriptProcessed(script.text));
});

test('iframe', function () {
    var iframe = document.createElement('iframe');

    window[INTERNAL_PROPS.overrideDomMethodName](iframe);

    eval(processScript('iframe.sandbox="allow-forms"'));
    strictEqual(nativeMethods.getAttribute.call(iframe, 'sandbox'), 'allow-forms allow-scripts');
    strictEqual(nativeMethods.getAttribute.call(iframe, domProcessor.getStoredAttrName('sandbox')), 'allow-forms');

    var result = '';

    eval(processScript('result = iframe.sandbox'));
    strictEqual(result, 'allow-forms');
});

test('innerHTML', function () {
    var div       = document.createElement('div');
    var scriptUrl = 'http://some.com/script.js';
    var linkUrl   = 'http://some.com/page';

    document[INTERNAL_PROPS.documentCharset] = 'utf-8';

    eval(processScript('div.innerHTML = "<script src=\\"" + scriptUrl + "\\"><\/script><a href=\\"" + linkUrl + "\\"></a>";'));

    strictEqual(div.children.length, 2);
    strictEqual(div.children[0].src, urlUtils.getProxyUrl(scriptUrl, null, null, null, urlUtils.SCRIPT, 'utf-8'));
    strictEqual(div.children[1].href, urlUtils.getProxyUrl(linkUrl));

    document[INTERNAL_PROPS.documentCharset] = null;
});

asyncTest('body.innerHTML in iframe', function () {
    $('<iframe>')
        .attr('src', window.QUnitGlobals.getResourceUrl('../../../data/code-instrumentation/iframe.html'))
        .appendTo(document.body)
        .load(function () {
            var iframe           = this;
            var haveShadowUIRoot = function () {
                var root = iframe.contentDocument.body.children[0];

                return root && root.id.indexOf('root-') === 0;
            };

            ok(haveShadowUIRoot());

            eval(processScript('iframe.contentDocument.body.innerHTML = "";'));

            var id = window.setInterval(function () {
                if (haveShadowUIRoot()) {
                    ok(true);
                    iframe.parentNode.removeChild(iframe);
                    window.clearInterval(id);
                    start();
                }
            }, 100);

        });
});

// IE does not allow to override postMessage method
if (!browserUtils.isIE) {
    asyncTest('postMessage', function () {
        var target = window.location.protocol + '//' + window.location.host;
        var iframe = document.createElement('iframe');

        iframe.src = window.location.origin;
        iframe.addEventListener('load', function () {
            iframe.contentWindow.postMessage = function () {
                strictEqual(target, window.location.origin);
                iframe.parentNode.removeChild(iframe);
                this.postMessage = function () {
                };
                start();
            };
            eval(processScript('iframe.contentWindow.postMessage("data", "' + target + '")'));
        });
        document.body.appendChild(iframe);
    });
}

module('regression');

test('script block inserted via element.innerHtml must not be executed (B237015)', function () {
    var testPropertyName = 'testProperty';
    var el               = document.createElement('div');
    var body             = document.getElementsByTagName('body')[0];
    var script           = '<script>window.' + testPropertyName + ' = true;\<\/script>';

    body.appendChild(el);
    el.innerHTML         = script;

    ok(!window[testPropertyName]);
});

if (!browserUtils.isIE) {
    asyncTest('valid resource type for iframe.contentWindow.location must be calculated', function () {
        var iframe = document.createElement('iframe');

        iframe.id = 'testT260697';

        var loadHandler = function () {
            iframe.removeEventListener('load', loadHandler);

            iframe.addEventListener('load', function () {
                strictEqual(urlUtils.parseProxyUrl(iframe.contentWindow.location).resourceType, 'iframe');
                iframe.parentNode.removeChild(iframe);
                start();
            });

            eval(processScript('iframe.contentWindow.location = "/test.html";'));
        };

        iframe.addEventListener('load', loadHandler);
        document.body.appendChild(iframe);
    });
}

asyncTest('iframe.body.innerHtml must be overriden (Q527555)', function () {
    var $iframe = $('<iframe id="test">').appendTo('body');

    window.setTimeout(function () {
        var iframeBody = $iframe[0].contentWindow.document.body;
        var html       = '<a href="url" ' + domProcessor.getStoredAttrName('src') + '="url1" />';

        iframeBody.innerHTML = html;

        ok(getProperty(iframeBody, 'innerHTML') !== html);
        $iframe.remove();
        start();
    }, 100);
});

test('setting the link.href attribute to \'mailto\' in iframe (T228218)', function () {
    var storedGetProxyUrl = urlUtils.getProxyUrl;
    var link              = document.createElement('a');

    urlUtils.getProxyUrl = function () {
        return 'http://replaced';
    };

    eval(processScript('link.href="http://host.com/"'));
    ok(link.href.indexOf('http://replaced') === 0);

    eval(processScript('link.href="mailto:test@mail.com"'));
    strictEqual(link.href, 'mailto:test@mail.com');
    strictEqual(eval(processScript('link.href')), 'mailto:test@mail.com');
    strictEqual(link.getAttribute('href'), 'mailto:test@mail.com');

    urlUtils.getProxyUrl = storedGetProxyUrl;
});

test('link without the href attrubute must return an empty value for href (B238838)', function () {
    var url             = 'http://www.test.com/';
    var linkWithHref    = $('<a href="' + url + '">')[0];
    var linkWithoutHref = $('<a>')[0];

    strictEqual(getProperty(linkWithHref, 'href'), url);
    strictEqual(getProperty(linkWithoutHref, 'href'), '');
});

test('event.which must return undefined if originalEvent is null (T232468)', function () {
    /* eslint-disable no-unused-vars */
    var evtObj = {
        originalEvent: null
    };

    strictEqual(eval(processScript('evtObj.which')), void 0);
    /* eslint-enable no-unused-vars */
});

asyncTest('input\'s onchange event must not be raise after press Tab key (T221375)', function () {
    var $input     = $('<input value="0">');
    var firedCount = 0;

    $input.on('change', function () {
        firedCount++;
    });

    expect(1);

    function nextTick () {
        return new Promise(function (resolve) {
            setTimeout(resolve, 0);
        });
    }

    elementEditingWatcher.watchElementEditing($input[0]);

    $input[0].value = '123';
    eventSimulator.blur($input[0]);

    nextTick()
        .then(function () {
            elementEditingWatcher.watchElementEditing($input[0]);

            $input[0].value = '423';
            eval(processScript('$input[0].value = 42'));
            eventSimulator.blur($input[0]);
        })
        .then(nextTick)
        .then(function () {
            strictEqual(firedCount, 1);
            $input.remove();
            start();
        });
});

/* eslint-enable no-implied-eval */
