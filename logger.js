/*
 * Small client-side logger used by app.js.
 * Written by Aditya Thapa (structure suggested with LLM help - edit this note if needed).
 */
class EnterpriseLogger {
    static logEvent(category, message) {
        console.log(`[${new Date().toISOString()}] [${category.toUpperCase()}] ${message}`);
    }

    static logError(category, error) {
        console.error(`[${new Date().toISOString()}] [ERROR_${category.toUpperCase()}] ${error}`);
    }
}

window.EnterpriseLogger = EnterpriseLogger;
