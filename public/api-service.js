const BANANA_API = 'https://marcconrad.com/uob/banana/api.php?out=json';

/**
 * Interoperability with a THIRD-PARTY web service (different server, different
 * organisation). Protocol: HTTPS, REST-style GET, JSON payload.
 * Resolves to { question: <image url>, solution: <number> }.
 */
async function fetchBananaPuzzle() {
    EnterpriseLogger.logEvent('api', 'GET ' + BANANA_API);
    const response = await fetch(BANANA_API, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
        throw new Error(`Banana API error: HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * Interoperability with OUR OWN backend (Express server, JSON over HTTP).
 * The session cookie is attached automatically by the browser (same origin).
 */
async function apiRequest(method, url, body) {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
}
