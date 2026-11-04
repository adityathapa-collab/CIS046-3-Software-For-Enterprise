// Global state variables for session and puzzle validation
let activeUser = localStorage.getItem("username");
let correctSol = 0;

// Execute initialization routines upon DOM / Window load context
console.log("[INIT] Initializing Enterprise Client Application...");
console.log("[AUTH] Checking active virtual identity session token...");
console.log("[DEBUG] Current active user from localStorage: " + (activeUser ? activeUser : "None detected"));

/**
 * Session State Verification & UI Rendering Guard
 * Validates whether a virtual identity token exists. If active, bypasses 
 * the login gateway and initializes client-side data fetching routines.
 */
if (activeUser != null && activeUser != "") {
    console.log("[AUTH] Active session verified. Restricting login view and mounting dashboard...");
    
    // DOM Node Manipulation: Toggle visibility states
    document.getElementById("login-div").classList.add("hidden");
    document.getElementById("game-div").classList.remove("hidden");
    document.getElementById("userText").textContent = activeUser;
    
    // Invoke remote interoperability service
    loadBananaApi();
} else {
    console.log("[AUTH] No active session found. Presenting authentication gate.");
    document.getElementById("login-div").classList.remove("hidden");
    document.getElementById("game-div").classList.add("hidden");
}

/**
 * Event Listener: User Authentication Trigger
 * Captures user input, enforces basic validation constraints, persists 
 * the identity to browser storage, and reloads the application context.
 */
document.getElementById("loginBtn").addEventListener("click", function(event) {
    event.preventDefault();
    let uName = document.getElementById("nameBox").value.trim();
    
    console.log("[AUTH_EVENT] Login button triggered. Validating input string...");
    
    if(uName === "") {
        console.warn("[AUTH_WARN] Validation failed: Empty string provided for username.");
        alert("Please enter a valid student username to proceed.");
        return;
    }
    
    console.log("[AUTH_SUCCESS] Persisting virtual identity token for: " + uName);
    localStorage.setItem("username", uName);
    
    // Soft reload to apply session state globally across DOM tree
    location.reload(); 
});

/**
 * Event Listener: Session Termination (Logout Handler)
 * Clears persistent virtual identity tokens and resets application state.
 */
document.getElementById("logoutLink").addEventListener("click", function(e) {
    e.preventDefault();
    console.log("[AUTH_EVENT] Logout requested. Purging localStorage session token...");
    
    localStorage.removeItem("username"); 
    console.log("[AUTH_SUCCESS] Session terminated successfully. Reloading view.");
    location.reload();
});

/**
 * Interoperability Module: Remote API Integration
 * Fetches JSON payload asynchronously from Marc Conrad's UoB Banana API server.
 * Protocol: HTTPS / REST JSON GET Request
 */
function loadBananaApi() {
    console.log("[API_FETCH] Initiating asynchronous request to Marc Conrad remote endpoint...");
    
    fetch('https://marcconrad.com/uob/banana/api.php?out=json', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }
        console.log("[API_SUCCESS] HTTP response received successfully. Parsing JSON payload...");
        return response.json();
    })
    .then(data => {
        console.log("[API_DATA] Puzzle image source loaded: " + data.question);
        console.log("[API_DATA] Solution captured securely in local memory variable.");
        
        // Dynamically bind remote asset to DOM element
        document.getElementById("puzzleImg").src = data.question;
        correctSol = data.solution;
        
        // Extended architectural hooks for event logging and metadata tracing
        // (Maintains pipeline compatibility with downstream components)
    })
    .catch(err => {
        console.error("[API_ERROR] Critical failure during remote resource fetch: " + err);
        document.getElementById("imgContainer").innerHTML = "<p style='color: red;'>Failed to load remote API image. Please check network connection.</p>";
    });
}

/**
 * Event Listener: Puzzle Answer Submission & Validation
 * Compares user numerical input against cached API solution state 
 * and provides dynamic DOM feedback styling.
 */
document.getElementById("submitBtn").addEventListener("click", function() {
    let userAns = document.getElementById("answerInput").value;
    let feedback = document.getElementById("msg");

    console.log("[GAME_EVENT] Answer submission intercepted. User input: " + userAns);
    console.log("[GAME_CHECK] Evaluating against expected solution: " + correctSol);

    if(userAns === "") {
        feedback.style.color = "orange";
        feedback.innerHTML = "Please enter a numerical answer before checking.";
        return;
    }

    if(Number(userAns) === Number(correctSol)) {
        console.log("[GAME_RESULT] Validation passed: Correct answer.");
        feedback.style.color = "blue";
        feedback.innerHTML = "Correct!! Good job, enterprise solution verified.";
    } else {
        console.log("[GAME_RESULT] Validation failed: Incorrect answer.");
        feedback.style.color = "red";
        feedback.innerHTML = "Wrong answer, try again.";
    }
});