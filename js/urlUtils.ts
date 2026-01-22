/**
 * Unified URL parameter parsing.
 * Supports both standard query parameters (?lang=de) 
 * and hash-based parameters (/#generator?lang=de).
 */
export function getURLParams(): URLSearchParams {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (hash.includes('?')) {
        const parts = hash.split('?');
        const hashQuery = parts[1];
        const hashParams = new URLSearchParams(hashQuery);
        for (const [key, value] of hashParams) {
            params.set(key, value);
        }
    } else if (hash.includes('&') && !hash.startsWith('#generator') && !hash.startsWith('#builder')) {
        // Fallback for old hash format if it didn't use '?' but '&' (e.g. #generator&lang=de)
        const hashParams = new URLSearchParams(hash.substring(1));
        for (const [key, value] of hashParams) {
            params.set(key, value);
        }
    }

    return params;
}

/**
 * Gets the current page/section from the hash.
 * In /#generator?lang=de, the page is 'generator'.
 */
export function getPageFromHash(): string {
    const hash = window.location.hash.substring(1); // remove #
    if (!hash) return 'generator';

    // Split by ? or &
    return hash.split(/[?&]/)[0] || 'generator';
}
