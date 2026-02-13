const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    try {
        const statsPath = path.join(process.cwd(), 'data', 'stats.json');
        
        try {
            const data = await fs.readFile(statsPath, 'utf8');
            const stats = JSON.parse(data);
            return res.status(200).json({
                success: true,
                totalSites: stats.totalSites || 0,
                totalCookies: stats.totalCookies || 0
            });
        } catch {
            return res.status(200).json({
                success: true,
                totalSites: 0,
                totalCookies: 0
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
