class EnterpriseLogger {
    static logEvent(category, message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${category.toUpperCase()}] ${message}`);
    }

    static logError(category, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR_${category.toUpperCase()}] ${error}`);
    }
}

// Export logger utility for modular scope if needed
window.EnterpriseLogger = EnterpriseLogger;