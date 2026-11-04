const API_ENDPOINT = 'https://marcconrad.com/uob/banana/api.php?out=json';

/**
 * Asynchronously fetches the puzzle data from the remote endpoint.
 * @returns {Promise<Object>} Resolves with the puzzle question URL and solution.
 */
async function fetchBananaPuzzle() {
    console.log("[API_SERVICE] Dispatching asynchronous GET request to remote endpoint...");
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Network response error: ${response.statusText} (Code: ${response.status})`);
        }

        const data = await response.json();
        console.log("[API_SERVICE] Payload successfully parsed. Question URL: " + data.question);
        return data;

    } catch (error) {
        console.error("[API_SERVICE] Critical failure fetching remote resource: ", error);
        throw error;
    }
}