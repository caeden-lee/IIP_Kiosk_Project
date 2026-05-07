// ============================================================
// XY CHANGE SUMMARY (DONE BY XY)
// ============================================================
//
// 1. BADGE DATA FOR DIGITAL TREE
//    const getBadgeSummary            - Import badge summary helper from email service (DONE BY XY)
//    GET /api/tree                    - Include badge summary data for visitor tree leaves (DONE BY XY)
//
// 2. TREE LEAF BEHAVIOR
//    visitor records                  - Supports one visible leaf per feedback submission (DONE BY XY)
//    badge summary fallback           - Aligns skipped/no-topic submissions with Feedback Contributor (DONE BY XY)
//
// 3. YEARLY TREE REVIEW
//    getCurrentTreeYear               - Default live tree to current calendar year (DONE BY XY)
//    GET /api/tree?year=YYYY          - Load a completed tree for a selected year (DONE BY XY)
//    GET /api/tree/years              - Return available years for the year review book (DONE BY XY)
//
// 4. INTERACTIVE LEAF DETAILS
//    GET /api/tree                    - Return pledgeSnippet for click-to-view leaf detail cards (DONE BY XY)
//    privacy-safe displayName         - Show Anonymous visitor unless retention allows public name display (DONE BY XY)
//    privacyLabel                     - Explain whether the visitor name is shown or hidden for privacy (DONE BY XY)
//
// FIND COMMAND
//    rg -n "XY CHANGE SUMMARY|DONE BY XY" frontend backend
// ============================================================

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

function getCurrentTreeYear() {
    return new Date().getFullYear();
}

function parseTreeYear(value) {
    const year = Number(value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
    return year;
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
        const requestedYear = parseTreeYear(req.query.year);
        const treeYear = requestedYear || getCurrentTreeYear();
        const leafQuery = `
            SELECT
                f.id AS feedback_id,
                u.name,
                u.visit_count,
                f.created_at,
                f.comment,
                f.data_retention,
                f.metadata
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE f.is_active = 1
              AND YEAR(f.created_at) = ?
            ORDER BY f.created_at ASC, f.id ASC
        `;

        db.all(leafQuery, [treeYear], (userErr, rows) => {
            if (userErr) {
                console.error('❌ Tree route DB error:', userErr);
                return res.status(500).json([]);
            }

            return res.json(mapRowsToVisitors(rows || [], vipSet));
        });
    });
});

/**
 * GET /api/tree/years
 * Returns yearly tree summary data for the review book.
 */
router.get('/years', (req, res) => {
    if (!db) {
        console.error('❌ TreeRoutes: DB not initialized');
        return res.status(500).json({ success: false, currentYear: getCurrentTreeYear(), years: [] });
    }

    const currentYear = getCurrentTreeYear();
    const sql = `
        SELECT
            YEAR(created_at) AS year,
            COUNT(*) AS leaf_count,
            MIN(created_at) AS first_submission,
            MAX(created_at) AS last_submission
        FROM feedback
        WHERE is_active = 1
        GROUP BY YEAR(created_at)
        ORDER BY year DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Tree years DB error:', err);
            return res.status(500).json({ success: false, currentYear, years: [] });
        }

        const years = (rows || []).map(row => ({
            year: Number(row.year),
            leafCount: Number(row.leaf_count) || 0,
            firstSubmission: row.first_submission,
            lastSubmission: row.last_submission,
            isCurrentYear: Number(row.year) === currentYear
        }));

        if (!years.some(item => item.year === currentYear)) {
            years.unshift({
                year: currentYear,
                leafCount: 0,
                firstSubmission: null,
                lastSubmission: null,
                isCurrentYear: true
            });
        }

        return res.json({ success: true, currentYear, years });
    });
});

function mapRowsToVisitors(rows, vipSet) {
    return (rows || []).map(r => {
        const name = String(r.name || '').trim();
        const metadata = parseMetadata(r.metadata);
        const retention = String(r.data_retention || '').toLowerCase();
        const canShowName = retention === 'longterm' || retention === 'indefinite';
        const displayName = canShowName ? name : 'Anonymous visitor';
        const pledgeText = String(r.comment || metadata.pledge || '').trim();
        const pledgeSnippet = pledgeText.length > 140 ? `${pledgeText.slice(0, 137)}...` : pledgeText;
        const isVip = canShowName && vipSet.has(name.toLowerCase());
        const badge = getBadgeSummary({
            pledge: pledgeText,
            pledgeTopic: metadata.pledgeTopic || ''
        });

        return {
            id: r.feedback_id || r.user_id,
            name: displayName,
            visit_count: Number(r.visit_count) || 1,
            created_at: r.created_at,
            isVip,
            badgeKey: badge.badgeKey,
            badgeName: badge.badgeName,
            badgeColor: badge.badgeColor,
            pledgeTopic: metadata.pledgeTopic || '',
            pledgeSnippet,
            hasPublicName: canShowName,
            privacyLabel: canShowName ? 'Name shown with long-term consent' : 'Name hidden for privacy'
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
