import trim from '../../utils/string-trim';

const COOKIE_PAIR_REGEX        = /^((?:=)?([^=;]*)\s*=\s*)?([^\n\r\0]*)/;
const TRAILING_SEMICOLON_REGEX = /;+$/;
const FIX_COOKIE_DATE          = /((?:\s|,)[0-9]{1,2})(?:\s|-)([A-Za-z]{3})(?:\s|-)([0-9]{4}\s)/;

export function parse (str) {
    str = trim(str);

    const trailingSemicolonCheck = TRAILING_SEMICOLON_REGEX.exec(str);

    if (trailingSemicolonCheck)
        str = str.slice(0, trailingSemicolonCheck.index);

    const firstSemicolonIdx     = str.indexOf(';');
    const keyValueString        = firstSemicolonIdx > -1 ? str.substr(0, firstSemicolonIdx) : str;
    const keyValueParsingResult = COOKIE_PAIR_REGEX.exec(keyValueString);

    if (!keyValueParsingResult)
        return null;

    const parsedCookie = {
        key:   keyValueParsingResult[1] ? trim(keyValueParsingResult[2]) : '',
        value: trim(keyValueParsingResult[3])
    };

    if (firstSemicolonIdx === -1)
        return parsedCookie;

    const attributesString = trim(str.slice(firstSemicolonIdx).replace(/^\s*;\s*/, ''));

    if (attributesString.length === 0)
        return parsedCookie;

    const attrValStrings = attributesString.split(/\s*;\s*/);

    while (attrValStrings.length) {
        const attrValueStr = attrValStrings.shift();
        const separatorIdx = attrValueStr.indexOf('=');
        let key            = null;
        let value          = null;
        let date           = null;

        if (separatorIdx === -1)
            key = attrValueStr;
        else {
            key   = attrValueStr.substr(0, separatorIdx);
            value = trim(attrValueStr.substr(separatorIdx + 1));
        }

        key = trim(key.toLowerCase());

        switch (key) {
            case 'expires':
                value = value.replace(FIX_COOKIE_DATE, '$1 $2 $3');
                date  = getUTCDate(Date.parse(value));

                if (date)
                    parsedCookie.expires = date;

                break;

            case 'max-age':
                parsedCookie.maxAge = value;
                break;

            case 'path':
                parsedCookie.path = value;
                break;

            case 'secure':
                parsedCookie.secure = true;
                break;

            case 'httponly':
                parsedCookie.httpOnly = true;
                break;

            case 'domain':
                // NOTE: Remove leading '.'.
                parsedCookie.domain = trim(value.replace(/^\./, ''));
                break;

            default:
                break;
        }
    }

    return parsedCookie;
}

export function formatClientString (parsedCookie) {
    // eslint-disable-next-line no-restricted-properties
    let cookieStr = parsedCookie.value || '';

    if (parsedCookie.key !== '')
        cookieStr = parsedCookie.key + '=' + cookieStr;

    return cookieStr;
}

export function domainMatch (currentDomain, cookieDomain) {
    currentDomain = currentDomain.toLowerCase();
    cookieDomain  = cookieDomain.toLowerCase();

    if (currentDomain === cookieDomain)
        return true;

    const cookieDomainIdx = currentDomain.indexOf(cookieDomain);

    return cookieDomainIdx > 0 &&
           currentDomain.length === cookieDomain.length + cookieDomainIdx &&
           currentDomain.charAt(cookieDomainIdx - 1) === '.';
}

export function pathMatch (currentPath, cookiePath) {
    if (currentPath === cookiePath)
        return true;

    return currentPath.length > cookiePath.length && currentPath.indexOf(cookiePath) === 0 &&
           (cookiePath.charAt(cookiePath.length - 1) === '/' || currentPath.charAt(cookiePath.length) === '/');
}

export function getUTCDate (timestamp) {
    if (!arguments.length)
        timestamp = Date.now();
    else if (isNaN(timestamp))
        return null;

    // NOTE: remove milliseconds
    timestamp = Math.floor(timestamp / 1000) * 1000;

    return new Date(timestamp);
}
