var processScript       = hammerhead.get('../processing/script').processScript;
var SHADOW_UI_CLASSNAME = hammerhead.get('../shadow-ui/class-name');
var INTERNAL_PROPS      = hammerhead.get('../processing/dom/internal-properties');
var urlUtils            = hammerhead.get('./utils/url');
var destLocation        = hammerhead.get('./utils/destination-location');
var settings            = hammerhead.get('./settings');

var browserUtils  = hammerhead.utils.browser;
var nativeMethods = hammerhead.nativeMethods;
var Promise       = hammerhead.Promise;
var shadowUI      = hammerhead.sandbox.shadowUI;

test('document.write for iframe.src with javascript protocol', function () {
    var $div = $('<div>').appendTo('body');

    processDomMeth($div[0]);

    var $iframe = $('<iframe id="test4" src="javascript:&quot;<html><body><a id=\'link\' href=\'http://google.com/\'></body></html>&quot;"></iframe>"');

    $div[0].appendChild($iframe[0]);
    ok($iframe[0].contentDocument.write.toString() !== nativeMethods.documentWrite.toString());

    $iframe.remove();
});

asyncTest('document.write for iframe with empty url', function () {
    var $div   = $('<div>').appendTo('body');
    var cheked = false;

    processDomMeth($div[0]);

    var $iframe = $('<iframe id="test3" src="about:blank">"');

    var check = function () {
        var document = $iframe[0].contentDocument;

        if (document)
            ok(document.write.toString() !== nativeMethods.documentWrite.toString());
    };

    check();

    $iframe.ready(check);
    $iframe.load(function () {
        check();

        var id = setInterval(function () {
            if (cheked) {
                clearInterval(id);
                $iframe.remove();
                start();
            }
        }, 10);

    });

    $div[0].appendChild($iframe[0]);
    check();
    cheked = true;
});

if (!browserUtils.isFirefox) {
    test('override document after document.write calling', function () {
        var $div    = $('<div>').appendTo('body');
        var $sdiv   = $('<div>').appendTo('body');
        var $iframe = $('<iframe id="test11" src="about:blank">"');
        var iframe  = $iframe[0];

        var checkIframeDocumentOverrided = function () {
            var document = iframe.contentDocument;
            var result   = true;

            if (document) {
                if (document.write.toString() === nativeMethods.documentWrite.toString())
                    result = false;
            }

            // NOTE: Stack overflow check.
            ok(!document || !!document.getElementsByTagName('body'));
            ok(!!window.top.document.getElementsByTagName('body'));

            ok(result);
        };

        var checkWriteFunction = function () {
            checkIframeDocumentOverrided();
            iframe.contentDocument.open();
            checkIframeDocumentOverrided();
            iframe.contentDocument.write('<div></div>');
            checkIframeDocumentOverrided();
            iframe.contentDocument.close();
            checkIframeDocumentOverrided();

            iframe.contentDocument.open();
            checkIframeDocumentOverrided();
            iframe.contentDocument.write('<html><body><a href="http://google.com/"></body></html>');
            checkIframeDocumentOverrided();
            iframe.contentDocument.close();
            checkIframeDocumentOverrided();
        };

        $iframe.ready(checkIframeDocumentOverrided);
        $iframe.load(checkIframeDocumentOverrided);

        // NOTE: After appended to DOM.
        $div[0].appendChild(iframe);
        checkWriteFunction();

        // NOTE: After reinserted to DOM.
        $sdiv[0].appendChild(iframe);
        checkWriteFunction();

        $iframe.remove();
        $sdiv.remove();
        $div.remove();
    });
}

module('querySelector, querySelectorAll (GH-340)');

test('quote types in attribute selectors', function () {
    var anchor = document.createElement('a');

    anchor.setAttribute('href', 'http://some.domain.com');
    document.body.appendChild(anchor);

    ok(document.querySelector('[href="http://some.domain.com"]'));
    ok(document.querySelector("[href='http://some.domain.com']"));

    anchor.parentNode.removeChild(anchor);
});

test('non-processed attributes', function () {
    var anchor = document.createElement('a');

    anchor.setAttribute('data-info', 'external anchor');
    anchor.setAttribute('hreflang', 'ru-RU');
    document.body.appendChild(anchor);

    ok(document.querySelector('[data-info~=external]'));
    ok(document.querySelector('[hreflang|=ru]'));

    anchor.parentNode.removeChild(anchor);
});

//http://www.w3.org/TR/css3-selectors/#attribute-selectors
test('attrubute types', function () {
    var link = document.createElement('a');
    var div  = document.createElement('div');

    link.setAttribute('href', 'http://some.domain.com');
    div.className = 'container';
    div.appendChild(link);

    document.body.appendChild(div);

    // [attribute]
    ok(div.querySelector('[href]'));

    // [attribute=value]
    ok(document.querySelector('[href="http://some.domain.com"]'));

    // [attribute~=value] - whitespace-separated values
    // Proxied attributes don't contain whitespace-separated values

    // [attribute|=value] - equal or starts with for value that ends with '-'
    // This is primarily intended to allow language subcode matches

    // [attribute^=value] - starts with
    ok(document.querySelector('[href^="http://some"]'));

    // [attribute$=value] - ends with
    ok(document.querySelector('[href$="domain.com"]'));

    // [attribute*=value] - contains value
    ok(document.querySelector('[href*=domain]'));
    link.parentNode.removeChild(link);
});

test('document, documentFragment, element', function () {
    var link         = document.createElement('a');
    var div          = document.createElement('div');
    var fragment     = document.createDocumentFragment();
    var fragmentLink = document.createElement('a');

    link.setAttribute('href', 'http://some.domain.com');
    fragmentLink.setAttribute('href', 'http://some.domain.com');
    div.appendChild(link);
    document.body.appendChild(div);
    fragment.appendChild(fragmentLink);

    ok(document.querySelector('a[href="http://some.domain.com"]'));
    strictEqual(document.querySelectorAll('a[href="http://some.domain.com"]').length, 1);
    ok(div.querySelector('[href="http://some.domain.com"]'));
    strictEqual(div.querySelectorAll('[href="http://some.domain.com"]').length, 1);
    ok(fragment.querySelector('a[href="http://some.domain.com"]'));
    strictEqual(fragment.querySelectorAll('a[href="http://some.domain.com"]').length, 1);

    div.parentNode.removeChild(div);
});

test('non-added to DOM', function () {
    var link = document.createElement('a');
    var div  = document.createElement('div');

    link.setAttribute('href', 'http://some.domain.com');
    div.appendChild(link);

    ok(div.querySelector('[href="http://some.domain.com"]'));
});

test('javascript protocol', function () {
    var anchor = document.createElement('a');

    anchor.setAttribute('href', 'javascript:performCommand(cmd);');
    document.body.appendChild(anchor);

    ok(document.querySelector('[href="javascript:performCommand(cmd);"]'));

    anchor.parentNode.removeChild(anchor);
});

test('complex selector', function () {
    var link     = document.createElement('a');
    var divOuter = document.createElement('div');
    var divInner = document.createElement('div');

    divOuter.setAttribute('data-id', '123456');
    divInner.className = 'inner';
    link.setAttribute('href', 'http://some.domain.com');
    divOuter.appendChild(divInner);
    divInner.appendChild(link);
    document.body.appendChild(divOuter);

    ok(document.querySelector('div[data-id="123456"] div.inner a[href="http://some.domain.com"]'));

    divOuter.parentNode.removeChild(divOuter);
});

// http://w3c-test.org/dom/nodes/ParentNode-querySelector-All.html
test('special selectors', function () {
    var div = document.createElement('div');

    div.appendChild(document.createElement('null'));
    div.appendChild(document.createElement('undefined'));

    ok(div.querySelector(null));

    /*eslint-disable no-undefined*/
    ok(div.querySelectorAll(undefined));
    /*eslint-enable no-undefined*/
});

test('parameters passed to the native function in its original form', function () {
    checkNativeFunctionArgs('createElement', 'createElement', document);
    checkNativeFunctionArgs('createElementNS', 'createElementNS', document);
    checkNativeFunctionArgs('createDocumentFragment', 'createDocumentFragment', document);
    checkNativeFunctionArgs('elementFromPoint', 'elementFromPoint', document);

    if (document.caretRangeFromPoint)
        checkNativeFunctionArgs('caretRangeFromPoint', 'caretRangeFromPoint', document);

    if (document.caretPositionFromPoint)
        checkNativeFunctionArgs('caretPositionFromPoint', 'caretPositionFromPoint', document);

    checkNativeFunctionArgs('getElementById', 'getElementById', document);
    checkNativeFunctionArgs('getElementsByClassName', 'getElementsByClassName', document);
    checkNativeFunctionArgs('getElementsByName', 'getElementsByName', document);
    checkNativeFunctionArgs('getElementsByTagName', 'getElementsByTagName', document);
    checkNativeFunctionArgs('querySelector', 'querySelector', document);
    checkNativeFunctionArgs('querySelectorAll', 'querySelectorAll', document);
    checkNativeFunctionArgs('addEventListener', 'documentAddEventListener', document);
    checkNativeFunctionArgs('removeEventListener', 'documentRemoveEventListener', document);

    var storedBeforeDocumentCleaned = hammerhead.sandbox.node.doc._beforeDocumentCleaned;
    var storedRestoreDocumentMeths  = nativeMethods.restoreDocumentMeths;

    hammerhead.sandbox.node.doc._beforeDocumentCleaned = nativeMethods.restoreDocumentMeths = function () {
    };

    checkNativeFunctionArgs('close', 'documentClose', document);
    checkNativeFunctionArgs('open', 'documentOpen', document);

    hammerhead.sandbox.node.doc._beforeDocumentCleaned = storedBeforeDocumentCleaned;
    nativeMethods.restoreDocumentMeths                 = storedRestoreDocumentMeths;
});

module('overridden descriptors');

if (nativeMethods.documentDocumentURIGetter) {
    test('document.documentURI', function () {
        var savedParseProxyUrl = urlUtils.parseProxyUrl;

        urlUtils.parseProxyUrl = function () {
            return null;
        };

        strictEqual(document.documentURI, nativeMethods.documentDocumentURIGetter.call(document));

        urlUtils.parseProxyUrl = function () {
            return { destUrl: 'destUrl' };
        };

        strictEqual(document.documentURI, 'destUrl');

        urlUtils.parseProxyUrl = savedParseProxyUrl;
    });
}

test('document.referrer', function () {
    var savedParseProxyUrl = urlUtils.parseProxyUrl;

    urlUtils.parseProxyUrl = function () {
        return null;
    };

    strictEqual(document.referrer, '');

    urlUtils.parseProxyUrl = function () {
        return { destUrl: '123' };
    };

    strictEqual(document.referrer, '123');

    urlUtils.parseProxyUrl = savedParseProxyUrl;
});

test('document.URL', function () {
    strictEqual(document.URL, 'https://example.com/');
});

test('document.domain', function () {
    strictEqual(document.domain, 'example.com');

    document.domain = 'localhost';

    strictEqual(document.domain, 'localhost');
});

test('document.styleSheets (GH-1000)', function () {
    var styleSheetsCollectionLength = document.styleSheets.length;
    var shadowStyleSheet            = document.createElement('style');

    shadowUI.addClass(shadowStyleSheet, 'ui-stylesheet');
    document.body.appendChild(shadowStyleSheet);

    strictEqual(styleSheetsCollectionLength, document.styleSheets.length);

    var styleSheet = document.createElement('style');

    document.body.appendChild(styleSheet);

    strictEqual(styleSheetsCollectionLength + 1, document.styleSheets.length);
    strictEqual(styleSheet, document.styleSheets.item(document.styleSheets.length - 1).ownerNode);

    shadowStyleSheet.parentNode.removeChild(shadowStyleSheet);
    styleSheet.parentNode.removeChild(styleSheet);
});

test('document.all (GH-1046)', function () {
    var allLength = document.all.length;
    var div       = document.createElement('div');
    var shadowDiv = document.createElement('div');

    document.body.appendChild(div);

    var allLengthAfterDivAppended = document.all.length;

    shadowUI.addClass(shadowDiv, 'shadow-div');
    document.body.appendChild(shadowDiv);

    var allLengthAfterShadowDivAdded = document.all.length;

    document.body.removeChild(div);

    var allLengthAfterDivRemoved = document.all.length;

    document.body.removeChild(shadowDiv);

    var allLengthAfterShadowDivRemoved = document.all.length;

    strictEqual(allLengthAfterDivAppended, allLength + 1);
    strictEqual(allLengthAfterShadowDivAdded, allLength + 1);
    strictEqual(allLengthAfterDivRemoved, allLength);
    strictEqual(allLengthAfterShadowDivRemoved, allLength);
});

test('document.cookie', function () {
    document.cookie = 'document=cookie';

    strictEqual(document.cookie, 'document=cookie');
    strictEqual(nativeMethods.documentCookieGetter.call(document).indexOf('document=cookie'), -1);

    settings.get().cookie = '';

    strictEqual(document.cookie, '');
});

test('document.cookie on page with file protocol', function () {
    destLocation.forceLocation('http://localhost/sessionId/file:///path/index.html');

    strictEqual(document.cookie = 'test=123', 'test=123');
    strictEqual(document.cookie, '');

    destLocation.forceLocation('http://localhost/sessionId/https://example.com');
});

module('resgression');

test('document.write for several tags in iframe (T215136)', function () {
    return createTestIframe({ src: getSameDomainPageUrl('../../../data/node-sandbox/iframe-with-doc-write.html') })
        .then(function (iframe) {
            var div = iframe.contentDocument.querySelector('#parent');

            strictEqual(getProperty(div.children, 'length'), 3);
            strictEqual(getProperty(div.parentNode, 'lastElementChild'), div);
        });
});

test('document.write for page html (T190753)', function () {
    var $div            = $('<div>').appendTo('body');
    var $iframe         = $('<iframe id="test5">');
    var script          = 'var a = [1,2], b = 0; window.test = a[b];';
    var processedScript = processScript(script, true).replace(/\s*/g, '');

    processDomMeth($div[0]);
    $div[0].appendChild($iframe[0]);

    ok(script.replace(/\s*/g, '') !== processedScript);

    $iframe[0].contentDocument.write('<html><head><script>' + script + '<' + '/script><head><body></body></html>');

    strictEqual($iframe[0].contentWindow.test, 1);

    var scripts = $iframe[0].contentDocument.getElementsByTagName('script');

    strictEqual(scripts.length, 1);
    strictEqual(scripts[0].text.replace(/\s*/g, ''), processedScript);

    $iframe.remove();
    $div.remove();
});

if (browserUtils.isFirefox || browserUtils.isIE11) {
    asyncTest('override window methods after document.write call (T239109)', function () {
        var iframe = document.createElement('iframe');

        iframe.id                 = 'test_wrapper';
        window.top.onIframeInited = function (window) {
            var iframeIframeSandbox = window['%hammerhead%'].sandbox.iframe;

            iframeIframeSandbox.on(iframeIframeSandbox.RUN_TASK_SCRIPT_EVENT, initIframeTestHandler);
            iframeIframeSandbox.off(iframeIframeSandbox.RUN_TASK_SCRIPT_EVENT, iframeIframeSandbox.iframeReadyToInitHandler);
        };

        iframe.setAttribute('src', 'javascript:\'' +
                                   '   <html><body><script>' +
                                   '       window.top.onIframeInited(window);' +
                                   '       var quote = String.fromCharCode(34);' +
                                   '       if(true){document.write("<iframe id=" + quote + "test_iframe" + quote + "></iframe>");}' +
                                   '       if(true){document.getElementById("test_iframe").contentDocument.write("<body><script>document.body.innerHTML = " + quote + "<div></div>" + quote + ";</s" + "cript></body>");}' +
                                   '   </sc' + 'ript></body></html>' +
                                   '\'');

        document.body.appendChild(iframe);

        var id = setInterval(function () {
            var testIframe = iframe.contentDocument.getElementById('test_iframe');

            if (testIframe && testIframe.contentDocument.body.children[0].tagName.toLowerCase() === 'div') {
                clearInterval(id);
                ok(true);
                iframe.parentNode.removeChild(iframe);

                start();
            }
        }, 10);

    });
}

if (!browserUtils.isFirefox) {
    test('document.write([]) in iframe (T239131)', function () {
        return createTestIframe()
            .then(function (iframe) {
                // NOTE: Some browsers remove their documentElement after a "write([])" call. Previously, if the
                // documentElement was null, "processDomMethodName" failed with the 'Maximum call stack size exceeded' error.
                iframe.contentDocument.write([]);
                ok(true);
                iframe.contentDocument.close();
            });
    });
}

asyncTest('the onDocumentCleaned event is not raised after calling document.write (GH-253)', function () {
    expect(1);

    var iframe  = document.createElement('iframe');
    var src     = getSameDomainPageUrl('../../../data/node-sandbox/iframe-without-document-cleaned-event.html');
    var handler = function (e) {
        window.removeEventListener('message', handler);
        strictEqual(getProperty(e, 'data'), 'success');
        iframe.parentNode.removeChild(iframe);
        start();
    };

    window.addEventListener('message', handler);
    iframe.setAttribute('src', src);
    document.body.appendChild(iframe);
});

asyncTest('document elements are overridden after document.write has been called (GH-253)', function () {
    var iframe = document.createElement('iframe');

    iframe.id  = 'test';
    iframe.src = getSameDomainPageUrl('../../../data/node-sandbox/iframe-override-elems-after-write.html');

    var onMessageHandler = function (e) {
        window.removeEventListener('message', onMessageHandler);

        var rawData = getProperty(e, 'data');
        var data    = rawData instanceof Object ? rawData : JSON.parse(rawData);

        strictEqual(data.length, 3);

        data.forEach(function (testResult) {
            ok(testResult.success, testResult.description);
        });

        iframe.parentNode.removeChild(iframe);

        start();
    };

    window.addEventListener('message', onMessageHandler);

    document.body.appendChild(iframe);
});

test('multiple document.write with html and body tags should not break markup (GH-387)', function () {
    var src = getSameDomainPageUrl('../../../data/node-sandbox/multiple-write-with-html-and-body-tags.html');

    return createTestIframe({ src: src })
        .then(function (iframe) {
            var doc = iframe.contentDocument;

            strictEqual(doc.querySelector('h1').innerHTML, 'Header');
            ok(/Text( text){19}/.test(doc.querySelector('p').innerHTML));
            strictEqual(nativeMethods.anchorTargetGetter.call(doc.querySelector('a')), '_top');
            strictEqual(doc.querySelectorAll('body > table tr > td > a > img').length, 1);
        });
});

test('script error when adding a comment node to DOM (GH-435)', function () {
    var commentNode = document.createComment('');

    document.documentElement.appendChild(commentNode);
    strictEqual(commentNode, document.documentElement.lastChild);

    commentNode.parentNode.removeChild(commentNode);
    ok(!commentNode.parentNode);

    var textNode1 = document.createTextNode('');

    document.documentElement.appendChild(textNode1);
    strictEqual(textNode1, document.documentElement.lastChild);

    textNode1.parentNode.removeChild(textNode1);
    ok(!textNode1.parentNode);

    var documentFragment = document.createDocumentFragment();
    var textNode2        = document.createTextNode('');

    documentFragment.appendChild(textNode2);
    document.documentElement.appendChild(documentFragment);
    strictEqual(textNode2, document.documentElement.lastChild);
    textNode2.parentNode.removeChild(textNode2);
});

test('"permission denied" error inside documentWriter (GH-384)', function () {
    return createTestIframe({ src: getSameDomainPageUrl('../../../data/dom-processor/iframe.html') })
        .then(function (iframe) {
            var iframeDocument = iframe.contentDocument;

            iframeDocument.write('<h1 id="testElement">test</h1>');
            ok(nativeMethods.getElementById.call(iframeDocument, 'testElement'));
        });
});

// NOTE: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8187450/
if (!browserUtils.isIE) {
    test('document.write for same-domain iframe (GH-679)', function () {
        return createTestIframe({ src: getSameDomainPageUrl('../../../data/code-instrumentation/iframe.html') })
            .then(function (iframe) {
                iframe.contentDocument.open();
                iframe.contentDocument.write('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN"><title></title><span></span><script type="text/javascript"><' + '/script>');
                iframe.contentDocument.close();

                strictEqual(getProperty(iframe.contentDocument.childNodes, 'length'), 2);

                iframe.contentDocument.open();
                iframe.contentDocument.write('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN"><title></title><span></span><script type="text/javascript"><' + '/script>');
                iframe.contentDocument.close();

                strictEqual(getProperty(iframe.contentDocument.childNodes, 'length'), 2);
            });
    });
}

test('an iframe should not contain self-removing scripts after document.close (GH-871)', function () {
    return createTestIframe()
        .then(function (iframe) {
            var iframeDocument = iframe.contentDocument;

            iframeDocument.designMode = 'On';
            iframeDocument.open();
            iframeDocument.write('<body style="padding: 0; margin: 0; overflow: hidden;"></body>');
            iframeDocument.close();

            var selfRemovingScripts = nativeMethods.querySelectorAll.call(iframeDocument,
                '.' + SHADOW_UI_CLASSNAME.selfRemovingScript);

            strictEqual(selfRemovingScripts.length, 0);
        });
});

test('should not throw an error when document.defualtView is null (GH-1272)', function () {
    return new Promise(function (resolve, reject) {
        var iframe         = document.createElement('iframe');
        var loadEventCount = 0;

        iframe.id     = 'test' + Date.now();
        iframe.src    = 'javascript:"";';
        iframe.onload = function () {
            var doc = iframe.contentDocument;

            // NOTE: Without wrapping in 'setTimeout' function the error is not reproduced
            setTimeout(function () {
                try {
                    // NOTE: Chrome throw an error after second load
                    if (loadEventCount++ < 2) {
                        doc.open();
                        doc.write('<div>' + loadEventCount + '</div>');
                        doc.close();
                    }
                    else
                        resolve(iframe);
                }
                catch (e) {
                    reject(e);
                }
            }, 100);
        };

        document.body.appendChild(iframe);
    })
        .then(function (iframe) {
            strictEqual(iframe.contentDocument.documentElement.innerText, '2');
            document.body.removeChild(iframe);
        });
});

test('querySelector should return an element if a selector contains the href attribute with hash as a value (GH-922)', function () {
    var testDiv = document.createElement('div');

    testDiv.innerHTML = '<a href="  #/"> Hash link </a>';
    document.body.appendChild(testDiv);

    ok(testDiv['hammerhead|element-processed']);

    var element = document.querySelector('[href="  #/"]');

    ok(element);

    document.body.removeChild(testDiv);
});

if (document.registerElement) {
    test('should not raise an error if processed element is created via non-overriden way and it is locked (GH-1300)', function () {
        var CustomElementConstructor = document.registerElement('custom-element', {
            prototype: {
                __proto__: HTMLElement.prototype
            }
        });
        var customElement1           = new CustomElementConstructor();
        var customElement2           = new CustomElementConstructor();
        var customElement3           = new CustomElementConstructor();

        try {
            Object.preventExtensions(customElement1);
            document.body.appendChild(customElement1);
            ok(true, 'Object.preventExtensions');
        }
        catch (e) {
            ok(false, 'Object.preventExtensions');
        }

        try {
            Object.seal(customElement2);
            document.body.appendChild(customElement2);
            ok(true, 'Object.seal');
        }
        catch (e) {
            ok(false, 'Object.seal');
        }

        try {
            Object.freeze(customElement3);
            document.body.appendChild(customElement3);
            ok(true, 'Object.freeze');
        }

        catch (e) {
            ok(false, 'Object.freeze');
        }

        [customElement1, customElement2, customElement3].forEach(function (element) {
            if (element.parentNode)
                element.parentNode.removeChild(element);
        });
    });
}

test('should reprocess element if it is created in iframe window and it is not frozen (GH-1300)', function () {
    return createTestIframe({ src: getSameDomainPageUrl('../../../data/iframe/simple-iframe.html') })
        .then(function (iframe) {
            var iframeLink = iframe.contentDocument.createElement('a');

            Object.preventExtensions(iframeLink);
            document.body.appendChild(iframeLink);
            strictEqual(iframeLink[INTERNAL_PROPS.processedContext], window);

            iframeLink = iframe.contentDocument.createElement('a');
            Object.seal(iframeLink);
            document.body.appendChild(iframeLink);
            strictEqual(iframeLink[INTERNAL_PROPS.processedContext], window);

            iframeLink = iframe.contentDocument.createElement('a');
            Object.freeze(iframeLink);
            document.body.appendChild(iframeLink);
            strictEqual(iframeLink[INTERNAL_PROPS.processedContext], iframe.contentWindow);
        });
});
