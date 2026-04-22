// ============================================================
// DATAEXPORTROUTES.JS - TABLE OF CONTENTS (CTRL+F SEARCHABLE)
// ============================================================
// 
// 1. IMPORTS & CONFIGURATION
//    const express                    - Express framework (DONE BY PRETI)
//    const router                     - Router instance (DONE BY PRETI)
//    const auth                       - Authentication module (DONE BY PRETI)
//    const db                         - Database module (DONE BY PRETI)
//    const fs                         - File system module (DONE BY PRETI)
//    const path                       - Path module (DONE BY PRETI)
//    const archiver                   - ZIP archive library (DONE BY PRETI)
//
// 2. MIDDLEWARE FUNCTIONS
//    function requireDataExportUnlocked() - Check if data export session is unlocked (DONE BY PRETI)
//
// 3. SESSION UNLOCK ROUTES
//    router.post('/unlock'            - Verify password and unlock data export for 30 minutes (DONE BY PRETI)
//
// 4. FEEDBACK EXPORT ROUTES
//    router.get('/feedback/full'      - Export all feedback data (CSV) (DONE BY PRETI)
//    router.get('/feedback/not-archived' - Export not_archived feedback data (CSV) (DONE BY PRETI)
//    router.get('/feedback/archived'  - Export archived feedback data (CSV) (DONE BY PRETI)
//
// 5. PHOTO EXPORT ROUTES
//    router.get('/photos/all'         - Export all photos as ZIP (DONE BY PRETI)
//    router.get('/photos/not-archived' - Export not_archived photos as ZIP (DONE BY PRETI)
//    router.get('/photos/archived'    - Export archived photos as ZIP (DONE BY PRETI)
//
// 6. AUDIT LOG EXPORT ROUTES
//    router.get('/audit-log'          - Export audit logs as CSV (DONE BY PRETI)
//
// 7. HELPER FUNCTIONS - EMAIL DECRYPTION
//    function decryptEmailsInFeedback() - Decrypt all encrypted emails in feedback array (DONE BY PRETI)
//
// 8. HELPER FUNCTIONS - DATA RETRIEVAL
//    function getFeedbackData()       - Get feedback data with archive filter (DONE BY PRETI)
//
// 9. HELPER FUNCTIONS - EXCEL GENERATION
//    async function generateFeedbackExcel() - Generate Excel/CSV file from feedback data (DONE BY PRETI)
//
// 10. HELPER FUNCTIONS - PHOTO EXPORT
//     async function exportPhotos()   - Export photos as ZIP archive (DONE BY PRETI)
//
// 11. UTILITY FUNCTIONS
//     function convertToCSV()         - Convert array of objects to CSV format (DONE BY PRETI)
//     function getTimestamp()         - Get current timestamp for filenames (DONE BY PRETI)
//     function logAudit()             - Log admin actions to audit_logs table (DONE BY PRETI)
//
// 12. MODULE EXPORTS
//     module.exports = router         - Export router (DONE BY PRETI)
//
// ============================================================

const express = require('express');
const router = express.Router();
const auth = require('./auth');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// ==================== 2. MIDDLEWARE FUNCTIONS ====================

// Check if data export is unlocked in session
function requireDataExportUnlocked(req, res, next) {
    console.log('🔍 Data Export Middleware Check:');
    console.log('   - Session exists:', !!req.session);
    console.log('   - Session.user exists:', !!req.session?.user);
    console.log('   - User role:', req.session?.user?.role);
    console.log('   - Export unlocked:', req.session?.data_export_unlocked);
    console.log('   - Unlock time:', req.session?.data_export_unlock_time);
    
    if (!req.session || !req.session.user) {
        console.log('❌ Authentication failed: No session or user');
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    // Check if user has system_admin role
    if (req.session.user.role !== 'system_admin') {
        console.log('❌ Authorization failed: User role is', req.session.user.role);
        return res.status(403).json({ error: 'System Administrator privileges required' });
    }
    
    // Check session unlock (with 30 min timeout)
    if (req.session.data_export_unlocked) {
        const unlockTime = new Date(req.session.data_export_unlock_time);
        const now = new Date();
        const minutesPassed = (now - unlockTime) / (1000 * 60);
        
        console.log('   - Minutes since unlock:', minutesPassed.toFixed(2));
        
        if (minutesPassed < 30) {
            console.log('✅ Data export access granted');
            return next();
        }
        
        console.log('❌ Session expired:', minutesPassed.toFixed(2), 'minutes passed');
    } else {
        console.log('❌ Data export not unlocked');
    }
    
    return res.status(401).json({ error: 'Data export session expired. Please unlock again.' });
}

// ==================== 3. SESSION UNLOCK ROUTES ====================


// POST /api/admin/data-export/unlock
// Verify password and unlock data export for 30 minutes
router.post('/unlock', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        // Verify credentials
        auth.loginUser(username, password, (err, user) => {
            if (err) {
                console.log('❌ Login failed for data export:', username, err.message);
                logAudit('DATA_EXPORT_UNLOCK_FAILED', username, null, null, req);
                return res.status(401).json({ error: 'Invalid password' });
            }
            
            console.log('✅ Login successful for data export:', username, 'Role:', user.role);
            
            if (user.role !== 'system_admin') {
                logAudit('DATA_EXPORT_UNLOCK_DENIED', username, null, null, req);
                return res.status(403).json({ error: 'System Administrator privileges required' });
            }
            
            // Set session flags session should exist from express-session middleware
            if (!req.session) {
                console.error('❌ Session not available! Check express-session middleware configuration');
                return res.status(500).json({ error: 'Server configuration error: sessions not available' });
            }
            
            req.session.data_export_unlocked = true;
            req.session.data_export_unlock_time = new Date().toISOString();
            
            // Explicitly save session before responding
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('❌ Failed to save session:', saveErr);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                
                console.log('✅ Data export unlocked for:', username);
                console.log('✅ Session saved successfully');
                logAudit('DATA_EXPORT_UNLOCKED', username, null, null, req);
                
                res.json({
                    success: true,
                    message: 'Data export unlocked for 30 minutes',
                    expiresIn: 30
                });
            });
        });
    } catch (error) {
        console.error('Error unlocking data export:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== 4. FEEDBACK EXPORT ROUTES ====================

// GET /api/admin/data-export/feedback/full
// Export all feedback (no archive filter) with DECRYPTED emails
router.get('/feedback/full', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_FEEDBACK_FULL', username, 'data_export', null, req);
    
    try {
        const data = await getFeedbackData(null);
        
        // DECRYPT EMAILS before generating Excel
        data.feedback = decryptEmailsInFeedback(data.feedback);
        
        const xlsx = await generateFeedbackExcel(data, 'Full Feedback Export');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=feedback_full_' + getTimestamp() + '.csv');
        res.send(xlsx);
        
        console.log(`✅ Exported ${data.feedback.length} records with decrypted emails`);
    } catch (error) {
        console.error('Error exporting full feedback:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// GET /api/admin/data-export/feedback/not-archived
// Export not_archived feedback only with DECRYPTED emails
router.get('/feedback/not-archived', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_FEEDBACK_NOT_ARCHIVED', username, 'data_export', null, req);
    
    try {
        const data = await getFeedbackData('not_archived');
        
        // DECRYPT EMAILS before generating Excel
        data.feedback = decryptEmailsInFeedback(data.feedback);
        
        const xlsx = await generateFeedbackExcel(data, 'Not Archived Feedback Export');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=feedback_not_archived_' + getTimestamp() + '.csv');
        res.send(xlsx);
        
        console.log(`✅ Exported ${data.feedback.length} records with decrypted emails`);
    } catch (error) {
        console.error('Error exporting not-archived feedback:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// GET /api/admin/data-export/feedback/archived
// Export archived feedback only with DECRYPTED emails
router.get('/feedback/archived', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_FEEDBACK_ARCHIVED', username, 'data_export', null, req);
    
    try {
        const data = await getFeedbackData('archived');
        
        // DECRYPT EMAILS before generating Excel
        data.feedback = decryptEmailsInFeedback(data.feedback);
        
        const xlsx = await generateFeedbackExcel(data, 'Archived Feedback Export');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=feedback_archived_' + getTimestamp() + '.csv');
        res.send(xlsx);
        
        console.log(`✅ Exported ${data.feedback.length} records with decrypted emails`);
    } catch (error) {
        console.error('Error exporting archived feedback:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// ==================== 5. PHOTO EXPORT ROUTES ====================

// GET /api/admin/data-export/photos/all
// Export all photos
router.get('/photos/all', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_PHOTOS_ALL', username, 'data_export', null, req);
    
    try {
        await exportPhotos(res, null, 'All photos', username);
    } catch (error) {
        console.error('Error exporting all photos:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// GET /api/admin/data-export/photos/not-archived
// Export photos for not_archived feedback
router.get('/photos/not-archived', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_PHOTOS_NOT_ARCHIVED', username, 'data_export', null, req);
    
    try {
        await exportPhotos(res, 'not_archived', 'Not archived photos', username);
    } catch (error) {
        console.error('Error exporting not-archived photos:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// GET /api/admin/data-export/photos/archived
// Export photos for archived feedback
router.get('/photos/archived', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_PHOTOS_ARCHIVED', username, 'data_export', null, req);
    
    try {
        await exportPhotos(res, 'archived', 'Archived photos', username);
    } catch (error) {
        console.error('Error exporting archived photos:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// ==================== 6. AUDIT LOG EXPORT ROUTES ====================

// GET /api/admin/data-export/audit-log
// Export audit logs
router.get('/audit-log', requireDataExportUnlocked, async (req, res) => {
    const username = req.session.user.username;
    logAudit('DATA_EXPORT_AUDIT_LOG', username, 'data_export', null, req);
    
    try {
        const query = 'SELECT * FROM audit_logs ORDER BY created_at DESC';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                throw err;
            }
            
            const csv = convertToCSV(rows);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_log_' + getTimestamp() + '.csv');
            res.send(csv);
        });
    } catch (error) {
        console.error('Error exporting audit log:', error);
        res.status(500).json({ error: 'Export failed: ' + error.message });
    }
});

// ==================== 7. HELPER FUNCTIONS - EMAIL DECRYPTION ====================

// Decrypt emails in feedback array
function decryptEmailsInFeedback(feedbackArray) {
    return feedbackArray.map(feedback => {
        if (feedback.email_encrypted && feedback.email_encrypted.trim() !== '') {
            try {
                // Decrypt the email using auth.decryptEmail
                const decryptedEmail = auth.decryptEmail(feedback.email_encrypted);
                
                // Replace encrypted email with decrypted one
                return {
                    ...feedback,
                    email_encrypted: decryptedEmail, // Replace with decrypted
                    email: decryptedEmail // Also set email field
                };
            } catch (error) {
                console.error(`❌ Failed to decrypt email for feedback ${feedback.feedback_id}:`, error.message);
                // Keep encrypted if decryption fails
                return {
                    ...feedback,
                    email_encrypted: '[Decryption Failed]',
                    email: '[Decryption Failed]'
                };
            }
        } else {
            // No email or empty email
            return {
                ...feedback,
                email_encrypted: 'No email provided',
                email: 'No email provided'
            };
        }
    });
}

// ==================== 8. HELPER FUNCTIONS - DATA RETRIEVAL ====================

// Get feedback data with optional archive filter
function getFeedbackData(archiveFilter) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT 
                f.id as feedback_id,
                f.user_id,
                u.name as user_name,
                u.email_encrypted,
                u.visit_count,
                u.created_at as user_created,
                u.last_visit as user_last_visit,
                f.comment,
                f.metadata,
                f.photo_path,
                f.processed_photo_path,
                f.data_retention,
                f.email_sent,
                f.email_sent_at,
                f.admin_notes,
                f.is_active,
                f.archive_status,
                f.created_at as feedback_created
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE f.is_active = 1
        `;
        
        if (archiveFilter) {
            query += ` AND f.archive_status = '${archiveFilter}'`;
        }
        
        query += ' ORDER BY f.created_at DESC';
        
        db.all(query, [], async (err, feedbackRows) => {
            if (err) {
                return reject(err);
            }
            
            // Get all questions
            const questionsQuery = 'SELECT * FROM questions ORDER BY display_order';
            db.all(questionsQuery, [], (err, questions) => {
                if (err) {
                    return reject(err);
                }
                
                // Get all answers
                const answersQuery = `
                    SELECT 
                        fa.feedback_id,
                        fa.question_id,
                        fa.answer_value,
                        q.question_text,
                        q.question_type
                    FROM feedback_answers fa
                    JOIN questions q ON fa.question_id = q.id
                `;
                
                db.all(answersQuery, [], (err, answers) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    // Organize answers by feedback_id
                    const answersByFeedback = {};
                    answers.forEach(answer => {
                        if (!answersByFeedback[answer.feedback_id]) {
                            answersByFeedback[answer.feedback_id] = [];
                        }
                        answersByFeedback[answer.feedback_id].push(answer);
                    });
                    
                    resolve({
                        feedback: feedbackRows,
                        questions: questions,
                        answersByFeedback: answersByFeedback
                    });
                });
            });
        });
    });
}

// Generate Excel file from feedback data

async function generateFeedbackExcel(data, title) {
    // Convert to CSV 
    const rows = [];
    
    // Build headers
    const headers = [
        'Feedback ID',
        'User Name',
        'Email',
        'Visit Count',
        'Comment/Pledge',
        'Data Retention',
        'Photo Path',
        'Processed Photo Path',
        'Email Sent',
        'Email Sent At',
        'Admin Notes',
        'Archive Status',
        'Created At'
    ];
    
    // Add question headers
    data.questions.forEach(q => {
        headers.push(`Q: ${q.question_text}`);
    });
    
    rows.push(headers);
    
    
    data.feedback.forEach(f => {
        const row = [
            f.feedback_id,
            f.user_name,
            f.email_encrypted || 'No email provided', 
            f.visit_count,
            f.comment || 'N/A',
            f.data_retention,
            f.photo_path || 'N/A',
            f.processed_photo_path || 'N/A',
            f.email_sent ? 'Yes' : 'No',
            f.email_sent_at || 'N/A',
            f.admin_notes || 'N/A',
            f.archive_status,
            f.feedback_created
        ];
        
        
        const feedbackAnswers = data.answersByFeedback[f.feedback_id] || [];
        data.questions.forEach(q => {
            const answer = feedbackAnswers.find(a => a.question_id === q.id);
            row.push(answer ? answer.answer_value : 'N/A');
        });
        
        rows.push(row);
    });
    
    return convertToCSV(rows);
}

// Export photos as ZIP
async function exportPhotos(res, archiveFilter, exportName, username) {
    return new Promise((resolve, reject) => {
        // Get feedback with photo paths
        let query = `
            SELECT 
                f.id,
                f.photo_path,
                f.processed_photo_path,
                f.archive_status
            FROM feedback f
            WHERE f.is_active = 1
        `;
        
        if (archiveFilter) {
            query += ` AND f.archive_status = '${archiveFilter}'`;
        }
        
        db.all(query, [], async (err, feedbackRows) => {
            if (err) {
                return reject(err);
            }
            
            const uploadsPath = path.join(__dirname, '../uploads');
            
            // Count photos
            let rawCount = 0;
            let processedCount = 0;
            feedbackRows.forEach(f => {
                if (f.photo_path) rawCount++;
                if (f.processed_photo_path) processedCount++;
            });
            
            // Create readme content
            const readme = `Data Export: ${exportName}
Exported at: ${new Date().toISOString()}
Exported by: ${username} (role: system_admin)

Source directories:
  - uploads/photos/ -> /photos/raw/
  - uploads/processed/ -> /photos/processed/

Filter applied:
  - archive_status: ${archiveFilter || 'all'}

Number of feedback records: ${feedbackRows.length}
Number of photo files (raw): ${rawCount}
Number of photo files (processed): ${processedCount}

Notes:
- Contains personal/user data. Handle according to internal policies.
`;
            
            // Create ZIP archive
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=photos_${archiveFilter || 'all'}_${getTimestamp()}.zip`);
            
            archive.pipe(res);
            
            // Add readme
            archive.append(readme, { name: 'readme.txt' });
            
            // Add photos
            feedbackRows.forEach(f => {
                if (f.photo_path) {
                    const rawPath = path.join(uploadsPath, f.photo_path);
                    if (fs.existsSync(rawPath)) {
                        archive.file(rawPath, { name: `photos/raw/${path.basename(f.photo_path)}` });
                    }
                }
                
                if (f.processed_photo_path) {
                    const processedPath = path.join(uploadsPath, f.processed_photo_path);
                    if (fs.existsSync(processedPath)) {
                        archive.file(processedPath, { name: `photos/processed/${path.basename(f.processed_photo_path)}` });
                    }
                }
            });
            
            archive.finalize();
            resolve();
        });
    });
}

// Convert array of objects to CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    // If first row is array, treat as headers + data
    if (Array.isArray(data[0])) {
        return data.map(row => 
            row.map(cell => 
                `"${String(cell || '').replace(/"/g, '""')}"`
            ).join(',')
        ).join('\n');
    }
    
    // Otherwise treat as array of objects
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => 
            `"${String(row[header] || '').replace(/"/g, '""')}"`
        ).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

// Get timestamp for filenames
function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
}

// Log audit action
function logAudit(action, adminUsername, targetType, targetId, req) {
    const ip = req ? req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress : 'unknown';
    const userAgent = req ? req.headers['user-agent'] : 'unknown';
    
    const query = `
        INSERT INTO audit_logs (action, admin_username, target_type, target_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [action, adminUsername, targetType, targetId, ip, userAgent], (err) => {
        if (err) console.error('Audit log failed:', err);
    });
}

// ==================== 12. MODULE EXPORTS ====================

module.exports = router;
