// ============================================================
// VALIDATIONRULES.JS - Centralized Feedback Validation
// ============================================================
// CAEDEN CHANGE SUMMARY (DONE BY CAEDEN)
// ============================================================
// - Added centralized validation helpers driven by admin-configurable validationRules. (DONE BY CAEDEN)
// - Added server-side feature flag checks for photo, pledge and email-dependent flows. (DONE BY CAEDEN)
//
// FIND COMMAND
//   rg -n "DONE BY CAEDEN|CAEDEN CHANGE SUMMARY" frontend backend
// ============================================================

function getString(value) {
  return String(value || '').trim();
}

function isEnabled(value) {
  return value !== false;
}

function buildPattern(pattern) {
  try {
    return new RegExp(pattern);
  } catch (error) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }
}

function validateFeedbackSubmission(payload, validationRules = {}, featureFlags = {}) {
  const errors = [];
  const userData = payload?.userData || {};
  const name = getString(userData.name);
  const email = getString(userData.email);
  const pledge = getString(userData.pledge);
  const pledgeTopic = getString(userData.pledgeTopic);
  const pledgeSkipped = Boolean(userData.pledgeSkipped);
  const hasPhoto = Boolean(userData.photoId || userData.processedPhotoId || userData.photo || userData.processedPhoto);

  if (isEnabled(validationRules.nameRequired) && !name) {
    errors.push({ field: 'name', message: 'Name is required.' });
  }

  if (name && name.length < Number(validationRules.nameMinLength || 0)) {
    errors.push({ field: 'name', message: `Name must be at least ${validationRules.nameMinLength} characters.` });
  }

  if (name && name.length > Number(validationRules.nameMaxLength || 9999)) {
    errors.push({ field: 'name', message: `Name must be ${validationRules.nameMaxLength} characters or fewer.` });
  }

  if (isEnabled(validationRules.emailRequired) && !email) {
    errors.push({ field: 'email', message: 'Email is required.' });
  }

  if (email && !buildPattern(validationRules.emailPattern).test(email)) {
    errors.push({ field: 'email', message: 'Email format is invalid.' });
  }

  if (isEnabled(featureFlags.pledgeEnabled) && !pledgeSkipped) {
    if (isEnabled(validationRules.pledgeRequired) && !pledge) {
      errors.push({ field: 'pledge', message: 'Pledge is required.' });
    }

    if (pledge && pledge.length < Number(validationRules.pledgeMinLength || 0)) {
      errors.push({ field: 'pledge', message: `Pledge must be at least ${validationRules.pledgeMinLength} characters.` });
    }

    if (pledge && pledge.length > Number(validationRules.pledgeMaxLength || 9999)) {
      errors.push({ field: 'pledge', message: `Pledge must be ${validationRules.pledgeMaxLength} characters or fewer.` });
    }

    if (isEnabled(validationRules.pledgeTopicRequired) && !pledgeTopic) {
      errors.push({ field: 'pledgeTopic', message: 'Pledge topic is required.' });
    }
  }

  const anyPhotoFeatureEnabled = isEnabled(featureFlags.cameraCaptureEnabled) || isEnabled(featureFlags.photoUploadEnabled);
  if (isEnabled(validationRules.photoRequired) && anyPhotoFeatureEnabled && !hasPhoto) {
    errors.push({ field: 'photo', message: 'Photo is required.' });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFeedbackSubmission
};
