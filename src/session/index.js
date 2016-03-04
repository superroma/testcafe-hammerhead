import mustache from 'mustache';
import uuid from 'node-uuid';
import { readSync as read } from 'read-file-relative';
import { EventEmitter } from 'events';
import Cookies from './cookies';
import UploadStorage from '../upload/storage';
import COMMAND from './command';
import { parseProxyUrl } from '../utils/url';

// Const
const TASK_TEMPLATE = read('../client/task.js.mustache');

// Session
export default class Session extends EventEmitter {
    constructor (uploadsRoot) {
        super();

        this.uploadStorage = new UploadStorage(uploadsRoot);

        this.id            = Session._generateSessionId();
        this.cookies       = new Cookies();
        this.proxy         = null;
        this.pageLoadCount = 0;
        this.injectable    = {
            scripts: ['/hammerhead.js'],
            styles:  []
        };
    }

    static _generateSessionId () {
        // NOTE: GH-116
        return uuid.v4().substr(0, 3);
    }

    async handleServiceMessage (msg, serverInfo) {
        if (this[msg.cmd])
            return await this[msg.cmd](msg, serverInfo);


        throw new Error('Malformed service message or message handler is not implemented');
    }

    _fillTaskScriptTemplate (serverInfo, isFirstPageLoad, referer, cookie, iframeTaskScriptTemplate, payloadScript) {
        referer = referer === null ? '{{{referer}}}' : referer;
        cookie  = cookie === null ? '{{{cookie}}}' : cookie;

        iframeTaskScriptTemplate = iframeTaskScriptTemplate ===
                                   null ? '{{{iframeTaskScriptTemplate}}}' : iframeTaskScriptTemplate;

        return mustache.render(TASK_TEMPLATE, {
            sessionId:                this.id,
            serviceMsgUrl:            serverInfo.domain + '/messaging',
            ie9FileReaderShimUrl:     serverInfo.domain + '/ie9-file-reader-shim',
            crossDomainPort:          serverInfo.crossDomainPort,
            isFirstPageLoad:          isFirstPageLoad,
            referer:                  referer,
            cookie:                   cookie,
            iframeTaskScriptTemplate: iframeTaskScriptTemplate,
            payloadScript:            payloadScript
        });
    }

    getIframeTaskScriptTemplate (serverInfo) {
        return JSON.stringify(this._fillTaskScriptTemplate(serverInfo, false, null, null, null, this._getIframePayloadScript(true)));
    }

    getTaskScript (referer, cookieUrl, serverInfo, isIframe, withPayload) {
        var cookies       = JSON.stringify(this.cookies.getClientString(cookieUrl));
        var payloadScript = '';

        if (withPayload)
            payloadScript = isIframe ? this._getIframePayloadScript() : this._getPayloadScript();

        var taskScript = this._fillTaskScriptTemplate(serverInfo, this.pageLoadCount === 0, referer,
            cookies, this.getIframeTaskScriptTemplate(serverInfo), payloadScript);

        this.pageLoadCount++;

        return taskScript;
    }

    _getIframePayloadScript (/* iframeWithoutSrc */) {
        throw new Error('Not implemented');
    }

    _getPayloadScript () {
        throw new Error('Not implemented');
    }

    handleFileDownload (/* ctx */) {
        throw new Error('Not implemented');
    }

    handlePageError (/* ctx, err */) {
        throw new Error('Not implemented');
    }

    handleServiceRequestDisconnection (/* msg */) {
        throw new Error('Not implemented');
    }

    getAuthCredentials () {
        throw new Error('Not implemented');
    }
}

// Service message handlers
var ServiceMessages = Session.prototype;

ServiceMessages[COMMAND.setCookie] = function (msg) {
    var parsedUrl = parseProxyUrl(msg.url);
    var cookieUrl = parsedUrl ? parsedUrl.destUrl : msg.url;

    this.cookies.setByClient(cookieUrl, msg.cookie);

    return this.cookies.getClientString(cookieUrl);
};

ServiceMessages[COMMAND.uploadFiles] = async function (msg) {
    return await this.uploadStorage.store(msg.fileNames, msg.data);
};

ServiceMessages[COMMAND.getUploadedFiles] = async function (msg) {
    return await this.uploadStorage.get(msg.filePaths);
};
