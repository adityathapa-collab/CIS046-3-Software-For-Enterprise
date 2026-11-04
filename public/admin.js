/* Admin portal: only works if the server says our session has the "admin" role. */
function addRow(tbodyId, cells) {
    const tr = document.createElement('tr');
    cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;   // textContent (not innerHTML) so log data cannot inject HTML
        tr.appendChild(td);
    });
    document.querySelector('#' + tbodyId + ' tbody').appendChild(tr);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await apiRequest('GET', '/api/admin/logs');
        document.getElementById('sessionCount').textContent = 'Active sessions: ' + data.activeSessions;
        data.users.forEach(u => addRow('userTable', [u.username, u.role, u.stats.solved, u.stats.attempts]));
        data.logs.forEach(l => addRow('logTable', [l.timestamp, l.level, l.message]));
        document.getElementById('adminData').classList.remove('hidden');
    } catch (err) {
        const msg = document.getElementById('adminMsg');
        msg.style.color = 'red';
        msg.textContent = 'Access denied: ' + err.message;
    }
});
