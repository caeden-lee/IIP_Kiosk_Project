// Lost and found report storage - changes made by nick
const db = require('./db');

const VALID_TYPES = new Set(['lost', 'found']);
const VALID_STATUSES = new Set(['new', 'reviewed', 'resolved']);

function trimTo(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

// changes made by nick
function ensureLostFoundTable(callback) {
    const query = `
        CREATE TABLE IF NOT EXISTS lost_found_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_type VARCHAR(20) NOT NULL,
            item_description VARCHAR(255) NOT NULL,
            location_text VARCHAR(255) NOT NULL,
            contact_info VARCHAR(255) NOT NULL,
            details TEXT,
            current_page VARCHAR(120),
            feedback_progress TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_lost_found_status (status),
            INDEX idx_lost_found_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    db.run(query, [], callback);
}

// changes made by nick
function createLostFoundReport(payload, callback) {
    const type = trimTo(payload.type, 20).toLowerCase();
    const item = trimTo(payload.item, 255);
    const location = trimTo(payload.location, 255);
    const contact = trimTo(payload.contact, 255);
    const details = trimTo(payload.details, 1000);
    const currentPage = trimTo(payload.currentPage || payload.activePageId, 120);
    const progress = payload.feedbackProgress
        ? JSON.stringify(payload.feedbackProgress).slice(0, 12000)
        : null;

    if (!VALID_TYPES.has(type)) {
        return callback(new Error('Report type must be lost or found.'));
    }

    if (!item || !location || !contact) {
        return callback(new Error('Item, location, and contact are required.'));
    }

    ensureLostFoundTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        const query = `
            INSERT INTO lost_found_reports
                (report_type, item_description, location_text, contact_info, details, current_page, feedback_progress)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [type, item, location, contact, details, currentPage, progress], function(insertErr) {
            if (insertErr) return callback(insertErr);
            callback(null, { id: this.lastID });
        });
    });
}

// changes made by nick
function listLostFoundReports(callback) {
    ensureLostFoundTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        db.all(`
            SELECT
                id,
                report_type,
                item_description,
                location_text,
                contact_info,
                details,
                current_page,
                feedback_progress,
                status,
                created_at,
                updated_at
            FROM lost_found_reports
            ORDER BY created_at DESC, id DESC
            LIMIT 500
        `, [], callback);
    });
}

// changes made by nick
function updateLostFoundReportStatus(id, status, callback) {
    const numericId = Number.parseInt(id, 10);
    const normalizedStatus = trimTo(status, 20).toLowerCase();

    if (!Number.isInteger(numericId) || numericId <= 0) {
        return callback(new Error('Invalid report id.'));
    }

    if (!VALID_STATUSES.has(normalizedStatus)) {
        return callback(new Error('Status must be new, reviewed, or resolved.'));
    }

    ensureLostFoundTable((tableErr) => {
        if (tableErr) return callback(tableErr);

        db.run(`
            UPDATE lost_found_reports
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [normalizedStatus, numericId], function(updateErr) {
            if (updateErr) return callback(updateErr);
            callback(null, { changes: this.changes });
        });
    });
}

module.exports = {
    createLostFoundReport,
    listLostFoundReports,
    updateLostFoundReportStatus
};
