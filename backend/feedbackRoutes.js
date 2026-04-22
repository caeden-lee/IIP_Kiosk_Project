// ============================================================
// FEEDBACKROUTES.JS - TABLE OF CONTENTS (CTRL+F SEARCHABLE)
// ============================================================
// 
// 1. DEPENDENCIES & CONFIGURATION
//    const express                    - Express framework import (DONE BY PRETI)
//    const router                     - Express router instance (DONE BY PRETI)
//    const path                       - Path utilities (DONE BY PRETI)
//    const fs                         - File system operations (DONE BY PRETI)
//    const db                         - Database connection (DONE BY PRETI)
//    const emailService               - Email service utilities (DONE BY NADH)
//    const auth                       - Authentication and encryption utilities (DONE BY PRETI)
//
// 2. DIRECTORY SETUP
//    const uploadsDir                 - Upload directory for photos (DONE BY PRETI)
//    const processedDir               - Directory for processed photos (DONE BY PRETI)
//
// 3. QUESTION MANAGEMENT ROUTES
//    router.get('/questions'          - Get active questions for feedback form (DONE BY PRETI)
//
// 4. PHOTO UPLOAD ROUTES
//    router.post('/save-photo'        - Upload and save raw photo (DONE BY PRETI)
//    router.post('/save-processed-photo' - Save processed photo with overlay (DONE BY PRETI)
//
// 5. FEEDBACK SUBMISSION ROUTES
//    router.post('/submit-feedback'   - Submit complete feedback with retention and email (DONE BY PRETI)
//    router.post('/send-email'        - Send email endpoint (manual) (DONE BY PRETI)
//    router.post('/feedback/:id/retry-email' - Retry sending email for feedback entry (DONE BY PRETI)
//    router.get('/test-email'         - Test email endpoint (DONE BY PRETI)
//    router.get('/email-status'       - Check email service status (DONE BY PRETI)
//
// 6. DATABASE OPERATIONS
//    function isValidEmail()          - Validate email format (DONE BY PRETI)
//    function saveFeedbackToDatabase() - Save feedback to database with encrypted email (DONE BY PRETI)
//    function saveFeedbackRecord()    - Save feedback record (nested function) (DONE BY PRETI)
//    function saveQuestionAnswers()   - Save question answers (nested function) (DONE BY PRETI)
//
// 7. OVERLAY MANAGEMENT ROUTES
//    router.get('/overlays'           - Get all available overlay themes (DONE BY PRETI)
//
// 8. FORM UI CONFIGURATION
//    router.get('/form-ui'            - Get form UI settings (DONE BY NADH)
//
// 9. UTILITY ENDPOINTS
//    router.get('/test-db'            - Test database connection endpoint (DONE BY PRETI)
//    router.get('/'                   - Root endpoint for feedback routes (DONE BY PRETI)
//    router.get('/countdown-timer'    - Get countdown timer setting for photo capture (DONE BY BERNISSA)


const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('./db'); // Import database connection
const emailService = require('./emailService');
const auth = require('./auth');

// ==================== 1. DIRECTORY SETUP ====================
// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'photos');
const processedDir = path.join(__dirname, '..', 'uploads', 'processed');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}
if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
    console.log('Created processed directory:', processedDir);
}

// ==================== 2. QUESTION MANAGEMENT ROUTES ====================
// Get active questions for feedback form
router.get('/questions', (req, res) => {
    console.log('📋 Fetching active questions for feedback form...');
    
    const query = `
        SELECT 
            q.id,
            q.question_text,
            q.question_type,
            q.is_required,
            q.display_order,
            q.is_active,
            qo.id as option_id,
            qo.option_label,
            qo.display_order as option_order
        FROM questions q
        LEFT JOIN question_options qo ON q.id = qo.question_id
        WHERE q.is_active = 1
        ORDER BY q.display_order ASC, qo.display_order ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching questions:', err);
            return res.json({
                success: true,
                questions: []
            });
        }
        
        // Group questions and their options
        const questionsMap = new Map();
        
        rows.forEach(row => {
            if (!questionsMap.has(row.id)) {
                questionsMap.set(row.id, {
                    id: row.id,
                    question_text: row.question_text,
                    question_type: row.question_type,
                    is_required: row.is_required === 1,
                    display_order: row.display_order,
                    is_active: row.is_active === 1,
                    options: []
                });
            }
            
            // Add option if it exists (for choice questions)
            if (row.option_id && row.option_label) {
                const question = questionsMap.get(row.id);
                question.options.push({
                    id: row.option_id,
                    option_label: row.option_label,
                    display_order: row.option_order
                });
            }
        });
        
        const questions = Array.from(questionsMap.values());
        
        console.log(`✅ Found ${questions.length} active questions for feedback form`);
        
        res.json({
            success: true,
            questions: questions
        });
    });
});

// ==================== 3. PHOTO UPLOAD ROUTES ====================
// Upload and save raw photo
router.post('/save-photo', (req, res) => {
    try {
        const { photo, userName, device } = req.body;
        
        if (!photo) {
            return res.status(400).json({ error: 'No photo data provided' });
        }

        // Convert base64 to buffer
        const base64Data = photo.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename with user name, device, and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeUserName = userName ? userName.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous';
        const filename = `${safeUserName}_${device}_${timestamp}.png`;
        const filepath = path.join(uploadsDir, filename);

        // Save the file
        fs.writeFileSync(filepath, buffer);

        console.log(`Photo saved to: ${filepath}`);
        
        res.json({ 
            success: true, 
            message: 'Photo saved successfully',
            filename: filename,
            photoId: filename,
            filepath: filepath,
            device: device
        });
    } catch (error) {
        console.error('Error saving photo:', error);
        res.status(500).json({ error: 'Failed to save photo' });
    }
});

// Save processed photo with overlay
router.post('/save-processed-photo', (req, res) => {
    try {
        const { photo, userName, device, theme } = req.body;
        
        if (!photo) {
            return res.status(400).json({ error: 'No processed photo data provided' });
        }

        // Convert base64 to buffer
        const base64Data = photo.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename for processed photo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeUserName = userName ? userName.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous';
        const filename = `${safeUserName}_${device}_${theme}_processed_${timestamp}.png`;
        const filepath = path.join(processedDir, filename);

        // Save the processed file
        fs.writeFileSync(filepath, buffer);

        console.log(`Processed photo saved to: ${filepath}`);
        
        res.json({ 
            success: true, 
            message: 'Processed photo saved successfully',
            filename: filename,
            processedPhotoId: filename,
            filepath: filepath,
            device: device,
            theme: theme
        });
    } catch (error) {
        console.error('Error saving processed photo:', error);
        res.status(500).json({ error: 'Failed to save processed photo' });
    }
});

// ==================== 4. FEEDBACK SUBMISSION ROUTES ====================
// Submit complete feedback with retention and email
router.post('/submit-feedback', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { userData, device, theme, retention } = req.body;
        
        console.log('📝 Feedback submitted:', {
            userName: userData.name,
            email: userData.email,
            device: device,
            theme: theme,
            retention: retention
        });

        // 1. IMMEDIATELY send success response to user (within milliseconds)
        const responseData = {
            success: true, 
            message: 'Feedback submitted successfully',
            data: {
                userName: userData.name,
                email: userData.email,
                device: device,
                theme: theme,
                retention: retention,
                submittedAt: new Date().toISOString(),
                emailQueued: false
            }
        };
        
        // Check if email should be queued
        const shouldQueueEmail = userData.email && userData.email.includes('@') && 
                               (userData.photoId || userData.processedPhotoId);
        
        if (shouldQueueEmail) {
            responseData.data.emailQueued = true;
            responseData.data.emailQueuedMessage = 'Thank you email will be sent shortly';
        }
        
        // Send response IMMEDIATELY
        res.json(responseData);
        const responseTime = Date.now() - startTime;
        console.log(`✅ Response sent in ${responseTime}ms`);
        
        // 2. AFTER sending response, process database and email in background
        setTimeout(async () => {
            console.log('🔄 Background processing started...');
            const bgStartTime = Date.now();
            
            try {
                saveFeedbackToDatabase(userData, device, theme, retention, async (error, result) => {
                    if (error) {
                        console.error('❌ Error saving to database:', error);
                        return;
                    }
                    
                    console.log('✅ Feedback saved to database:', result);
                    const bgTime = Date.now() - bgStartTime;
                    console.log(`🔄 Database completed in ${bgTime}ms`);
                    
                    // Send email AFTER database is committed
                    if (shouldQueueEmail && result && result.feedbackId) {
                        const photoToSend = userData.processedPhotoId || userData.photoId;
                        
                        console.log(`📧 Starting email for ${userData.email}...`);
                        
                        setImmediate(async () => {
                            try {
                                const emailResult = await emailService.sendThankYouEmail(
                                    userData.name,
                                    userData.email,
                                    photoToSend,
                                    userData.pledge || ''
                                );
                                
                                if (emailResult.success) {
                                    console.log(`✅ Email sent to ${userData.email}`);
                                    
                                    // Update email flag (separate query, non-blocking)
                                    db.run(
                                        'UPDATE feedback SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP WHERE id = ?',
                                        [result.feedbackId],
                                        function(err) {
                                            if (err) {
                                                console.error(`⚠️ Email flag update failed:`, err.message);
                                            } else {
                                                console.log(`✅ Email flag updated for feedback ${result.feedbackId}`);
                                            }
                                        }
                                    );
                                } else {
                                    console.error(`❌ Email failed:`, emailResult.error);
                                }
                            } catch (emailError) {
                                console.error(`❌ Email exception:`, emailError.message);
                            }
                        });
                    }
                });
            } catch (err) {
                console.error('❌ Background error:', err);
            }
        }, 0);

        
    } catch (error) {
        console.error('❌ Error in submit-feedback:', error);
        // Even on error, return success to user quickly
        const errorResponseTime = Date.now() - startTime;
        console.log(`⚠️ Error response sent in ${errorResponseTime}ms`);
        
        res.json({ 
            success: true, 
            message: 'Feedback submitted successfully',
            data: {
                userName: userData?.name || 'unknown',
                email: userData?.email || 'unknown',
                device: device || 'unknown',
                theme: theme || 'unknown',
                retention: retention || 'unknown',
                submittedAt: new Date().toISOString(),
                note: 'System processing completed'
            }
        });
    }
});

// Send email endpoint (manual)
router.post('/send-email', async (req, res) => {
    try {
        const { name, email, photoFilename, pledgeText } = req.body;
        
        if (!name || !email || !photoFilename) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, email, or photoFilename'
            });
        }
        
        console.log(`📧 Manual email request for ${email} with photo ${photoFilename}`);

        const result = await emailService.sendEmailAndUpdateFlag(
        db,
        name,
        email,
        photoFilename,
        pledgeText || ''
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Email sent successfully',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to send email',
                details: result.error
            });
        }
        
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Retry sending email for feedback entry
router.post('/feedback/:id/retry-email', async (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT f.*, u.name, u.email_encrypted 
        FROM feedback f 
        JOIN users u ON f.user_id = u.id 
        WHERE f.id = ?
    `;
    
    db.get(query, [id], async (err, feedback) => {
        if (err || !feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        if (!feedback.email_encrypted) {
            return res.status(400).json({ error: 'No email address' });
        }
        
        // Decrypt email for sending
        let email;
        try {
            email = auth.decryptEmail(feedback.email_encrypted);
        } catch (error) {
            console.error('❌ Failed to decrypt email:', error);
            return res.status(500).json({ error: 'Failed to decrypt email' });
        }
        
        const photoFilename = feedback.processed_photo_path 
            ? feedback.processed_photo_path.split('/').pop()
            : feedback.photo_path ? feedback.photo_path.split('/').pop() : null;
        
        if (!photoFilename) {
            return res.status(400).json({ error: 'No photo found' });
        }
        
        try {
            const emailResult = await emailService.sendThankYouEmail(
                feedback.name,
                feedback.email,
                photoFilename
            );
            
            if (emailResult.success) {
                db.run(
                    'UPDATE feedback SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [id],
                    (err) => {
                        res.json({
                            success: true,
                            emailSent: true,
                            flagUpdated: !err
                        });
                    }
                );
            } else {
                res.json({
                    success: false,
                    error: emailResult.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

// Test email endpoint
router.get('/test-email', async (req, res) => {
    try {
        const testEmail = req.query.email || 'test@example.com';
        
        console.log('🧪 Testing email service...');
        
        const result = await emailService.testEmailService(testEmail);
        
        res.json({
            success: result.success,
            message: result.success ? 'Email service test completed' : 'Email service test failed',
            data: result
        });
        
    } catch (error) {
        console.error('Error testing email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test email service',
            details: error.message
        });
    }
});

// Check email service status
router.get('/email-status', async (req, res) => {
    try {
        const status = await emailService.checkEmailService();
        
        res.json({
            success: status.available,
            data: status
        });
        
    } catch (error) {
        console.error('Error checking email status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check email service status'
        });
    }
});

// ==================== 5. DATABASE OPERATIONS ====================

// Validate email format
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Save feedback to database with encrypted email
function saveFeedbackToDatabase(userData, device, theme, retention, callback) {
    console.log('💾 Saving feedback with pledge and retention:', {
        userName: userData.name,
        hasEmail: !!userData.email,
        pledge: userData.pledge,
        retention: retention,
        pledgeLength: userData.pledge ? userData.pledge.length : 0
    });
    
    // Find user by email
    db.all('SELECT * FROM users WHERE email_encrypted IS NOT NULL', [], (err, allUsers) => {
        if (err) {
            console.error('Error fetching users:', err);
            return callback(err);
        }
        
        // Try to find matching user by decrypting emails
        let user = null;
        if (userData.email) {
            for (const u of allUsers) {
                try {
                    const decryptedEmail = auth.decryptEmail(u.email_encrypted);
                    if (decryptedEmail && decryptedEmail.toLowerCase() === userData.email.toLowerCase()) {
                        user = u;
                        break;
                    }
                } catch (error) {
                    // Skip invalid encrypted emails
                    continue;
                }
            }
        }
        
        if (!user) {
            // Create new user with encrypted email
            let encryptedEmail = null;
            if (userData.email && isValidEmail(userData.email)) {
                try {
                    encryptedEmail = auth.encryptEmail(userData.email);
                    console.log('🔒 Email encrypted for new user');
                } catch (error) {
                    console.error('❌ Email encryption failed:', error);
                    return callback(new Error('Email encryption failed'));
                }
            }
            
            db.run(
                'INSERT INTO users (name, email_encrypted, visit_count, last_visit) VALUES (?, ?, 1, CURRENT_TIMESTAMP)',
                [userData.name, encryptedEmail],
                function(err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return callback(err);
                    }
                    const userId = this.lastID;
                    console.log(`✅ Created new user with ID: ${userId}${encryptedEmail ? ' (email encrypted)' : ''}`);
                    saveFeedbackRecord(userId);
                }
            );
        } else {
            // Update existing user
            let updateQuery, params;
            
            if (user.email_encrypted) {
                // User already has encrypted email
                updateQuery = 'UPDATE users SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP WHERE id = ?';
                params = [user.id];
            } else if (userData.email && isValidEmail(userData.email)) {
                // Encrypt email for existing user
                try {
                    const encryptedEmail = auth.encryptEmail(userData.email);
                    updateQuery = 'UPDATE users SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP, email_encrypted = ? WHERE id = ?';
                    params = [encryptedEmail, user.id];
                    console.log(`🔒 Encrypting email for existing user ${user.id}`);
                } catch (error) {
                    console.error('❌ Email encryption failed:', error);
                    return callback(new Error('Email encryption failed'));
                }
            } else {
                // No email to update
                updateQuery = 'UPDATE users SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP WHERE id = ?';
                params = [user.id];
            }
            
            db.run(updateQuery, params, (err) => {
                if (err) {
                    console.error('Error updating user:', err);
                    return callback(err);
                }
                console.log(`✅ Updated user ${user.id}, visit count: ${user.visit_count + 1}${!user.email_encrypted && encryptedEmail ? ' (email encrypted)' : ''}`);
                saveFeedbackRecord(user.id);
            });
        }
    });

    // Save feedback record (nested)
    function saveFeedbackRecord(userId) {
        const metadata = JSON.stringify({
            device: device,
            theme: theme,
            retention: retention,
            photoId: userData.photoId,
            processedPhotoId: userData.processedPhotoId,
            likedFeedback: userData.q2,
            improvementFeedback: userData.q3,
            pledge: userData.pledge
        });
        
        let photoPath = userData.photoId ? `photos/${userData.photoId}` : null;
        let processedPhotoPath = userData.processedPhotoId ? `processed/${userData.processedPhotoId}` : null;
        
        db.run(
            `INSERT INTO feedback (user_id, comment, metadata, photo_path, processed_photo_path, data_retention, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, userData.pledge, metadata, photoPath, processedPhotoPath, retention],
            function(err) {
                if (err) {
                    console.error('Error saving feedback:', err);
                    return callback(err);
                }
                
                const feedbackId = this.lastID;
                console.log(`✅ Saved feedback with ID: ${feedbackId}, Retention: ${retention}, Pledge: ${userData.pledge ? 'Yes (' + userData.pledge.length + ' chars)' : 'No'}`);
                console.log(`Raw Photo Path: ${photoPath}`);
                console.log(`Processed Photo Path: ${processedPhotoPath}`);
                
                saveQuestionAnswers(userId, feedbackId, userData, (error) => {
                    if (error) {
                        console.log('⚠️ Some answers could not be saved');
                    }
                    console.log(`📊 Feedback saved successfully - User: ${userId}, Feedback: ${feedbackId}`);
                    console.log(`📝 Pledge: ${userData.pledge ? userData.pledge.substring(0, 50) + '...' : 'None'}`);
                    console.log(`📅 Retention: ${retention}`);
                    callback(null, { userId, feedbackId });
                });
            }
        );
    }

    // Save question answers (nested)
    function saveQuestionAnswers(userId, feedbackId, userData, callback) {
        const getQuestionsQuery = 'SELECT id, question_type FROM questions WHERE is_active = 1';
        console.log('📝 Saving answers for feedback:', feedbackId);
        
        db.all(getQuestionsQuery, [], (err, questions) => {
            if (err || !questions || questions.length === 0) {
                console.log(err ? '❌ Error fetching questions' : '⚠️ No questions');
                return callback(null);
            }
            
            console.log(`📋 Saving ${questions.length} answers in parallel...`);
            
            const insertPromises = questions.map(question => {
                let answerValue = userData.answers?.[question.id] || userData[`q${question.id}`];
                
                if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
                    return new Promise((resolve, reject) => {
                        db.run(
                            'INSERT INTO feedback_answers (feedback_id, question_id, answer_value, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                            [feedbackId, question.id, String(answerValue)],
                            (err) => {
                                if (err) {
                                    console.error(`❌ Q${question.id}:`, err.message);
                                    reject(err);
                                } else {
                                    console.log(`✅ Q${question.id} saved`);
                                    resolve();
                                }
                            }
                        );
                    });
                }
                return Promise.resolve();
            });
            
            Promise.allSettled(insertPromises).then(results => {
                const saved = results.filter(r => r.status === 'fulfilled').length;
                console.log(`📊 Saved ${saved}/${questions.length} answers`);
                callback(null);
            });
        });
    };
};




// ==================== 6. OVERLAY MANAGEMENT ROUTES ====================
// Get all overlays for theme selection in feedback form
router.get('/overlays', (req, res) => {
    console.log('🎨 Fetching overlay data for feedback form...');
    
    // First, check if the overlays table exists
    const tableCheckQuery = `
        SELECT TABLE_NAME AS name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'overlays'
    `;
    
    db.get(tableCheckQuery, [], (err, table) => {
        if (err) {
            console.error('❌ Error checking overlays table:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Database error: ' + err.message 
            });
        }
        
        if (!table) {
            console.log('⚠️ Overlays table does not exist - using fallback');
            return res.json({
                success: true,
                overlays: [],
                message: 'Overlays table does not exist yet'
            });
        }
        
        // Table exists, now fetch the data
        const query = `
            SELECT 
                id,
                display_name,
                theme_id,
                desktop_filename,
                mobile_filename,
                display_order,
                created_at
            FROM overlays 
            ORDER BY display_order ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching overlays:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Database error: ' + err.message 
                });
            }
            
            console.log(`✅ Found ${rows.length} overlays for feedback form`);
            
            res.json({
                success: true,
                overlays: rows
            });
        });
    });
});

// ==================== 7. FORM UI CONFIGURATION ====================
// Get form UI configuration (public)
router.get('/form-ui', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const configPath = path.join(__dirname, 'config', 'form-ui.json');

    if (!fs.existsSync(configPath)) {
      return res.json({});
    }

    const data = fs.readFileSync(configPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error loading form UI configuration:', error);
    res.status(500).json({ error: 'Failed to load form UI configuration' });
  }
});

// ==================== 8. UTILITY ENDPOINTS ====================

// Test database connection endpoint
router.get('/test-db', (req, res) => {
        db.get("SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = DATABASE() LIMIT 1", (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json({ 
            message: 'Database is working!',
            tables: row ? 'Tables exist' : 'No tables found'
        });
    });
});

// Root endpoint for feedback routes
router.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'Feedback routes are working!',
        endpoints: {
            questions: 'GET /api/feedback/questions',
            submit: 'POST /api/feedback/submit-feedback',
            sendEmail: 'POST /api/feedback/send-email',
            testEmail: 'GET /api/feedback/test-email',
            getFeedback: 'GET /api/feedback/feedback',
            getArchive: 'GET /api/feedback/archive',
            updateArchiveStatus: 'POST /api/feedback/archive/update-status',
            archiveStats: 'GET /api/feedback/archive/stats',
            emailStatus: 'GET /api/feedback/email-status'
        }
    });
});

// Get countdown timer setting for photo capture (DONE BY BERNISSA)
router.get('/countdown-timer', (req, res) => {
    console.log('⏱️ Fetching countdown timer setting for feedback form...');
    
    const query = `
        SELECT countdown_seconds
        FROM countdown_management
        WHERE id = 1
        LIMIT 1
    `;
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error('❌ Error fetching countdown timer:', err);
            return res.json({
                success: true,
                countdown_seconds: 3
            });
        }
        
        const seconds = row?.countdown_seconds;
        const safeSeconds = Number.isInteger(seconds) && seconds >= 0 ? seconds : 3;
        
        console.log(`✅ Countdown timer setting: ${safeSeconds} seconds`);
        
        res.json({
            success: true,
            countdown_seconds: safeSeconds
        });
    });
});

module.exports = router;
