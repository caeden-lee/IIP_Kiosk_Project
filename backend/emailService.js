const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { getEmailConfig } = require('./emailConfigStore');

// ==================== BADGE SYSTEM IMPLEMENTATION ====================
// Done by XY - Complete badge awarding system for ESG Kiosk
//
// SUMMARY OF CHANGES:
// 1. Added comprehensive badge configurations with 5 different badge types
// 2. Implemented dynamic badge determination based on pledge content analysis
// 3. Created customized HTML email templates with image icons for each badge
// 4. Integrated badge email sending into feedback submission workflow
// 5. Added keyword-based categorization (Environmental > Social > Governance > General)
//
// BADGE TYPES:
// - Feedback Contributor: Default for completing feedback form
// - Eco Warrior: For environmental pledges (sustainability, green, climate, etc.)
// - Social Champion: For social responsibility pledges (community, diversity, volunteer, etc.)
// - Governance Guardian: For governance/ethics pledges (transparency, accountability, etc.)
// - Commitment Champion: For general pledge commitments
//
// TECHNICAL FEATURES:
// - Image-based badge icons from Icons8
// - Responsive HTML email templates with gradients and styling
// - Priority-based badge selection algorithm
// - Automatic email sending after feedback submission
// - Error handling and logging for email delivery
//
// FILES MODIFIED:
// - backend/emailService.js: Added badge configs, determination logic, sendBadgeEmail function
// - backend/feedbackRoutes.js: Integrated badge email sending in submission workflow
// - backend/badgeSystem.js: Created auxiliary badge system module (for reference)
//
// INTEGRATION:
// - Badge emails sent automatically after successful feedback submission
// - No photo requirement - badges awarded for pledge content analysis
// - Fallback to Feedback Contributor badge if no pledge provided
// ==================== BADGE CONFIGURATIONS ==================== Done by XY
const BADGE_CONFIGS = {
    'feedback-completer': {
        name: 'Feedback Contributor',
        description: 'For completing the feedback form',
        subject: 'Congratulations on Earning Your Feedback Contributor Badge!',
        icon: '📝',
        imageUrl: 'https://img.icons8.com/fluency/96/feedback.png',
        color: '#10b981',
        textTemplate: `Hello!\n\nCongratulations on completing the feedback form! You've earned the "Feedback Contributor" badge.\n\nKeep up the great work!\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: #f8fafc; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        <img src="https://img.icons8.com/fluency/72/ffffff/feedback.png" alt="Feedback badge" style="width: 48px; height: 48px;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Feedback Contributor</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#006937; margin-top: 0;">Congratulations!</h3>
                    <p>Hello!</p>
                    <p>Congratulations on completing the feedback form! You've earned the <strong>"Feedback Contributor"</strong> badge for sharing your valuable insights.</p>
                    <p>Your feedback helps us improve and serve you better. Keep up the great work!</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🏆 Achievement Unlocked
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                </div>
            </div>
        `
    },
    'eco-warrior': {
        name: 'Eco Warrior',
        description: 'For making an environmental pledge',
        subject: 'Congratulations on Earning Your Eco Warrior Badge!',
        icon: '🌱',
        imageUrl: 'https://img.icons8.com/fluency/96/leaf.png',
        color: '#059669',
        textTemplate: `Hello!\n\nCongratulations! By making an environmental pledge, you've earned the "Eco Warrior" badge.\n\nYour commitment to sustainability makes a real difference!\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">
                        <img src="https://img.icons8.com/fluency/72/ffffff/leaf.png" alt="Eco Warrior badge" style="width: 48px; height: 48px;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Eco Warrior</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#059669; margin-top: 0;">Congratulations, Eco Warrior!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By making an environmental pledge, you've earned the <strong>"Eco Warrior"</strong> badge. You're now part of our sustainability champions!</p>
                    <p>Your commitment to protecting our planet makes a real difference. Together, we can create a greener future!</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🌍 Planet Protector 🛡️
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                </div>
            </div>
        `
    },
    'pledge-maker': {
        name: 'Commitment Champion',
        description: 'For making any pledge commitment',
        subject: 'Congratulations on Earning Your Commitment Champion Badge!',
        icon: '🤝',
        imageUrl: 'https://img.icons8.com/fluency/96/handshake.png',
        color: '#3b82f6',
        textTemplate: `Hello!\n\nCongratulations on making a pledge commitment! You've earned the "Commitment Champion" badge.\n\nYour pledges help drive positive change!\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                        <img src="https://img.icons8.com/fluency/72/ffffff/handshake.png" alt="Commitment Champion badge" style="width: 48px; height: 48px;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Commitment Champion</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#3b82f6; margin-top: 0;">Congratulations, Commitment Champion!</h3>
                    <p>Hello!</p>
                    <p>Congratulations on making a pledge commitment! You've earned the <strong>"Commitment Champion"</strong> badge for taking concrete steps toward positive change.</p>
                    <p>Your pledges help drive meaningful progress. Every commitment counts toward building a better future!</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            💪 Commitment Champion
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                </div>
            </div>
        `
    },
    'social-champion': {
        name: 'Social Champion',
        description: 'For making social responsibility pledges',
        subject: 'Congratulations on Earning Your Social Champion Badge!',
        icon: '🤝',
        imageUrl: 'https://img.icons8.com/fluency/96/group.png',
        color: '#f59e0b',
        textTemplate: `Hello!\n\nCongratulations! By making a social responsibility pledge, you've earned the "Social Champion" badge.\n\nYour commitment to community and inclusion makes a real difference!\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                        <img src="https://img.icons8.com/fluency/72/ffffff/group.png" alt="Social Champion badge" style="width: 48px; height: 48px;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Social Champion</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#f59e0b; margin-top: 0;">Congratulations, Social Champion!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By making a social responsibility pledge, you've earned the <strong>"Social Champion"</strong> badge. You're now part of our community champions!</p>
                    <p>Your commitment to diversity, inclusion, and community support makes a real difference. Together, we can build stronger, more inclusive communities!</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🤝 Community Builder 🏘️
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                </div>
            </div>
        `
    },
    'governance-guardian': {
        name: 'Governance Guardian',
        description: 'For making governance and ethics pledges',
        subject: 'Congratulations on Earning Your Governance Guardian Badge!',
        icon: '⚖️',
        imageUrl: 'https://img.icons8.com/fluency/96/justice-scale.png',
        color: '#8b5cf6',
        textTemplate: `Hello!\n\nCongratulations! By making a governance and ethics pledge, you've earned the "Governance Guardian" badge.\n\nYour commitment to transparency and accountability strengthens our society!\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #f3e8ff, #e9d5ff); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
                        <img src="https://img.icons8.com/fluency/72/ffffff/justice-scale.png" alt="Governance Guardian badge" style="width: 48px; height: 48px;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Governance Guardian</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#8b5cf6; margin-top: 0;">Congratulations, Governance Guardian!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By making a governance and ethics pledge, you've earned the <strong>"Governance Guardian"</strong> badge. You're now part of our ethics champions!</p>
                    <p>Your commitment to transparency, accountability, and ethical practices strengthens trust and integrity in our society. Every pledge counts toward better governance!</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            ⚖️ Ethics Champion 🛡️
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                </div>
            </div>
        `
    }
};

// ==================== BADGE DETERMINATION LOGIC ====================
// Done by XY - Intelligent badge selection algorithm
// Analyzes pledge content using keyword matching with priority hierarchy:
// 1. Environmental keywords → Eco Warrior
// 2. Social keywords → Social Champion  
// 3. Governance keywords → Governance Guardian
// 4. Any pledge → Commitment Champion
// 5. No pledge → Feedback Contributor
function determineBadge(userData) {
    // Priority: Eco Warrior > Social Champion > Governance Guardian > Commitment Champion > Feedback Completer
    if (userData.pledge && userData.pledge.trim().length > 0) {
        const pledgeLower = userData.pledge.toLowerCase();
        
        // Check if pledge contains environmental keywords
        const ecoKeywords = ['environment', 'sustainability', 'eco', 'green', 'climate', 'carbon', 'recycle', 'waste', 'energy', 'renewable'];
        const hasEcoContent = ecoKeywords.some(keyword => pledgeLower.includes(keyword));
        
        if (hasEcoContent) {
            return 'eco-warrior';
        }
        
        // Check if pledge contains social keywords
        const socialKeywords = ['community', 'diversity', 'inclusion', 'social', 'equality', 'volunteer', 'charity', 'donate', 'help', 'support'];
        const hasSocialContent = socialKeywords.some(keyword => pledgeLower.includes(keyword));
        
        if (hasSocialContent) {
            return 'social-champion';
        }
        
        // Check if pledge contains governance keywords
        const governanceKeywords = ['ethics', 'transparency', 'governance', 'accountability', 'compliance', 'integrity', 'trust', 'responsible'];
        const hasGovernanceContent = governanceKeywords.some(keyword => pledgeLower.includes(keyword));
        
        if (hasGovernanceContent) {
            return 'governance-guardian';
        }
        
        // Default pledge badge
        return 'pledge-maker';
    }
    
    // Default badge for completing feedback
    return 'feedback-completer';
}

// ==================== EMAIL CONFIGURATION ====================
let emailTransporter;
let SENDER_EMAIL;

// Initialize / reload email transporter from config file
async function reloadEmailService() {
    const cfg = getEmailConfig();
    const provider = (cfg.provider || '').toLowerCase();

    let transporter;
    let senderEmail;

    if (provider === 'gmail') {
        const user = cfg.gmail?.user;
        const pass = cfg.gmail?.pass;
        if (!user || !pass) throw new Error('Gmail config missing user/pass');

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });

        senderEmail = cfg.senderEmail || user;
    } 
    else if (provider === 'outlook') {
        const user = cfg.outlook?.user;
        const pass = cfg.outlook?.pass;
        if (!user || !pass) throw new Error('Outlook config missing user/pass');

        transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });

        senderEmail = cfg.senderEmail || user;
    } 
    else if (provider === 'custom') {
        const host = cfg.custom?.host;
        const port = cfg.custom?.port;
        const secure = !!cfg.custom?.secure;
        const user = cfg.custom?.user;
        const pass = cfg.custom?.pass;

        if (!host || !port || !user || !pass) {
            throw new Error('Custom config missing host/port/user/pass');
        }

        transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });

        senderEmail = cfg.senderEmail || user;
    } 
    else {
        throw new Error(`Unknown provider: ${provider}`);
    }

    emailTransporter = transporter;
    SENDER_EMAIL = senderEmail;

    console.log(`✅ Email service reloaded using provider: ${provider}`);
    return true;
}

// Backward-compatible init (server.js likely calls initEmailService())
function initEmailService() {
    reloadEmailService().catch(err => {
        console.error('❌ Failed to init email service:', err.message);
        emailTransporter = null;
        SENDER_EMAIL = null;
    });
    return true;
}

// Send thank you email with photo attachment
async function sendThankYouEmail(name, email, photoFilename, pledgeText) {
    try {
        console.log(`📧 Preparing to send email to ${email}...`);
        
        if (!emailTransporter) {
            try {
                await reloadEmailService();
            } catch (e) {
                console.error('❌ Email transporter not initialized and reload failed:', e.message);
                return {
                    success: false,
                    error: 'Email transporter not initialized. Please check SMTP configuration.'
                };
            }
        }

        
        if (!email || !email.includes('@')) {
            console.error('❌ Invalid email address:', email);
            return {
                success: false,
                error: 'Invalid email address'
            };
        }
        
        if (!photoFilename) {
            console.error('❌ No photo filename provided');
            return {
                success: false,
                error: 'No photo filename provided'
            };
        }
        
        // Determine photo path - check multiple possible locations
        let fullPhotoPath = null;
        const searchPaths = [
            path.join(__dirname, '..', 'uploads', 'photos', photoFilename),
            path.join(__dirname, '..', 'uploads', 'processed', photoFilename),
            path.join(__dirname, '..', 'uploads', photoFilename),
            path.join(__dirname, '..', '..', 'uploads', 'photos', photoFilename),
            path.join(__dirname, '..', '..', 'uploads', 'processed', photoFilename),
            path.join(__dirname, '..', '..', 'uploads', photoFilename)
        ];
        
        console.log('🔍 Searching for photo:', photoFilename);
        
        for (const photoPath of searchPaths) {
            if (fs.existsSync(photoPath)) {
                fullPhotoPath = photoPath;
                console.log(`✅ Found photo at: ${fullPhotoPath}`);
                break;
            }
        }
        
        if (!fullPhotoPath) {
            console.error('❌ Photo file not found. Searched in:');
            searchPaths.forEach(p => console.log('   -', p));
            return {
                success: false,
                error: 'Photo file not found. Please check if the file exists in uploads folder.'
            };
        }
        
        // Check file size
        try {
            const stats = fs.statSync(fullPhotoPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            console.log(`📏 Photo size: ${fileSizeInMB.toFixed(2)}MB`);
            
            if (fileSizeInMB > 25) {
                console.error(`❌ Photo file too large: ${fileSizeInMB.toFixed(2)}MB`);
                return {
                    success: false,
                    error: `Photo file too large (${fileSizeInMB.toFixed(2)}MB). Maximum size is 25MB.`
                };
            }
        } catch (err) {
            console.error('❌ Error checking file size:', err.message);
        }
        
        // Plain text version of email
        const textBody = `
Dear ${name},

Thank you for taking the time to visit our ESG Experience Centre and sharing your feedback.
Attached below is your commemorative photo from your visit.

Your pledge:
"${pledgeText || '—'}"

We hope your experience has inspired you to take meaningful steps towards sustainability.

Warm regards,
ESG Centre Team
Republic Polytechnic

This is an automated email sent from the RP ESG kiosk system. Please do not reply to this message.
        `;

        // Pledge text
        const safePledgeText = pledgeText
  ? pledgeText.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
  : '';

        const pledgeHtml = pledgeText
  ? `<p style="
        font-size:14px;
        color:#444;
        margin-top:14px;
        font-style:italic;
        text-align:center;
      ">
        &ldquo;${safePledgeText}&rdquo;
     </p>`
  : '';


        // HTML email template
        const htmlBody = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for visiting RP ESG Centre</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:20px; margin:0;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            <div style="background:#006937; color:#ffffff; padding:16px 24px;">
                <h2 style="margin:0; font-size:20px; font-weight:600;">Thank you for visiting the RP ESG Centre, ${name}!</h2>
            </div>

            <div style="padding:24px;">
                <p style="font-size:14px; color:#333; margin:0 0 16px 0;">
                    Dear ${name},
                </p>
                <p style="font-size:14px; color:#333; line-height:1.5; margin:0 0 16px 0;">
                    Thank you for taking the time to visit our ESG Experience Centre and sharing your feedback.
                    Attached below is your commemorative photo from your visit.
                </p>

                <div style="text-align:center; margin:24px 0; padding:16px; background:#f9f9f9; border-radius:4px;">
                    <p style="font-size:13px; color:#666; margin:0 0 12px 0; font-weight:600;">Your ESG Centre Memory</p>
                    <img src="cid:visit_photo" alt="Your RP ESG Centre memory" style="max-width:100%; height:auto; border-radius:4px; border:1px solid #ddd; max-height:400px;" />
                    ${pledgeHtml}
                </div>

                <p style="font-size:13px; color:#555; line-height:1.5; margin:0 0 16px 0;">
                    We hope your experience has inspired you to take meaningful steps towards sustainability.
                    Your feedback helps us improve and create better experiences for future visitors.
                </p>

                <p style="font-size:13px; color:#555; margin-top:24px; padding-top:16px; border-top:1px solid #eee;">
                    Warm regards,<br/>
                    <strong style="color:#006937;">ESG Centre Team</strong><br/>
                    Republic Polytechnic
                </p>
            </div>

            <div style="background:#f0f0f0; padding:12px 24px; font-size:11px; color:#777; text-align:center; border-top:1px solid #ddd;">
                This is an automated email sent from the RP ESG kiosk system. Please do not reply to this message.
            </div>
        </div>
    </body>
</html>
        `;

        const mailOptions = {
            from: `"RP ESG Centre" <${SENDER_EMAIL}>`,
            to: email,
            replyTo: 'no-reply@rp.edu.sg',
            subject: `Thank you for visiting RP ESG Centre, ${name}!`,
            text: textBody,
            html: htmlBody,
            attachments: [
                {
                    filename: photoFilename,
                    path: fullPhotoPath,
                    cid: 'visit_photo',
                    contentType: 'image/jpeg'
                }
            ]
        };

        console.log(`📤 Sending email to: ${email}`);
        const info = await emailTransporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!');
        console.log('📨 Message ID:', info.messageId);
        console.log('👤 Recipient:', email);
        
        return {
            success: true,
            messageId: info.messageId,
            email: email,
            photoFilename: photoFilename,
            recipientCount: info.accepted.length
        };
        
    } catch (err) {
        console.error('❌ Failed to send email:', err.message);
        console.error('Error details:', err);
        
        return {
            success: false,
            error: err.message,
            details: err.response || err.code || 'Unknown error'
        };
    }
}

// Send email and update database flag
async function sendEmailAndUpdateFlag(db, name, email, photoFilename, pledgeText) {
    try {
        console.log(`📧 Starting email process for ${email} with photo ${photoFilename}`);
        
        if (!db) {
            console.error('❌ Database connection not provided');
            return {
                success: false,
                error: 'Database connection not available'
            };
        }
        
        const result = await sendThankYouEmail(name, email, photoFilename, pledgeText);
        
        if (result.success) {
            // Update email_sent flag in database
            return new Promise((resolve, reject) => {
                const updateQuery = `
                    UPDATE feedback 
                    SET email_sent = 1, 
                        email_sent_at = CURRENT_TIMESTAMP 
                    WHERE photo_path LIKE ? 
                       OR processed_photo_path LIKE ? 
                       OR metadata LIKE ?
                `;
                
                db.run(
                    updateQuery,
                    [`%${photoFilename}%`, `%${photoFilename}%`, `%${photoFilename}%`],
                    function(err) {
                        if (err) {
                            console.error('❌ Error updating email_sent flag:', err.message);
                            // Still return success since email was sent
                            resolve({
                                ...result,
                                dbUpdated: false,
                                dbError: err.message
                            });
                        } else {
                            const changes = this.changes || 0;
                            console.log(`✅ Email sent flag updated in database`);
                            console.log(`📊 Rows affected: ${changes}`);
                            
                            resolve({
                                ...result,
                                dbUpdated: true,
                                rowsAffected: changes
                            });
                        }
                    }
                );
            });
        }
        
        return result;
        
    } catch (err) {
        console.error('❌ Error in sendEmailAndUpdateFlag:', err.message);
        return {
            success: false,
            error: err.message
        };
    }
}

// Test email function
async function testEmailService(testEmail = 'test@example.com') {
    try {
        console.log('🧪 Testing email service...');
        
        if (!emailTransporter) {
            console.log('🔄 Initializing email service...');
            await reloadEmailService();
        }
        
        // Verify connection
        const verifyResult = await emailTransporter.verify();
        console.log('✅ Email service verification passed');
        
        // Try to send a test email without attachment
        const testMailOptions = {
            from: `"RP ESG Centre" <${SENDER_EMAIL}>`,
            to: testEmail,
            subject: 'Test Email from RP ESG Centre',
            text: 'This is a test email from the RP ESG Centre system. If you receive this, email service is working correctly.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
                    <h3 style="color:#006937;">Test Email from RP ESG Centre</h3>
                    <p>This is a test email from the RP ESG Centre system.</p>
                    <p>If you receive this, email service is working correctly.</p>
                    <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
                    <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
                    <p style="font-size:12px; color:#666;">This is an automated test message.</p>
                </div>
            `
        };
        
        console.log(`📤 Sending test email to: ${testEmail}`);
        const info = await emailTransporter.sendMail(testMailOptions);
        
        console.log('✅ Test email sent successfully!');
        console.log('📨 Message ID:', info.messageId);
        
        return {
            success: true,
            message: 'Email service is working correctly',
            messageId: info.messageId,
            recipient: testEmail,
            testTime: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Email service test failed:', error.message);
        console.error('Error details:', error);
        
        return {
            success: false,
            error: error.message,
            code: error.code,
            testTime: new Date().toISOString()
        };
    }
}

// Check if email can be sent (without actually sending)
async function checkEmailService() {
    try {
        if (!emailTransporter) {
            await reloadEmailService();
        }
        
        const isVerified = await emailTransporter.verify();
        const cfg = getEmailConfig();
        return {
            available: true,
            verified: isVerified,
            sender: SENDER_EMAIL,
            service: cfg.provider
        };

    } catch (error) {
        return {
            available: false,
            error: error.message,
            sender: SENDER_EMAIL
        };
    }
}

// ==================== BADGE EMAIL SENDING FUNCTION ====================
// Done by XY - Sends customized badge congratulation emails
// Features:
// - Automatic badge determination based on user pledge content
// - HTML email templates with badge-specific styling and icons
// - Image-based badge representations
// - Error handling and delivery confirmation
// - Integrated into feedback submission workflow
const sendBadgeEmail = async (recipientEmail, userData) => {
    try {
        if (!emailTransporter) {
            await reloadEmailService();
        }

        // Determine which badge to award based on user actions
        const badgeKey = determineBadge(userData);
        const badgeConfig = BADGE_CONFIGS[badgeKey];

        if (!badgeConfig) {
            console.error(`Unknown badge key: ${badgeKey}`);
            return { success: false, error: 'Unknown badge type' };
        }

        const mailOptions = {
            from: `"RP ESG Centre" <${SENDER_EMAIL}>`,
            to: recipientEmail,
            subject: badgeConfig.subject,
            text: badgeConfig.textTemplate,
            html: badgeConfig.htmlTemplate
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`🏆 Badge "${badgeConfig.name}" email sent to ${recipientEmail}: ${info.messageId}`);
        return { 
            success: true, 
            messageId: info.messageId,
            badge: badgeConfig.name,
            badgeKey: badgeKey
        };
    } catch (error) {
        console.error('Error sending badge email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initEmailService,
    reloadEmailService,
    sendThankYouEmail,
    sendEmailAndUpdateFlag,
    sendBadgeEmail,
    determineBadge,
    BADGE_CONFIGS,
    testEmailService,
    checkEmailService
};