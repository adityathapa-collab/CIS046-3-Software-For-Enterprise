// app.js - handling client side behavior and API interoperability
// TODO: check async error handling before final build

let activeUser = localStorage.getItem("username");
console.log("current active user session: " + activeUser); // debug log

if (activeUser != null && activeUser != "") {
    document.getElementById("login-div").classList.add("hidden");
    document.getElementById("game-div").classList.remove("hidden");
    document.getElementById("userText").textContent = activeUser;
    loadBananaApi();
}

// login button event
document.getElementById("loginBtn").addEventListener("click", function() {
    let uName = document.getElementById("nameBox").value;
    if(uName == "") {
        alert("type something pls");
        return;
    }
    localStorage.setItem("username", uName);
    location.reload(); 
});

// logout link click event
document.getElementById("logoutLink").addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.removeItem("username"); 
    location.reload();
});

// Interoperability - fetching api from marc conrad server
let correctSol = 0;
function loadBananaApi() {
    fetch('https://marcconrad.com/uob/banana/api.php?out=json')
        .then(response => response.json())
        .then(data => {
            document.getElementById("puzzleImg").src = data.question;
            correctSol = data.solution;
        })
        .catch(err => {
            console.log("api error: " + err);
            document.getElementById("imgContainer").innerHTML = "Failed to load API image.";
        });
}

// event listener for submitting answer
document.getElementById("submitBtn").addEventListener("click", function() {
    let userAns = document.getElementById("answerInput").value;
    let feedback = document.getElementById("msg");

    if(userAns == correctSol) {
        feedback.style.color = "blue";
        feedback.innerHTML = "Correct!! Good job";
    } else {
        feedback.style.color = "red";
        feedback.innerHTML = "Wrong answer, try again.";
    }
});