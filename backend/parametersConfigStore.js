// ============================================================
// PARAMETERCONFIGSTORE.JS - System Parameters Management
// ============================================================
// Helper module for reading and writing system parameters config
// Provides consistent interface for parameter configuration
//
// CAEDEN CHANGE SUMMARY (DONE BY CAEDEN)
// ============================================================
// - Added shared JSON-backed storage for editable feedback messages, thank-you email text,
//   feature flags, validation rules, digital tree parameters, photo settings, overlay settings and visual assets. (DONE BY CAEDEN)
// - Added default merging so older config files receive newly introduced parameter categories. (DONE BY CAEDEN)
// - Added configurable feedback auto-archive timing for the admin archive controls. (Done by Caeden)
//
// FIND COMMAND
//   rg -n "DONE BY CAEDEN|CAEDEN CHANGE SUMMARY" frontend backend
// ============================================================
//
// XY CHANGE SUMMARY (DONE BY XY)
// ============================================================
//
// 1. TREE LEAF FALL PARAMETER DEFAULTS
//    leafFallThreshold               - Default number of visible leaves before the batch falls from the tree (DONE BY XY)
//    leafFallDuration                - Default smooth falling animation duration for tree leaves (DONE BY XY)
//    leafGreenResetTime              - Default daily time for badge-coloured leaves to turn green, midnight by default (DONE BY XY)
//
// 2. CONSENT AND PLEDGE CONTENT DEFAULTS
//    contentSettings                 - Stores admin-editable retention duration and pledge examples (DONE BY XY)
//    temporaryRetentionDays          - Default temporary retention duration used by consent text and cleanup (DONE BY XY)
//    pledgeExamples                  - Default visitor-facing pledge example lines (DONE BY XY)
//
// 3. THANK-YOU EMAIL VISIT SUMMARY DEFAULTS
//    visitSummaryTitle               - Default title for the keepsake email visit summary card (DONE BY XY)
//    visitSummary labels             - Default editable row labels for date, topic, badge, retention and tree message (DONE BY XY)
//    visitSummaryTreeMessage         - Default digital tree message shown in thank-you email summary (DONE BY XY)
//
// FIND COMMAND
//   rg -n "XY CHANGE SUMMARY|DONE BY XY" frontend backend
// ============================================================

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config', 'parametersConfig.json');

// Default parameters if file doesn't exist
const DEFAULT_CONFIG = {
  feedbackMessages: {
    thankYouTitle: "Thank You! ☀️",
    thankYouMessage: "Your feedback has been recorded and a new leaf has been added to our digital tree!",
    thankYouSubtitle: "Your feedback makes a difference",
    thankYouFooter: "Thank you for contributing to our sustainability journey at Republic Polytechnic!",
    consentPrompt: "Your feedback helps us create a more sustainable future. Your responses will be kept confidential.",
    detailsPrompt: "Please provide your details so we can track your contributions.",
    feedbackPrompt: "Share your thoughts on our sustainability initiatives.",
    pledgePrompt: "Would you like to make a pledge to support sustainability?"
  },
  contentSettings: {
    temporaryRetentionDays: 7,
    pledgeExamples: [
      "Carry a reusable bottle and cutlery every day",
      "Sort waste properly and recycle whenever possible",
      "Reduce food waste by taking only what I can finish"
    ]
  },
  emailContent: {
    thankYouSubject: "Thank you for visiting RP ESG Centre, {name}!",
    thankYouIntro: "Thank you for taking the time to visit our ESG Experience Centre and sharing your feedback. Attached below is your commemorative photo from your visit.",
    thankYouClosing: "We hope your experience has inspired you to take meaningful steps towards sustainability. Your feedback helps us improve and create better experiences for future visitors.",
    senderName: "ESG Centre Team",
    footerNote: "This is an automated email sent from the RP ESG kiosk system. Please do not reply to this message.",
    visitSummaryTitle: "Your Visit Summary",
    visitSummaryDateLabel: "Visit date",
    visitSummaryTopicLabel: "Pledge topic",
    visitSummaryBadgeLabel: "Badge earned",
    visitSummaryRetentionLabel: "Data retention",
    visitSummaryTreeLabel: "Digital tree",
    visitSummaryTreeMessage: "Your virtual leaf has been added to the RP ESG digital tree."
  },
  // Feature toggles configurable from the admin panel (DONE BY CAEDEN)
  featureFlags: {
    cameraCaptureEnabled: true,
    photoUploadEnabled: true,
    beautyFilterEnabled: true,
    pledgeEnabled: true,
    badgeEmailEnabled: true,
    thankYouEmailEnabled: true,
    socialSharingEnabled: true
  },
  // Centralized validation rules configurable from the admin panel (DONE BY CAEDEN)
  validationRules: {
    nameRequired: true,
    nameMinLength: 2,
    nameMaxLength: 80,
    emailRequired: true,
    emailPattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    requiredQuestionsEnabled: true,
    pledgeRequired: true,
    pledgeMinLength: 5,
    pledgeMaxLength: 500,
    pledgeTopicRequired: true,
    photoRequired: true,
    maxPhotoFileSizeMb: 5,
    allowedPhotoFormats: ["jpeg", "jpg", "png", "webp"]
  },
  treeParameters: {
    ovalWidth: 850,
    ovalHeight: 300,
    ovalTopOffset: -100,
    leafRefreshInterval: 30000,
    leafOpacity: 0.9,
    leafAnimationDuration: 500,
    leafFallThreshold: 15,
    leafFallDuration: 4200,
    leafGreenResetTime: "00:00"
  },
  photoSettings: {
    beautyFilterEnabled: true,
    beautyFilterStrength: "medium",
    maxPhotoFileSize: 5242880,
    supportedFormats: ["jpeg", "png", "webp"]
  },
  overlaySettings: {
    enableOverlayUpload: true,
    maxOverlayFileSize: 10485760,
    supportedFormats: ["png", "jpg", "jpeg"]
  },
  visualAssets: {
    feedbackBackground: "",
    treeBackground: "/assets/Tree/BackGround.png",
    defaultOverlayTheme: ""
  },
  // Auto-archive settings controlled from the admin panel (Done by Caeden)
  archiveSettings: {
    autoArchiveEnabled: false,
    archiveAfterDays: 90
  }
};

function mergeWithDefaults(config) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    feedbackMessages: { ...DEFAULT_CONFIG.feedbackMessages, ...(config.feedbackMessages || {}) },
    contentSettings: { ...DEFAULT_CONFIG.contentSettings, ...(config.contentSettings || {}) },
    emailContent: { ...DEFAULT_CONFIG.emailContent, ...(config.emailContent || {}) },
    featureFlags: { ...DEFAULT_CONFIG.featureFlags, ...(config.featureFlags || {}) },
    validationRules: { ...DEFAULT_CONFIG.validationRules, ...(config.validationRules || {}) },
    treeParameters: { ...DEFAULT_CONFIG.treeParameters, ...(config.treeParameters || {}) },
    photoSettings: { ...DEFAULT_CONFIG.photoSettings, ...(config.photoSettings || {}) },
    overlaySettings: { ...DEFAULT_CONFIG.overlaySettings, ...(config.overlaySettings || {}) },
    visualAssets: { ...DEFAULT_CONFIG.visualAssets, ...(config.visualAssets || {}) },
    archiveSettings: { ...DEFAULT_CONFIG.archiveSettings, ...(config.archiveSettings || {}) }
  };
}

/**
 * Read parameters configuration from JSON file
 * @returns {Object} Parameters configuration object
 */
function readParametersConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      return mergeWithDefaults(JSON.parse(fileContent));
    }
  } catch (error) {
    console.error('❌ Error reading parameters config:', error.message);
  }
  return mergeWithDefaults({});
}

/**
 * Write parameters configuration to JSON file
 * @param {Object} config - Parameters configuration object
 * @returns {boolean} Success status
 */
function writeParametersConfig(config) {
  try {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(mergeWithDefaults(config), null, 2), 'utf8');
    console.log('✅ Parameters config saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error writing parameters config:', error.message);
    return false;
  }
}

/**
 * Update specific parameter value
 * @param {string} category - Parameter category (feedbackMessages, treeParameters, etc.)
 * @param {string} key - Parameter key
 * @param {any} value - New parameter value
 * @returns {boolean} Success status
 */
function updateParameter(category, key, value) {
  try {
    const config = readParametersConfig();
    
    if (!config[category]) {
      config[category] = {};
    }
    
    config[category][key] = value;
    return writeParametersConfig(config);
  } catch (error) {
    console.error('❌ Error updating parameter:', error.message);
    return false;
  }
}

/**
 * Get specific parameter value
 * @param {string} category - Parameter category
 * @param {string} key - Parameter key
 * @returns {any} Parameter value or null
 */
function getParameter(category, key) {
  try {
    const config = readParametersConfig();
    return config[category]?.[key] ?? null;
  } catch (error) {
    console.error('❌ Error getting parameter:', error.message);
    return null;
  }
}

/**
 * Get all parameters for a category
 * @param {string} category - Parameter category
 * @returns {Object} Category parameters object
 */
function getCategory(category) {
  try {
    const config = readParametersConfig();
    return config[category] || {};
  } catch (error) {
    console.error('❌ Error getting category:', error.message);
    return {};
  }
}

/**
 * Update entire category
 * @param {string} category - Parameter category
 * @param {Object} updates - Updated category parameters
 * @returns {boolean} Success status
 */
function updateCategory(category, updates) {
  try {
    const config = readParametersConfig();
    config[category] = { ...config[category], ...updates };
    return writeParametersConfig(config);
  } catch (error) {
    console.error('❌ Error updating category:', error.message);
    return false;
  }
}

/**
 * Reset parameters to defaults
 * @returns {boolean} Success status
 */
function resetToDefaults() {
  try {
    return writeParametersConfig(DEFAULT_CONFIG);
  } catch (error) {
    console.error('❌ Error resetting to defaults:', error.message);
    return false;
  }
}

module.exports = {
  readParametersConfig,
  writeParametersConfig,
  updateParameter,
  getParameter,
  getCategory,
  updateCategory,
  resetToDefaults
};
