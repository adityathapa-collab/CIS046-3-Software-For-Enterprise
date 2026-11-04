const $ = id => document.getElementById(id);

let correctSol = null;      // solution returned by the Banana API for the current puzzle
let answered = false;       // stops one puzzle being scored more than once

/* ---------- UI helpers ---------- */
function setMessage(el, text, colour) {
    el.style.color = colour;
    el.textContent = text;
}

function renderStats(stats) {
    $('stats').textContent =
        `Solved: ${stats.solved} | Attempts: ${stats.attempts} | Streak: ${stats.streak} | Best streak: ${stats.bestStreak}`;
}

function showGame(user) {
    $('login-div').classList.add('hidden');
    $('game-div').classList.remove('hidden');
    $('userText').textContent = user.username;
    $('adminLinkWrap').classList.toggle('hidden', user.role !== 'admin');
    renderStats(user.stats);
    loadPuzzle();
}

function showLogin() {
    $('game-div').classList.add('hidden');
    $('login-div').classList.remove('hidden');
}

/* ---------- puzzle loading (interoperability with the Banana API) ---------- */
async function loadPuzzle() {
    answered = false;
    $('answerInput').value = '';
    $('msg').textContent = '';
    $('puzzleImg').src = '';
    try {
        const data = await fetchBananaPuzzle();
        $('puzzleImg').src = data.question;
        correctSol = data.solution;
        EnterpriseLogger.logEvent('api', 'Puzzle loaded');
    } catch (err) {
        EnterpriseLogger.logError('api', err);
        setMessage($('msg'), 'Failed to load puzzle from the Banana API. Check your connection.', 'red');
    }
}

/* ---------- authentication events (virtual identity) ---------- */
async function authenticate(path) {
    const username = $('nameBox').value.trim();
    const password = $('passBox').value;
    if (!username || !password) {
        setMessage($('authMsg'), 'Please enter a username and password.', 'orange');
        return;
    }
    try {
        const user = await apiRequest('POST', path, { username, password });
        $('passBox').value = '';
        $('authMsg').textContent = '';
        EnterpriseLogger.logEvent('auth', `${path} succeeded for ${user.username}`);
        showGame(user);
    } catch (err) {
        EnterpriseLogger.logError('auth', err.message);
        setMessage($('authMsg'), err.message, 'red');
    }
}

$('loginBtn').addEventListener('click', () => authenticate('/api/login'));
$('registerBtn').addEventListener('click', () => authenticate('/api/register'));
$('passBox').addEventListener('keydown', e => { if (e.key === 'Enter') authenticate('/api/login'); });

$('logoutLink').addEventListener('click', async e => {
    e.preventDefault();
    try { await apiRequest('POST', '/api/logout'); } catch (err) { /* already logged out */ }
    EnterpriseLogger.logEvent('auth', 'Logged out');
    showLogin();
});

/* ---------- game events ---------- */
async function checkAnswer() {
    const value = $('answerInput').value;
    if (value === '') {
        setMessage($('msg'), 'Please enter a numerical answer first.', 'orange');
        return;
    }
    if (answered) {
        setMessage($('msg'), 'Already answered - press Next Puzzle.', 'orange');
        return;
    }

    const correct = Number(value) === Number(correctSol);
    EnterpriseLogger.logEvent('game', `Answer ${value} is ${correct ? 'correct' : 'wrong'}`);

    if (correct) {
        answered = true;
        setMessage($('msg'), 'Correct! Good job.', 'blue');
    } else {
        setMessage($('msg'), 'Wrong answer, try again.', 'red');
    }

    try {   // report the result to OUR server so it can keep the player's stats
        const result = await apiRequest('POST', '/api/result', { correct });
        renderStats(result.stats);
    } catch (err) {
        EnterpriseLogger.logError('game', err.message);
        if (/session/i.test(err.message)) showLogin();   // session expired
    }
}

$('submitBtn').addEventListener('click', checkAnswer);
$('answerInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
$('nextBtn').addEventListener('click', loadPuzzle);

/* ---------- start-up event: is there already a valid session cookie? ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    EnterpriseLogger.logEvent('init', 'Checking for an existing session cookie...');
    try {
        const user = await apiRequest('GET', '/api/me');
        showGame(user);
    } catch (err) {
        showLogin();
    }
});
