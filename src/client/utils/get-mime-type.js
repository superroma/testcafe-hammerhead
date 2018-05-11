import { instanceToString } from './dom';

const IS_ARRAY_BUFFER_RE = /^\[object ArrayBuffer]$/i;

// https://mimesniff.spec.whatwg.org/

const IMAGE_TYPE_PATTERNS       = [
    {
        mime:    'image/x-icon',
        pattern: [0x00, 0x00, 0x01, 0x00],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/x-icon',
        pattern: [0x00, 0x00, 0x02, 0x00],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/bmp',
        pattern: [0x42, 0x4D],
        mask:    [0xFF, 0xFF]
    },
    {
        mime:    'image/gif',
        pattern: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/gif',
        pattern: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/webp',
        pattern: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/png',
        pattern: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'image/jpeg',
        pattern: [0xFF, 0xD8, 0xFF],
        mask:    [0xFF, 0xFF, 0xFF]
    }
];
const AUDIO_VIDEO_TYPE_PATTERNS = [
    {
        mime:    'audio/basic',
        pattern: [0x2E, 0x73, 0x6E, 0x64],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'audio/aiff',
        pattern: [0x46, 0x4F, 0x52, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x41, 0x49, 0x46, 0x46],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'audio/mpeg',
        pattern: [0x49, 0x44, 0x33],
        mask:    [0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/ogg',
        pattern: [0x4F, 0x67, 0x67, 0x53, 0x00],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'audio/midi',
        pattern: [0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'video/avi',
        pattern: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'audio/wave',
        pattern: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]
    }
];
const FONT_TYPE_PATTERNS        = [
    {
        mime:    'application/vnd.ms-fontobject',
        pattern: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4C, 0x50],
        mask:    [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF]
    },
    {
        mime:    'application/octet-stream', // TrueType font  does not have an assigned MIME type
        pattern: [0x00, 0x01, 0x00, 0x00],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/octet-stream', // OpenType font  does not have an assigned MIME type
        pattern: [0x4F, 0x54, 0x54, 0x4F],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/octet-stream', // TrueType Collection
        pattern: [0x74, 0x74, 0x63, 0x66],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/font-woff',
        pattern: [0x77, 0x4F, 0x46, 0x46],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    }
];
const ARCHIVE_TYPE_PATTERNS     = [
    {
        mime:    'application/x-gzip',
        pattern: [0x1F, 0x8B, 0x08],
        mask:    [0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/zip',
        pattern: [0x50, 0x4B, 0x03, 0x04],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF]
    },
    {
        mime:    'application/x-rar-compressed',
        pattern: [0x52, 0x61, 0x72, 0x20, 0x1A, 0x07, 0x00],
        mask:    [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    }
];

function isArrayBufferData (array) {
    if (array[0] instanceof ArrayBuffer)
        return true;

    return array[0] && IS_ARRAY_BUFFER_RE.test(instanceToString(array[0]));
}

function isViewData (array) {
    return ArrayBuffer.isView(array[0]);
}

function matchPattern (pattern, data) {
    if (data.length < pattern.pattern.length)
        return false;

    let p          = 0;
    let s          = 0;
    let maskedData = null;

    while (p < pattern.pattern.length) {
        maskedData = data[s] & pattern.mask[p];

        if (maskedData !== pattern.pattern[p])
            return false;

        s++;
        p++;
    }

    return true;
}

function matchMime (patternGroup, data) {
    if (isArrayBufferData(data) || isViewData(data))
        data = data[0];

    let byteArray = new Uint8Array(data);

    for (const pattern of patternGroup) {
        if (matchPattern(pattern, byteArray))
            return pattern.mime;
    }
    byteArray = null;

    return '';
}

export default function (data) {
    return matchMime(IMAGE_TYPE_PATTERNS, data) ||
           matchMime(AUDIO_VIDEO_TYPE_PATTERNS, data) ||
           matchMime(FONT_TYPE_PATTERNS, data) ||
           matchMime(ARCHIVE_TYPE_PATTERNS, data);
}
