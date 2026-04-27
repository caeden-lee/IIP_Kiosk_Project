// ============================================================
// DONE BY XY - EMAIL BADGE SERVICE SUMMARY
//  - Added the ESG Kiosk badge email system and badge configurations.
//  - Added topic-to-badge mapping for pledge topics selected in the feedback flow.
//  - Added customized HTML email templates with badge visuals.
//  - Added badge congratulation email sending and social sharing sections.
// ============================================================

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { getEmailConfig } = require('./emailConfigStore');

// ==================== BADGE SYSTEM IMPLEMENTATION ====================
// Done by XY - Complete badge awarding system for ESG Kiosk
//
// SUMMARY OF CHANGES:
// 1. Added comprehensive badge configurations with multiple dedicated badge types
// 2. Implemented explicit pledge topic selection and topic-to-badge mapping
// 3. Updated dynamic badge determination to prefer selected topic over keyword fallback
// 4. Created customized HTML email templates with image icons for each badge
// 5. Integrated badge email sending into feedback submission workflow
//
// BADGE TYPES:
// - Feedback Contributor: Default for completing feedback form
// - Climate Champion: For climate-related pledge topics
// - Renewable Innovator: For clean energy and renewable pledges
// - Sustainable Living Advocate: For sustainable lifestyle pledges
// - Ocean Guardian: For ocean conservation pledges
// - Governance Guardian: For ethics and governance pledges
// - Social Champion: For community and social impact pledges
// - Commitment Champion: Generic pledge badge when no explicit topic is selected
//
// TECHNICAL FEATURES:
// - Explicit topic selection from frontend pledge form
// - Topic badge mapping with dedicated badge assignment
// - Keyword fallback when no topic is selected
// - HTML email templates and badge-specific imagery
// - Badge email delivery integrated with feedback submission
//
// FILES MODIFIED:
// - backend/emailService.js: Added explicit topic badge mapping and updated badge configs
// - frontend/feedback/feedback.html: Added pledge topic selector
// - frontend/feedback/feedback.js: Captured selected topic and validated topic choice on submit
//
// INTEGRATION:
// - Selected pledge topic now determines the badge badge award
// - Topic selection is required before proceeding from the pledge page
// - Fallback keyword detection remains available for older pledge data
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
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20a%20sustainability%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20making%20a%20difference.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20a%20sustainability%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20making%20a%20difference.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
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
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Eco%20Warrior%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20protecting%20our%20planet.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Eco%20Warrior%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20protecting%20our%20planet.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
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
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Commitment%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20taking%20action%20for%20a%20better%20future.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-block; background: #1da1f2; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                                🐦 Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Commitment%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20taking%20action%20for%20a%20better%20future.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-block; background: #25d366; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                                📱 WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-block; background: #e1306c; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                                📸 Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'climate-champion': {
        name: 'Climate Champion',
        description: 'For pledges focused on climate action and lowering emissions',
        subject: 'Congratulations on Earning Your Climate Champion Badge!',
        icon: '🌎',
        imageUrl: 'https://img.icons8.com/fluency/96/earth-globe.png',
        color: '#0ea5e9',
        textTemplate: `Hello!\n\nCongratulations on pledging climate action! You've earned the "Climate Champion" badge.\n\nYour commitment to the climate helps protect our planet.\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #ecfeff, #dbeafe); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                        <span style="font-size: 36px;">🌎</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Climate Champion</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#0ea5e9; margin-top: 0;">Congratulations, Climate Champion!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By choosing climate action, you've earned the <strong>"Climate Champion"</strong> badge. Your pledge supports a healthier, more resilient planet.</p>
                    <p>Thank you for stepping up to reduce emissions and protect our climate.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🌍 Climate Action Hero
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Climate%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20fighting%20climate%20change.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Climate%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20fighting%20climate%20change.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'renewable-innovator': {
        name: 'Renewable Innovator',
        description: 'For pledges focused on renewable energy and clean power',
        subject: 'Congratulations on Earning Your Renewable Innovator Badge!',
        icon: '⚡',
        imageUrl: 'https://img.icons8.com/fluency/96/solar-panel.png',
        color: '#22c55e',
        textTemplate: `Hello!\n\nCongratulations on pledging renewable energy! You've earned the "Renewable Innovator" badge.\n\nYour commitment to clean power is energizing the future.\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #ecfdf5, #e7f5ff); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
                        <span style="font-size: 36px;">⚡</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Renewable Innovator</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#16a34a; margin-top: 0;">Congratulations, Renewable Innovator!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By choosing renewable energy, you've earned the <strong>"Renewable Innovator"</strong> badge. Your pledge supports a cleaner energy future.</p>
                    <p>Thank you for helping power sustainability through smart energy choices.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            ⚡ Clean Power Leader
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Renewable%20Innovator%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20powering%20a%20clean%20energy%20future.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Renewable%20Innovator%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20powering%20a%20clean%20energy%20future.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'sustainable-living-advocate': {
        name: 'Sustainable Living Advocate',
        description: 'For pledges focused on sustainable lifestyle habits',
        subject: 'Congratulations on Earning Your Sustainable Living Advocate Badge!',
        icon: '🌿',
        imageUrl: 'https://img.icons8.com/fluency/96/leaf.png',
        color: '#16a34a',
        textTemplate: `Hello!\n\nCongratulations on pledging sustainable living! You've earned the "Sustainable Living Advocate" badge.\n\nYour commitment to greener habits inspires others.\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #ecfdf5, #eff6ff); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #16a34a, #15803d); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);">
                        <span style="font-size: 36px;">🌿</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Sustainable Living Advocate</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#15803d; margin-top: 0;">Congratulations, Sustainable Living Advocate!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By choosing sustainable living, you've earned the <strong>"Sustainable Living Advocate"</strong> badge. Your pledge helps create everyday eco-friendly habits.</p>
                    <p>Thank you for supporting greener, more sustainable choices in daily life.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🌱 Green Lifestyle Leader
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Sustainable%20Living%20Advocate%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20living%20sustainably.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Sustainable%20Living%20Advocate%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20living%20sustainably.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'ocean-guardian': {
        name: 'Ocean Guardian',
        description: 'For pledges focused on ocean conservation and marine protection',
        subject: 'Congratulations on Earning Your Ocean Guardian Badge!',
        icon: '🌊',
        imageUrl: 'https://img.icons8.com/fluency/96/wave.png',
        color: '#0ea5e9',
        textTemplate: `Hello!\n\nCongratulations on pledging ocean conservation! You've earned the "Ocean Guardian" badge.\n\nYour commitment to protecting marine life is truly inspiring.\n\nBest regards,\nESG Team`,
        htmlTemplate: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #eff6ff, #e0f2fe); padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, #0ea5e9, #0369a1); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                        <span style="font-size: 36px;">🌊</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                        <h2 style="margin: 0; font-size: 24px;">Ocean Guardian</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Badge Earned!</p>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color:#0369a1; margin-top: 0;">Congratulations, Ocean Guardian!</h3>
                    <p>Hello!</p>
                    <p>Congratulations! By choosing ocean conservation, you've earned the <strong>"Ocean Guardian"</strong> badge. Your pledge supports the protection of marine ecosystems and clean seas.</p>
                    <p>Thank you for standing up for our oceans and marine life.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                            🌊 Marine Protector
                        </div>
                    </div>
                    <p>Best regards,<br><strong>ESG Team</strong></p>
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Ocean%20Guardian%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20protecting%20our%20oceans.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Ocean%20Guardian%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20protecting%20our%20oceans.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
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
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Social%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20building%20stronger%20communities.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Social%20Champion%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20building%20stronger%20communities.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
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
                    
                    <!-- Social Media Sharing Section - Added by XY -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Share Your Achievement!</h4>
                        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Help inspire others by sharing your sustainability pledge on social media.</p>
                        <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                            <a href="https://twitter.com/intent/tweet?text=I%20just%20earned%20the%20Governance%20Guardian%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20promoting%20transparency%20and%20ethics.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                            <a href="https://wa.me/?text=I%20just%20earned%20the%20Governance%20Guardian%20badge%20at%20Republic%20Polytechnic!%20Join%20me%20in%20promoting%20transparency%20and%20ethics.%20%23RPGreen%20%23Sustainability%20%23ESG" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp
                            </a>
                            <a href="https://www.instagram.com/" 
                               style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background-color 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};

// ==================== BADGE DETERMINATION LOGIC ====================
// Done by XY - Intelligent badge selection algorithm
// Analyzes pledge content using keyword matching and returns one or more badges:
// - Eco Warrior for environmental content
// - Social Champion for social content
// - Governance Guardian for governance/ethics content
// - Commitment Champion for a generic pledge when no topic keyword matches
// - Feedback Contributor when no pledge is provided
// Topic-based badge mapping added by XY
// Selected pledge topic maps directly to a single dedicated badge.
// If topic selection is missing, the system still falls back to keyword-based detection.
const TOPIC_BADGE_MAP = {
    'climate-change': 'climate-champion',
    'renewable-energy': 'renewable-innovator',
    'sustainable-living': 'sustainable-living-advocate',
    'ocean-conservation': 'ocean-guardian',
    'ethical-governance': 'governance-guardian',
    'community-impact': 'social-champion'
};

function determineBadgeKeys(userData) {
    const selectedTopic = typeof userData.pledgeTopic === 'string' ? userData.pledgeTopic.trim() : '';
    const badgeKeys = [];
    const pledgeText = typeof userData.pledge === 'string' ? userData.pledge.trim().toLowerCase() : '';

    // Prioritize explicit topic selection for badge assignment (done by XY)
    if (selectedTopic && TOPIC_BADGE_MAP[selectedTopic]) {
        return [TOPIC_BADGE_MAP[selectedTopic]];
    }

    if (!pledgeText) {
        return ['feedback-completer'];
    }

    const ecoKeywords = ['environment', 'sustainability', 'eco', 'green', 'climate', 'carbon', 'recycle', 'waste', 'energy', 'renewable'];
    const socialKeywords = ['community', 'diversity', 'inclusion', 'social', 'equality', 'volunteer', 'charity', 'donate', 'help', 'support'];
    const governanceKeywords = ['ethics', 'transparency', 'governance', 'accountability', 'compliance', 'integrity', 'trust', 'responsible'];

    if (ecoKeywords.some(keyword => pledgeText.includes(keyword))) {
        badgeKeys.push('eco-warrior');
    }
    if (socialKeywords.some(keyword => pledgeText.includes(keyword))) {
        badgeKeys.push('social-champion');
    }
    if (governanceKeywords.some(keyword => pledgeText.includes(keyword))) {
        badgeKeys.push('governance-guardian');
    }

    if (badgeKeys.length === 0) {
        badgeKeys.push('pledge-maker');
    }

    return badgeKeys;
}

function determineBadge(userData) {
    const badgeKeys = determineBadgeKeys(userData);
    return badgeKeys[0] || 'feedback-completer';
}

function buildBadgeEmailHtml(badgeConfigs) {
    const badgeCards = badgeConfigs.map(badge => `
        <div style="width: 100%; max-width: 260px; margin: 10px; padding: 18px; border-radius: 16px; background: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
            <div style="width: 64px; height: 64px; margin: 0 auto 14px auto; background: ${badge.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ffffff;">
                ${badge.icon}
            </div>
            <h3 style="font-size: 18px; margin: 0 0 10px 0; color: #111827; text-align: center;">${badge.name}</h3>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.5; text-align: center; margin: 0;">${badge.description}</p>
        </div>
    `).join('');

    return `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background: linear-gradient(135deg, #f8fafc, #eff6ff); padding: 20px; border-radius: 12px;">
            <div style="text-align:center; margin-bottom: 24px;">
                <h2 style="margin:0; color:#0f172a; font-size:28px;">Congratulations!</h2>
                <p style="margin:12px auto 0 auto; max-width:480px; color:#334155; font-size:15px; line-height:1.6;">
                    You've earned the following badge${badgeConfigs.length > 1 ? 's' : ''} based on your pledge topics.
                </p>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px;">
                ${badgeCards}
            </div>
            <div style="margin-top:24px; background:#ffffff; padding:18px; border-radius:14px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                <p style="font-size:13px; color:#475569; line-height:1.7; margin:0;">
                    Thank you for sharing your pledge — your commitment helps create a better future.
                </p>
            </div>
        </div>
    `;
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
// - Multiple topic badges can be awarded for cross-topic pledges
// - HTML email templates with badge-specific styling and icons
// - Image-based badge representations
// - Error handling and delivery confirmation
// - Integrated into feedback submission workflow
// - Social media sharing buttons added to all badge emails - done by XY
const sendBadgeEmail = async (recipientEmail, userData) => {
    try {
        if (!emailTransporter) {
            await reloadEmailService();
        }

        const badgeKeys = determineBadgeKeys(userData);
        const badgeConfigs = badgeKeys.map(key => BADGE_CONFIGS[key]).filter(Boolean);

        if (badgeConfigs.length === 0) {
            console.error('No badge configuration found for user data:', badgeKeys);
            return { success: false, error: 'No badge configuration found' };
        }

        let subject;
        let text;
        let html;

        if (badgeConfigs.length === 1) {
            const badgeConfig = badgeConfigs[0];
            subject = badgeConfig.subject;
            text = badgeConfig.textTemplate;
            html = badgeConfig.htmlTemplate;
        } else {
            const badgeNames = badgeConfigs.map(badge => badge.name);
            subject = `Congratulations! You've earned ${badgeNames.join(' + ')} badges!`;
            text = `Hello!\n\nCongratulations on earning the following badges:\n${badgeConfigs.map(badge => `- ${badge.name}: ${badge.description}`).join('\n')}\n\nKeep up the great work!\n\nBest regards,\nESG Team`;
            html = buildBadgeEmailHtml(badgeConfigs);
        }

        const mailOptions = {
            from: `"RP ESG Centre" <${SENDER_EMAIL}>`,
            to: recipientEmail,
            subject,
            text,
            html
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`🏆 Badge email sent to ${recipientEmail}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
            badges: badgeConfigs.map(badge => badge.name),
            badgeKeys: badgeKeys
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
