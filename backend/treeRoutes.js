const express = require('express');
const router = express.Router();

let db;

function setDatabase(database) {
    db = database;
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

        // 2) Get all visitors
        const userQuery = `
            SELECT
                name,
                visit_count,
                created_at
            FROM users
            ORDER BY created_at ASC
        `;

        db.all(userQuery, [], (userErr, rows) => {
            if (userErr) {
                console.error('❌ Tree route DB error:', userErr);
                return res.status(500).json([]);
            }

            const visitors = (rows || []).map(r => {
                const name = String(r.name || '').trim();
                return {
                    name,
                    visit_count: Number(r.visit_count) || 1,
                    created_at: r.created_at,
                    isVip: vipSet.has(name.toLowerCase())
                };
            });

            return res.json(visitors);
        });
    });
});

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
