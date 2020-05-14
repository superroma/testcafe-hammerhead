import debug from 'debug';
import RequestPipelineContext from '../request-pipeline/context';

debug.formatters.i = (ctx: RequestPipelineContext): string => {
    const stringifiedInfoArr: string[] = [];
    const contentInfo = ctx.contentInfo;

    if (ctx.isPage)
        stringifiedInfoArr.push('isPage');

    if (ctx.isIframe)
        stringifiedInfoArr.push('isIframe');

    if (ctx.isAjax)
        stringifiedInfoArr.push('isAjax');

    if (ctx.isWebSocket)
        stringifiedInfoArr.push('isWebSocket');

    if (contentInfo.isCSS)
        stringifiedInfoArr.push('isCSS');

    if (contentInfo.isScript)
        stringifiedInfoArr.push('isScript');

    if (contentInfo.isManifest)
        stringifiedInfoArr.push('isManifest');

    if (contentInfo.isFileDownload)
        stringifiedInfoArr.push('isFileDownload');

    if (contentInfo.isNotModified)
        stringifiedInfoArr.push('isNotModified');

    if (contentInfo.isRedirect)
        stringifiedInfoArr.push('isRedirect');

    if (contentInfo.isIframeWithImageSrc)
        stringifiedInfoArr.push('isIframeWithImageSrc');

    if (contentInfo.charset)
        stringifiedInfoArr.push('charset: ' + contentInfo.charset.get());

    stringifiedInfoArr.push('encoding: ' + contentInfo.encoding);
    stringifiedInfoArr.push('requireProcessing: ' + contentInfo.requireProcessing);

    return `{ ${stringifiedInfoArr.join(', ')} }`;
};

export const hammerhead        = debug('hammerhead');
export const proxyLogger       = hammerhead.extend('proxy');
export const destinationLogger = hammerhead.extend('destination');
export const serviceMsgsLogger = hammerhead.extend('service-message');
