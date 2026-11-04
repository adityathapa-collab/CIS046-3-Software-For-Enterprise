class EnterpriseLogger {
    static logEvent(category, message) {
        console.log(`[${new Date().toISOString()}] [${category.toUpperCase()}] ${message}`);
    }

    static logError(category, error) {
        console.error(`[${new Date().toISOString()}] [ERROR_${category.toUpperCase()}] ${error}`);
    }
}

window.EnterpriseLogger = EnterpriseLogger;
