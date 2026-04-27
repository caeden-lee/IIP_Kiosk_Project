const express = require('express');
const router = express.Router();
const db = require('./db');

const CAMPAIGN_GOAL = Number(process.env.PULSE_CAMPAIGN_GOAL || 100);

function queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

function queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row || {});
        });
    });
}

function parseMetadata(metadata) {
    if (!metadata || typeof metadata !== 'string') return {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
}

function topicToBadge(topic, hasPledge) {
    const map = {
        'climate-change': 'Climate Champion',
        'renewable-energy': 'Renewable Innovator',
        'sustainable-living': 'Sustainable Living Advocate',
        'ocean-conservation': 'Ocean Guardian',
        'ethical-governance': 'Governance Guardian',
        'community-impact': 'Social Champion'
    };

    if (topic && map[topic]) return map[topic];
    return hasPledge ? 'Commitment Champion' : 'Feedback Contributor';
}

function anonymizePledge(row, index) {
    const metadata = parseMetadata(row.metadata);
    return {
        id: row.id,
        pledge: row.comment || '',
        created_at: row.created_at,
        displayName: `Visitor ${index + 1}`,
        badge: topicToBadge(metadata.pledgeTopic, Boolean(row.comment))
    };
}

function buildBadgeEarners(rows) {
    const earners = new Map();

    rows.forEach((row) => {
        const name = String(row.name || 'Anonymous Visitor').trim() || 'Anonymous Visitor';
        const metadata = parseMetadata(row.metadata);
        const hasPledge = Boolean(row.comment && String(row.comment).trim());
        const badges = ['Feedback Contributor'];

        if (hasPledge) {
            badges.push(topicToBadge(metadata.pledgeTopic, true));
        }

        if (!earners.has(name)) {
            earners.set(name, {
                name,
                badgeCount: 0,
                latestBadge: badges[badges.length - 1],
                lastSeen: row.created_at
            });
        }

        const earner = earners.get(name);
        earner.badgeCount += badges.length;

        if (!earner.lastSeen || new Date(row.created_at) > new Date(earner.lastSeen)) {
            earner.latestBadge = badges[badges.length - 1];
            earner.lastSeen = row.created_at;
        }
    });

    return Array.from(earners.values())
        .sort((a, b) => b.badgeCount - a.badgeCount || new Date(b.lastSeen) - new Date(a.lastSeen))
        .slice(0, 5);
}

function buildBadgeBreakdown(rows) {
    const counts = new Map();

    rows.forEach((row) => {
        const metadata = parseMetadata(row.metadata);
        const badge = topicToBadge(metadata.pledgeTopic, Boolean(row.comment));
        counts.set(badge, (counts.get(badge) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([badge, count]) => ({ badge, count }))
        .sort((a, b) => b.count - a.count);
}

router.get('/summary', async (req, res) => {
    try {
        const [today, month, total, recentPledges, badgeRows, treeVisitors] = await Promise.all([
            queryOne(`
                SELECT COUNT(*) AS count
                FROM feedback
                WHERE is_active = 1
                  AND archive_status = 'not_archived'
                  AND comment IS NOT NULL
                  AND comment != ''
                  AND DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00'))
            `),
            queryOne(`
                SELECT COUNT(*) AS count
                FROM feedback
                WHERE is_active = 1
                  AND archive_status = 'not_archived'
                  AND comment IS NOT NULL
                  AND comment != ''
                  AND YEAR(CONVERT_TZ(created_at, '+00:00', '+08:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+08:00'))
                  AND MONTH(CONVERT_TZ(created_at, '+00:00', '+08:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+08:00'))
            `),
            queryOne(`
                SELECT COUNT(*) AS count
                FROM feedback
                WHERE is_active = 1
                  AND archive_status = 'not_archived'
                  AND comment IS NOT NULL
                  AND comment != ''
            `),
            queryAll(`
                SELECT id, comment, metadata, created_at
                FROM feedback
                WHERE is_active = 1
                  AND archive_status = 'not_archived'
                  AND comment IS NOT NULL
                  AND comment != ''
                ORDER BY created_at DESC
                LIMIT 8
            `),
            queryAll(`
                SELECT u.name, f.comment, f.metadata, f.created_at
                FROM feedback f
                JOIN users u ON f.user_id = u.id
                WHERE f.is_active = 1
                  AND f.archive_status = 'not_archived'
                ORDER BY f.created_at DESC
                LIMIT 300
            `),
            queryAll(`
                SELECT u.name, u.visit_count, u.created_at
                FROM users u
                ORDER BY u.created_at DESC
                LIMIT 80
            `)
        ]);

        const pledgesThisMonth = Number(month.count || 0);
        const goal = Number.isFinite(CAMPAIGN_GOAL) && CAMPAIGN_GOAL > 0 ? CAMPAIGN_GOAL : 100;
        const progressPercent = Math.min(100, Math.round((pledgesThisMonth / goal) * 100));

        res.json({
            success: true,
            generatedAt: new Date().toISOString(),
            stats: {
                pledgesToday: Number(today.count || 0),
                pledgesThisMonth,
                totalPledges: Number(total.count || 0),
                campaignGoal: goal,
                progressPercent,
                treeLeaves: treeVisitors.length
            },
            newestPledges: recentPledges.map(anonymizePledge),
            topBadgeEarners: buildBadgeEarners(badgeRows),
            badgeBreakdown: buildBadgeBreakdown(badgeRows),
            treeVisitors: treeVisitors.map((visitor, index) => ({
                name: visitor.name || `Visitor ${index + 1}`,
                visit_count: Number(visitor.visit_count) || 1,
                created_at: visitor.created_at
            }))
        });
    } catch (error) {
        console.error('Pulse summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load school pulse data'
        });
    }
});

module.exports = router;
