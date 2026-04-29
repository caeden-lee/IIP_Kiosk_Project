const express = require('express');
const router = express.Router();
const { getBadgeSummary } = require('./emailService');

let db;

function setDatabase(database) {
    db = database;
}

function parseMetadata(metadata) {
    if (!metadata || typeof metadata !== 'string') return {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
}

/**
 * GET /api/tree
 * Returns ARRAY of visitors from users table
 * Adds isVip based on vip_management table (case-insensitive)
 */
router.get('/', (req, res) => {
    if (!db) {
        console.error('❌ TreeRoutes: DB not initialized');
        return res.status(500).json([]);
    }

    // 1) Get ALL VIP names (no is_deleted column anymore)
    const vipQuery = `
        SELECT name
        FROM vip_management
    `;

    db.all(vipQuery, [], (vipErr, vipRows) => {
        if (vipErr) {
            console.error('❌ VIP fetch error:', vipErr);
            return res.status(500).json([]);
        }

        const vipSet = new Set(
            (vipRows || []).map(v => String(v.name || '').trim().toLowerCase()).filter(Boolean)
        );

        // 2) Get each feedback/pledge submission as its own leaf.
        // A returning visitor can therefore grow multiple leaves instead of only updating one user row.
        const leafQuery = `
            SELECT
                f.id AS feedback_id,
                u.name,
                u.visit_count,
                f.created_at,
                f.comment,
                f.metadata
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE f.is_active = 1
            ORDER BY f.created_at ASC, f.id ASC
        `;

        db.all(leafQuery, [], (userErr, rows) => {
            if (userErr) {
                console.error('❌ Tree route DB error:', userErr);
                return res.status(500).json([]);
            }

            return res.json(mapRowsToVisitors(rows || [], vipSet));
        });
    });
});

function mapRowsToVisitors(rows, vipSet) {
    return (rows || []).map(r => {
        const name = String(r.name || '').trim();
        const metadata = parseMetadata(r.metadata);
        const badge = getBadgeSummary({
            pledge: r.comment || metadata.pledge || '',
            pledgeTopic: metadata.pledgeTopic || ''
        });

        return {
            id: r.feedback_id || r.user_id,
            name,
            visit_count: Number(r.visit_count) || 1,
            created_at: r.created_at,
            isVip: vipSet.has(name.toLowerCase()),
            badgeKey: badge.badgeKey,
            badgeName: badge.badgeName,
            badgeColor: badge.badgeColor,
            pledgeTopic: metadata.pledgeTopic || ''
        };
    });
}

/**
 * GET /api/tree/vip-names
 * Returns VIP names from vip_management
 */
router.get('/vip-names', (req, res) => {
    if (!db) {
        console.error('❌ TreeRoutes: DB not initialized');
        return res.status(500).json({ success: false, vipNames: [] });
    }

    const sql = `
        SELECT name
        FROM vip_management
        ORDER BY created_at DESC
    `;

    // IMPORTANT: db.query needs (sql, params, callback)
    db.query(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ VIP names DB error:', err);
            return res.status(500).json({ success: false, vipNames: [] });
        }

        const vipNames = (Array.isArray(rows) ? rows : [])
            .map(r => String(r.name || '').trim())
            .filter(Boolean);

        return res.json({ success: true, vipNames });
    });
});

module.exports = {
    router,
    setDatabase
};
