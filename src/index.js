((_window) => {
    const invalidProtocolRegex = /^([^\w]*)(javascript|data|vbscript)/im;
    const htmlEntitiesRegex = /&#(\w+)(^\w|;)?/g;
    const htmlCtrlEntityRegex = /&(newline|tab);/gi;
    const ctrlCharactersRegex = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
    const urlSchemeRegex = /^.+(:|&colon;)/gim;
    const whitespaceEscapeCharsRegex = /(\\|%5[cC])((%(6[eE]|72|74))|[nrt])/g;
    const relativeFirstCharacters = [".", "/"];
    const BLANK_URL = "about:blank";

    function isRelativeUrlWithoutProtocol(url) {
        return relativeFirstCharacters.indexOf(url[0]) > -1;
    }

    function decodeHtmlCharacters(str) {
        let removedNullByte = str.replace(ctrlCharactersRegex, "");
        return removedNullByte.replace(htmlEntitiesRegex, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    function decodeURI(uri) {
        try {
            return decodeURIComponent(uri);
        } catch (e) {
            return uri;
        }
    }

    _window.sanitizeUrl = function (url) {
        if (!url) {
            return BLANK_URL;
        }
        let decodedUrl = decodeURI(url.trim());
        let charsToDecode;
        do {
            decodedUrl = decodeHtmlCharacters(decodedUrl)
                .replace(htmlCtrlEntityRegex, "")
                .replace(ctrlCharactersRegex, "")
                .replace(whitespaceEscapeCharsRegex, "")
                .trim();
            decodedUrl = decodeURI(decodedUrl);
            charsToDecode =
                decodedUrl.match(ctrlCharactersRegex) ||
                decodedUrl.match(htmlEntitiesRegex) ||
                decodedUrl.match(htmlCtrlEntityRegex) ||
                decodedUrl.match(whitespaceEscapeCharsRegex);
        } while (charsToDecode && charsToDecode.length > 0);

        let sanitizedUrl = decodedUrl;
        if (!sanitizedUrl) {
            return BLANK_URL;
        }
        if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
            return sanitizedUrl;
        }
        let trimmedUrl = sanitizedUrl.trimStart();
        let urlSchemeParseResults = trimmedUrl.match(urlSchemeRegex);
        if (!urlSchemeParseResults) {
            return sanitizedUrl;
        }
        let urlScheme = urlSchemeParseResults[0].toLowerCase().trim();
        if (invalidProtocolRegex.test(urlScheme)) {
            return BLANK_URL;
        }
        let backSanitized = trimmedUrl.replace(/\\/g, "/");
        if (urlScheme === "mailto:" || urlScheme.includes("://")) {
            return backSanitized;
        }
        if (urlScheme === "http:" || urlScheme === "https:") {
            if (!isValidUrl(backSanitized)) {
                return BLANK_URL;
            }
            let url = new URL(backSanitized);
            url.protocol = url.protocol.toLowerCase();
            url.hostname = url.hostname.toLowerCase();
            return url.toString();
        }
        return backSanitized;
    }
})(window);
