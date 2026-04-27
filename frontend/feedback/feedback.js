// ============================================================
// FEEDBACK.JS - TABLE OF CONTENTS (CTRL+F SEARCHABLE)
// ============================================================
// 
// 1. GLOBAL VARIABLES & CONSTANTS
//    let selectedRetention            - Selected retention option (DONE BY PRETI)
//    let selectedTheme                - Currently selected overlay theme (DONE BY PRETI)
//    let userData                     - Object storing user input and answers (DONE BY PRETI)
//    let stream                       - Camera video stream object 
//    let photoData                    - Base64 encoded photo data 
//    let currentDevice                - 'desktop' or 'mobile' device type (DONE BY PRETI)
//    let inactivityTimer              - Timer for inactivity timeout (DONE BY PRETI)
//    const INACTIVITY_TIMEOUT         - 5 minutes timeout duration (DONE BY PRETI)
//    let countdownSeconds             - Countdown seconds loaded from backend (DONE BY BERNISSA)
//    let overlayData                  - Store full overlay data including file paths (DONE BY PRETI)
//
// 2. INITIALIZATION & SETUP FUNCTIONS
//    async function loadDynamicQRCode() - Load dynamic QR code from server (DONE BY PRETI)
//    function detectDeviceType()      - Detect mobile/desktop device (DONE BY PRETI)
//    DOMContentLoaded                 - Application bootstrap (DONE BY PRETI)
//
// 3. INACTIVITY TIMER FUNCTIONS
//    function startInactivityTimer()  - Start 5-minute countdown (DONE BY PRETI)
//    function resetInactivityTimer()  - Reset on user interaction (DONE BY PRETI)
//    function returnToLandingPage()   - Return to start when timeout (DONE BY PRETI)
//    function showTimeoutNotification() - Show timeout message (DONE BY PRETI)
//
// 4. QUESTION MANAGEMENT FUNCTIONS
//    async function loadFeedbackQuestions() - Load questions from database (DONE BY PRETI)
//    function updateFeedbackForm()    - Update form with questions (DONE BY PRETI)
//    function createQuestionElement() - Create question UI (DONE BY PRETI)
//    function selectQuestionRating()  - Handle star rating (DONE BY PRETI)
//    function initializeQuestionEventListeners() - Setup question events (DONE BY PRETI)
//    function showNoQuestionsMessage() - Show message if no questions (DONE BY PRETI)
//    function getQuestionType()       - Determine question type (DONE BY PRETI)
//    function validateRequiredQuestions() - Validate required answers (DONE BY PRETI)
// 
// 5. FORM SUBMISSION FUNCTIONS
//    function submitFeedback()        - Submit feedback form (DONE BY PRETI)
//    function submitDetails()         - Submit user details (DONE BY PRETI)
//    function submitPledge()          - Submit pledge and redirect (DONE BY PRETI)
//
// 6. PHOTO HANDLING FUNCTIONS
//    function handlePhotoUpload()     - Handle file upload (mobile) 
//    function continueToStyleFromUpload() - Continue from upload to style (DONE BY PRETI)
//    function retakePhotoFromUpload() - Retake photo from upload page (DONE BY PRETI)
//    async function initializeCamera() - Initialize camera (desktop only) (DONE BY PRETI)
//    async function capturePhoto()    - Capture with countdown/redirect (DONE BY PRETI)
//    function takePhoto()             - Take photo from camera stream (DONE BY PRETI)
//    function continueToStyle()       - Go to style page after photo (DONE BY PRETI)
//    function saveOriginalPhoto()     - Save original to server (DONE BY PRETI)
//    function saveProcessedPhoto()    - Save processed photo to server (DONE BY PRETI)
//
// 7. OVERLAY & THEME FUNCTIONS
//    async function loadOverlayOptions() - Load overlays from database (DONE BY PRETI)
//    function loadDefaultOverlayOptions() - Fallback default overlays (DONE BY PRETI)
//    function generateColorFromThemeId() - Generate consistent colors (DONE BY PRETI)
//    function selectTheme()           - Select theme and update preview (DONE BY PRETI)
//    function updateThemePreview()    - Update theme preview image (DONE BY PRETI)
//    function updatePreviewWithCutout() - Update preview with positioning (DONE BY PRETI)
//    function processFinalPhoto()     - Process final photo with overlay (DONE BY PRETI)
//
// 8. PAGE NAVIGATION FUNCTIONS
//    function showConsentPage()       - Show consent page (DONE BY PRETI)
//    function selectOption()          - Select retention option (DONE BY PRETI)
//    function showDetailsPage()       - Show details page 
//    function retakePhotoFromStyle()  - Retake photo from style page (DONE BY PRETI)
//    function confirmStyle()          - Confirm and go to confirmation 
//    function updateConfirmationDetails() - Update confirmation page 
//    function goBackToStyle()         - Go back to style page 
//    function finalSubmit()           - Final submission with saving (DONE BY PRETI)
//    function submitAnother()         - Reset and start new submission 
//
// 9. BACK NAVIGATION FUNCTIONS
//    function goBackToLanding()       - Consent to Landing (DONE BY PRETI)
//    function goBackToConsent()       - Details to Consent 
//    function goBackToDetails()       - Feedback to Details 
//    function goBackToFeedback()      - Pledge to Feedback 
//    function goBackToPledge()        - Photo/Upload to Pledge 
//
// 10. EVENT LISTENERS & CLEANUP
//     window.addEventListener('beforeunload') - Clean up camera and timers 
//     document.addEventListener('click') - Reset inactivity timer (DONE BY PRETI)
//     document.addEventListener('keypress') - Reset inactivity timer (DONE BY PRETI)
//     document.addEventListener('mousemove') - Reset inactivity timer (DONE BY PRETI)
//     document.addEventListener('touchstart') - Reset inactivity timer (DONE BY PRETI)
//
// 11. PLEDGEBOARD NAVIGATION
//     function viewPledgeboard()       - Navigate to pledgeboard page (DONE BY PRETI)
//
// 12. FORM UI CONFIGURATION
//     async function applyFormUIConfig() - Load and apply form UI settings from server (DONE BY NADH)
//     async function loadCountdownTimer() - Load countdown timer setting from server (DONE BY BERNISSA)

// ==================== 1. GLOBAL VARIABLES & CONSTANTS ====================
let selectedRetention = null;
let selectedTheme = 'nature';
let userData = {};
let stream = null;
let photoData = null;
let currentDevice = 'desktop'; // 'desktop' or 'mobile'
let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 300000; // 5 minutes (300,000 milliseconds)
let countdownSeconds = null; // Loaded from backend when needed (DONE BY BERNISSA)
let overlayData = {}; // Store full overlay data including file paths from database 
let isMirrored = false; // to invert camera done by nick


// facial detection (Done by Yu Kang)
const FACE_API_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
let faceDetectionReady = false;
let faceDetectionLoadPromise = null;

function updateFaceDetectionStatus(message, type = 'info', statusElementId = 'face-detection-status') {
    const statusElement = document.getElementById(statusElementId);
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `face-detection-status ${type}`;
}

async function ensureFaceDetectionReady() {
    if (faceDetectionReady) {
        return true;
    }

    if (faceDetectionLoadPromise) {
        return faceDetectionLoadPromise;
    }

    if (typeof faceapi === 'undefined') {
        throw new Error('face-api.js is not loaded.');
    }

    updateFaceDetectionStatus('Loading face detection...', 'loading');

    faceDetectionLoadPromise = faceapi.nets.tinyFaceDetector
        .loadFromUri(FACE_API_MODEL_URL)
        .then(() => {
            faceDetectionReady = true;
            updateFaceDetectionStatus('Face detection ready.', 'success');
            return true;
        })
        .catch((error) => {
            console.error('Failed to load face detection model:', error);
            updateFaceDetectionStatus('Face detection unavailable. Check network and try again.', 'error');
            throw new Error('Unable to load face detection model. Please check internet access and retry.');
        })
        .finally(() => {
            faceDetectionLoadPromise = null;
        });

    return faceDetectionLoadPromise;
}

async function detectFaceInCurrentFrame() {
    await ensureFaceDetectionReady();

    const video = document.getElementById('video');
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Camera preview is not ready yet.');
    }

    const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5
        })
    );

    return Boolean(detection);
}

// Feature to detect face in uploaded image (mobile) - done by Yu Kang
function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to load uploaded image for face detection.'));
        image.src = dataUrl;
    });
}

async function detectFaceInImageData(dataUrl) {
    await ensureFaceDetectionReady();

    const image = await loadImageElement(dataUrl);
    const detection = await faceapi.detectSingleFace(
        image,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5
        })
    );

    return Boolean(detection);
}

async function capturePhotoIfFaceDetected() {
    try {
        updateFaceDetectionStatus('Checking for face...', 'loading');

        const faceDetected = await detectFaceInCurrentFrame();
        if (!faceDetected) {
            updateFaceDetectionStatus('No face detected. Position your face in frame and try again.', 'error');
            alert('No face detected. Please position your face clearly in the camera frame and capture again.');
            return false;
        }

        updateFaceDetectionStatus('Face detected. Capturing photo...', 'success');
        takePhoto();
        return true;
    } catch (error) {
        console.error('Face detection check failed:', error);
        updateFaceDetectionStatus('Face detection failed. Please try again.', 'error');
        alert(`Face detection failed: ${error.message}`);
        return false;
    }
}


// ==================== 2. INITIALIZATION & SETUP FUNCTIONS ====================

// Load dynamic QR code from server
async function loadDynamicQRCode() {
    try {
        const response = await fetch('/api/generate-qr');
        const data = await response.json();
        
        if (data.success && data.qrSvg) {
            const qrContainer = document.querySelector('.qr-code');
            if (qrContainer) {
                // Replace the dummy QR code with dynamic one
                qrContainer.innerHTML = data.qrSvg;
                
                // Update the description with the actual IP
                const qrDescription = document.querySelector('.qr-description');
                if (qrDescription) {
                    qrDescription.innerHTML = `
                        Scan to open: <strong>${data.url}</strong><br>
                        Point your mobile camera here to open on your phone
                    `;
                }
                
                console.log('Dynamic QR code loaded:', data.url);
            }
        }
    } catch (error) {
        console.log('Using static QR code (fallback):', error.message);
        // Keep the existing dummy QR code if dynamic loading fails
    }
}

// Detect if user is on mobile or desktop
function detectDeviceType() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    currentDevice = isMobile ? 'mobile' : 'desktop';
    console.log('Detected device:', currentDevice);
    
    // Update UI classes for device-specific styling
    document.body.classList.add(`device-${currentDevice}`);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    applyFormUIConfig();
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Add class to body to show content after scaling is ready
        setTimeout(() => {
            document.body.classList.add('scale-applied');
            
            // Force reflow to ensure smooth transition
            void document.body.offsetHeight;
        }, 50);
    }
    
    // Handle page transitions
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // When page changes, ensure scaling is maintained
                if (isMobile && !document.body.classList.contains('scale-applied')) {
                    document.body.classList.add('scale-applied');
                }
            }
        });
    });
    
    // Observe body for page changes
    observer.observe(document.body, {
        childList: true,
        subtree: false
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Load dynamic QR code
    loadDynamicQRCode();
    
    // Detect device type
    detectDeviceType();
    
    const pledgeTextarea = document.getElementById('pledge-text');
    if (pledgeTextarea) {
        pledgeTextarea.addEventListener('input', function() {
            document.getElementById('char-count').textContent = this.value.length;
            resetInactivityTimer(); // Reset timer on user input
        });
    }

    // Add event listener for capture button
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }
    //for invert camera done by nick
    const invertBtn = document.getElementById('invert-btn');
if (invertBtn) {
    invertBtn.addEventListener('click', toggleMirror);
}

    // Load overlay options from database
    loadOverlayOptions();
    
    // Load feedback questions from database
    loadFeedbackQuestions();

    // Start inactivity timer
    startInactivityTimer();
});


// ==================== 3. INACTIVITY TIMER FUNCTIONS ====================

// Start 5-minute inactivity countdown
function startInactivityTimer() {
    // Clear any existing timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Set new timer for 5 minutes
    inactivityTimer = setTimeout(() => {
        returnToLandingPage();
    }, INACTIVITY_TIMEOUT);
    
    console.log('Inactivity timer started: 5 minutes');
}

// Reset timer on user interaction
function resetInactivityTimer() {
    startInactivityTimer();
}

// Return to landing page when timeout reached
function returnToLandingPage() {
    console.log('Inactivity timeout reached - returning to landing page');
    
    // Stop camera stream if active
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Clear any existing timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // Reset all data
    selectedRetention = null;
    selectedTheme = 'nature';
    userData = {};
    photoData = null;
    
    // Reset forms
    document.querySelectorAll('form').forEach(form => form.reset());
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    
    // Reset character counter if it exists
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0';
    
    // Reset proceed button if it exists
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) proceedBtn.disabled = true;
    
    // Hide all pages correctly - each page is a .container div
    const allPages = document.querySelectorAll('.container');
    allPages.forEach(page => {
        page.style.display = 'none';
    });
    
    // Show landing page
    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
        landingPage.style.display = 'flex';
    }
    
    // Show notification
    showTimeoutNotification();
    
    console.log('✅ Successfully returned to landing page');
}

// Show timeout notification message
function showTimeoutNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 12px;
        padding: 16px 20px;
        color: #92400e;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        max-width: 300px;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6V10L12 12" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                <circle cx="10" cy="10" r="8" stroke="#f59e0b" stroke-width="2"/>
            </svg>
            <span>Session timed out. Please start again.</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}


// ==================== 4. QUESTION MANAGEMENT FUNCTIONS ====================

// Load questions from the database
async function loadFeedbackQuestions() {
    try {
        const response = await fetch('/api/feedback/questions');
        const data = await response.json();
        
        if (data.success && data.questions.length > 0) {
            updateFeedbackForm(data.questions);
        } else {
            // Show message if no questions found
            showNoQuestionsMessage();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        showNoQuestionsMessage();
    }
}

// Update the feedback form with ALL questions from database
function updateFeedbackForm(questions) {
    const container = document.getElementById('questions-container');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    if (!questions || questions.length === 0) {
        console.log('No questions found');
        showNoQuestionsMessage();
        return;
    }
    
    console.log(`Loading ${questions.length} questions from database`);
    
    // Add ALL questions from database
    questions.forEach((question) => {
        if (!question.is_active) return;
        
        const questionNumber = question.display_order; 
        const questionElement = createQuestionElement(question, questionNumber);
        container.appendChild(questionElement);
    });
    
    // Add event listeners
    setTimeout(() => {
        initializeQuestionEventListeners();
    }, 100);
}

// Create question element based on question type
function createQuestionElement(question, questionNumber) {
    const questionGroup = document.createElement('div');
    questionGroup.className = 'question-group';
    questionGroup.setAttribute('data-question-id', question.id);
    
    const requiredIndicator = question.is_required ? ' *' : '';
    
    let questionHTML = `
        <label class="question-label">${questionNumber}. ${question.question_text}${requiredIndicator}</label>
    `;
    
    // Generate appropriate input based on question type
    switch (question.question_type) {
        case 'text':
            questionHTML += `
                <textarea 
                    id="q${question.id}" 
                    name="q${question.id}" 
                    rows="4" 
                    placeholder="Type your answer here..." 
                    ${question.is_required ? 'required' : ''}
                    oninput="resetInactivityTimer()"
                ></textarea>
            `;
            break;
            
        case 'yesno':
            questionHTML += `
                <div style="display: flex; gap: 15px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input 
                            type="radio" 
                            name="q${question.id}" 
                            value="yes" 
                            ${question.is_required ? 'required' : ''}
                            onclick="resetInactivityTimer()"
                        >
                        <span>Yes</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input 
                            type="radio" 
                            name="q${question.id}" 
                            value="no"
                            onclick="resetInactivityTimer()"
                        >
                        <span>No</span>
                    </label>
                </div>
            `;
            break;
            
        case 'rating':
            questionHTML += `
                <div class="rating-buttons" style="margin-top: 10px;">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <button 
                            type="button" 
                            class="rating-btn question-rating" 
                            data-question-id="${question.id}"
                            data-rating="${star}"
                            onclick="selectQuestionRating(${question.id}, ${star}, this); resetInactivityTimer()"
                            ${question.is_required ? 'data-required="true"' : ''}
                        >
                            ${star}
                        </button>
                    `).join('')}
                </div>
                <input 
                    type="hidden" 
                    id="q${question.id}" 
                    name="q${question.id}" 
                    ${question.is_required ? 'required' : ''}
                >
            `;
            break;
            
        case 'choice':
            if (question.options && question.options.length > 0) {
                questionHTML += `
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                        ${question.options.map(option => `
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input 
                                    type="radio" 
                                    name="q${question.id}" 
                                    value="${option.option_label}"
                                    ${question.is_required ? 'required' : ''}
                                    onclick="resetInactivityTimer()"
                                >
                                <span>${option.option_label}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
            }
            break;
            
        default:
            questionHTML += `
                <textarea 
                    id="q${question.id}" 
                    name="q${question.id}" 
                    rows="4" 
                    placeholder="Type your answer here..." 
                    ${question.is_required ? 'required' : ''}
                    oninput="resetInactivityTimer()"
                ></textarea>
            `;
    }
    
    questionGroup.innerHTML = questionHTML;
    return questionGroup;
}

// Handle star rating selection for dynamic questions
function selectQuestionRating(questionId, rating, element) {
    // Remove selected class from all buttons in this question group
    const questionGroup = element.closest('.question-group');
    const buttons = questionGroup.querySelectorAll('.question-rating');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // Add selected class to clicked button
    element.classList.add('selected');
    
    // Update the hidden input
    const hiddenInput = document.getElementById(`q${questionId}`);
    if (hiddenInput) {
        hiddenInput.value = rating;
    }
    
    console.log(`Selected rating ${rating} for question ${questionId}`);
}

// Initialize event listeners for dynamic questions
function initializeQuestionEventListeners() {
    console.log('Question event listeners initialized');
}

// Show message when no questions exist
function showNoQuestionsMessage() {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                <circle cx="12" cy="12" r="10" stroke="#94a3b8" stroke-width="1.5"/>
                <path d="M12 8V12M12 16H12.01" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <h3 style="color: #475569; margin-bottom: 8px;">No Questions Available</h3>
            <p>Please contact the administrator to set up feedback questions.</p>
        </div>
    `;
    
    // Disable submit button
    const submitBtn = document.querySelector('#feedback-page .consent-button');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'No Questions Available';
    }
}

// Helper function to determine question type
function getQuestionType(questionElement) {
    if (questionElement.querySelector('textarea')) return 'text';
    if (questionElement.querySelector('.question-rating')) return 'rating';
    if (questionElement.querySelector('input[type="radio"]')) {
        // Check if it's yes/no or multiple choice
        const radios = questionElement.querySelectorAll('input[type="radio"]');
        const values = Array.from(radios).map(radio => radio.value);
        if (values.includes('yes') && values.includes('no')) {
            return 'yesno';
        } else {
            return 'choice';
        }
    }
    return 'unknown';
}

// Validate that all required questions are answered
function validateRequiredQuestions() {
    const requiredQuestions = document.querySelectorAll('#questions-container .question-group[data-question-id]');
    
    for (const question of requiredQuestions) {
        const questionId = question.getAttribute('data-question-id');
        const isRequired = question.querySelector('[required]') !== null;
        
        if (isRequired) {
            const questionType = getQuestionType(question);
            let hasAnswer = false;
            
            switch (questionType) {
                case 'text':
                    const textarea = question.querySelector('textarea');
                    hasAnswer = textarea && textarea.value.trim() !== '';
                    break;
                    
                case 'yesno':
                case 'choice':
                    const selectedRadio = question.querySelector('input[type="radio"]:checked');
                    hasAnswer = selectedRadio !== null;
                    break;
                    
                case 'rating':
                    const hiddenInput = question.querySelector('input[type="hidden"]');
                    hasAnswer = hiddenInput && hiddenInput.value !== '';
                    break;
            }
            
            if (!hasAnswer) {
                // Scroll to the question and highlight it
                question.scrollIntoView({ behavior: 'smooth', block: 'center' });
                question.style.border = '2px solid #ef4444';
                question.style.borderRadius = '8px';
                question.style.padding = '10px';
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    question.style.border = '';
                    question.style.padding = '';
                }, 3000);
                
                return false;
            }
        }
    }
    
    return true;
}


// ==================== 5. FORM SUBMISSION FUNCTIONS ====================

// Submit feedback form with dynamic questions
function submitFeedback(event) {
    event.preventDefault();
    
    // Collect all answers
    userData.answers = {};
    
    const allQuestions = document.querySelectorAll('#questions-container .question-group[data-question-id]');
    allQuestions.forEach(question => {
        const questionId = question.getAttribute('data-question-id');
        const questionType = getQuestionType(question);
        
        let answerValue = '';
        
        switch (questionType) {
            case 'text':
                const textarea = question.querySelector('textarea');
                answerValue = textarea ? textarea.value : '';
                break;
                
            case 'yesno':
                const selectedRadio = question.querySelector('input[type="radio"]:checked');
                answerValue = selectedRadio ? selectedRadio.value : '';
                break;
                
            case 'rating':
                const hiddenInput = question.querySelector('input[type="hidden"]');
                answerValue = hiddenInput ? hiddenInput.value : '';
                break;
                
            case 'choice':
                const selectedChoice = question.querySelector('input[type="radio"]:checked');
                answerValue = selectedChoice ? selectedChoice.value : '';
                break;
        }
        
        userData.answers[questionId] = answerValue;
        userData[`q${questionId}`] = answerValue; // for backward compatibility
    });
    
    // Validate required questions
    if (!validateRequiredQuestions()) {
        alert('Please answer all required questions before continuing.');
        return;
    }
    
    document.getElementById('feedback-page').style.display = 'none';
    document.getElementById('pledge-page').style.display = 'flex';
    resetInactivityTimer();
}

// Submit user details form
function submitDetails(event) {
    event.preventDefault();
    userData.name = document.getElementById('user-name').value;
    userData.email = document.getElementById('user-email').value;
    
    if (userData.name && userData.email) {
        document.getElementById('details-page').style.display = 'none';
        document.getElementById('feedback-page').style.display = 'flex';
        resetInactivityTimer();
    }
}

// Submit pledge and redirect to appropriate photo method
// Added explicit pledge topic selection support and validation - done by XY
function submitPledge(event) {
    event.preventDefault();
    userData.pledge = document.getElementById('pledge-text').value;
    userData.pledgeTopic = document.getElementById('pledge-topic').value;

    if (!userData.pledgeTopic) {
        alert('Please select a pledge topic before continuing.');
        return;
    }

    document.getElementById('pledge-page').style.display = 'none';

    // MOBILE: Use file upload instead of camera
    if (currentDevice === 'mobile') {
        document.getElementById('file-upload-page').style.display = 'flex';
    } else {
        // DESKTOP: Use camera as before
        document.getElementById('photo-page').style.display = 'flex';
        initializeCamera();
    }

    resetInactivityTimer();
}


// ==================== 6. PHOTO HANDLING FUNCTIONS ====================

// Handle photo upload from file input (mobile) - with face detection validation (Done by Yu Kang)
async function handlePhotoUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // Validate it's an image file
    if (!file.type.match('image.*')) {
        alert('Please upload an image file (JPG, PNG, etc.)');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please upload an image smaller than 5MB.');
        return;
    }

    const previewContainer = document.getElementById('photo-preview');
    const continueBtn = document.getElementById('upload-continue-btn');

    // Reset preview state before validation.
    photoData = null;
    previewContainer.style.display = 'none';
    continueBtn.disabled = true;
    updateFaceDetectionStatus('Checking uploaded photo for a face...', 'loading', 'upload-face-detection-status');

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error reading the file. Please try again.'));
        reader.readAsDataURL(file);
    }).catch((error) => {
        alert(error.message);
        updateFaceDetectionStatus('Could not read image. Please try again.', 'error', 'upload-face-detection-status');
        return null;
    });

    if (!dataUrl) {
        return;
    }

    try {
        const hasFace = await detectFaceInImageData(dataUrl);
        if (!hasFace) {
            event.target.value = '';
            updateFaceDetectionStatus('No face detected. Please retake and upload a clearer face photo.', 'error', 'upload-face-detection-status');
            alert('No face detected. Please retake the photo and make sure your face is clearly visible.');
            return;
        }

        photoData = dataUrl;

        const previewImg = document.getElementById('uploaded-photo-preview');
        previewImg.src = photoData;
        previewContainer.style.display = 'block';
        continueBtn.disabled = false;
        updateFaceDetectionStatus('Face detected. Photo accepted.', 'success', 'upload-face-detection-status');

        // Auto-scroll to show preview
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        resetInactivityTimer();
        
    } catch (error) {
        console.error('Face detection failed for uploaded image:', error);
        event.target.value = '';
        photoData = null;
        previewContainer.style.display = 'none';
        continueBtn.disabled = true;
        updateFaceDetectionStatus('Face detection failed. Please try again.', 'error', 'upload-face-detection-status');
        alert(`Face detection failed: ${error.message}`);
    }
}

// Continue to style page from upload (mobile)
function continueToStyleFromUpload() {
    if (!photoData) {
        alert('Please upload a photo first.');
        return;
    }

    document.getElementById('file-upload-page').style.display = 'none';
    document.getElementById('style-page').style.display = 'flex';
    resetInactivityTimer();

    // Update the preview immediately
    updatePreviewWithCutout();
}

// Retake photo from upload page (mobile)
function retakePhotoFromUpload() {
    // Reset file input
    document.getElementById('photo-input').value = '';
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('upload-continue-btn').disabled = true;
    updateFaceDetectionStatus('Upload a photo to run face detection.', 'info', 'upload-face-detection-status');
    photoData = null;

    // Trigger click on file input again
    document.getElementById('photo-input').click();
}

// Initialize camera with mobile device check
async function initializeCamera() {
    // Don't initialize camera for mobile users
    if (currentDevice === 'mobile') {
        return;
    }

    try {
        console.log('Initializing camera for device:', currentDevice);
        
        // Stop any existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Get camera stream with device-specific constraints
        const constraints = {
            video: { 
                facingMode: 'user',
                width: { ideal: currentDevice === 'mobile' ? 720 : 1280 },
                height: { ideal: currentDevice === 'mobile' ? 1280 : 720 }
            } 
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.getElementById('video');
        video.srcObject = stream;

        // facial detection (Done by Yu Kang)
        await ensureFaceDetectionReady();

        // Show camera
        document.getElementById('camera-container').style.display = 'block';

        console.log('Camera initialized for', currentDevice);
        
        // Add event listener to video for user interaction
        video.addEventListener('click', resetInactivityTimer);
        
    } catch (error) {
        console.error('Camera error:', error);
        if (error.name === 'NotAllowedError') {
            alert('Camera access was denied. Please allow camera permissions to take a photo.');
        }
    }
}

// Capture photo with countdown timer (desktop) or redirect to upload (mobile)
async function capturePhoto() {
    // For mobile, redirect to file upload
    if (currentDevice === 'mobile') {
        document.getElementById('photo-page').style.display = 'none';
        document.getElementById('file-upload-page').style.display = 'flex';
        resetInactivityTimer();
        return;
    }

    try {
        const captureBtn = document.getElementById('capture-btn');
        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownText = document.getElementById('countdown-text');
        
        if (!stream) {
            alert('Camera not ready. Please wait for camera to initialize.');
            return;
        }

        // Disable capture button during countdown
        captureBtn.disabled = true;
        
        // Load countdown from backend if not yet loaded
        if (countdownSeconds === null) {
            await loadCountdownTimer();
        }
        
        let countdown = Number.isInteger(countdownSeconds) ? countdownSeconds : 0;
        
        // If admin set to 0, take photo immediately (no countdown overlay)
        if (countdown === 0) {

            // facial detection (Done by Yu Kang)
            await capturePhotoIfFaceDetected();
            captureBtn.disabled = false;
            return;
        }
        
        // Show countdown overlay
        countdownText.textContent = countdown;
        countdownOverlay.style.display = 'flex';
        console.log('Starting countdown:', countdown);

        const countdownInterval = setInterval(async () => {
            countdown--;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                countdownOverlay.style.display = 'none';
                console.log('Countdown finished, taking photo...');
                
                // facial detection (Done by Yu Kang)
                // Take the photo only when a face is detected
                await capturePhotoIfFaceDetected();
                
                // Re-enable capture button
                captureBtn.disabled = false;
                return;
            }
            
            countdownText.textContent = countdown;
            console.log('Countdown:', countdown);
        }, 1000);
    } catch (error) {
        console.error('Error in capturePhoto:', error);
        alert('Error capturing photo: ' + error.message);
    }
}

// Take photo from camera stream (desktop)
function takePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('photo-canvas');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    if (isMirrored) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
}

context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    photoData = canvas.toDataURL('image/png');
    
    // Stop camera stream after taking photo
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Immediately go to style page (don't save photo yet)
    continueToStyle();
}
// mirror function done by nick
function toggleMirror() {
    const video = document.getElementById('video');
    const invertBtn = document.getElementById('invert-btn');

    isMirrored = !isMirrored;

    if (isMirrored) {
        video.classList.add('mirror');
        invertBtn.textContent = '↩️ Normal View';
    } else {
        video.classList.remove('mirror');
        invertBtn.textContent = '🔄 Mirror View';
    }
}

// Continue to style page after photo capture
function continueToStyle() {
    if (photoData) {
        // Update the preview with properly positioned photo
        updatePreviewWithCutout();
        
        document.getElementById('photo-page').style.display = 'none';
        document.getElementById('style-page').style.display = 'flex';
        resetInactivityTimer();
    } else {
        alert('Please capture a photo first.');
    }
}

// Save original photo to server
function saveOriginalPhoto() {
    if (!photoData) return Promise.resolve();
    
    return fetch('/api/feedback/save-photo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            photo: photoData,
            userName: userData.name || 'anonymous',
            device: currentDevice
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Original photo saved successfully:', data);
        userData.photoId = data.filename;
        userData.device = currentDevice;
        return data;
    })
    .catch(error => {
        console.error('Error saving original photo:', error);
        throw error;
    });
}

// Save processed photo with overlay to server
function saveProcessedPhoto() {
    if (!userData.processedPhoto) return Promise.resolve();
    
    return fetch('/api/feedback/save-processed-photo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            photo: userData.processedPhoto,
            userName: userData.name || 'anonymous',
            device: currentDevice,
            theme: selectedTheme
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Processed photo saved:', data);
        userData.processedPhotoId = data.filename;
        return data;
    })
    .catch(error => {
        console.error('Error saving processed photo:', error);
        throw error;
    });
}


// ==================== 7. OVERLAY & THEME FUNCTIONS ====================

// Load overlay options from database
async function loadOverlayOptions() {
    const overlayOptions = document.getElementById('overlay-options');
    if (!overlayOptions) return;

    try {
        // Fetch overlays from the API
        const response = await fetch('/api/feedback/overlays');
        const data = await response.json();
        
        if (data.success && data.overlays.length > 0) {
            // Clear existing options
            overlayOptions.innerHTML = '';
            
            // Store overlay data including file paths for later use 
            overlayData = {};
            data.overlays.forEach(overlay => {
                overlayData[overlay.theme_id] = {
                    desktop_filename: overlay.desktop_filename,
                    mobile_filename: overlay.mobile_filename,
                    display_name: overlay.display_name
                };
            });
            console.log('Loaded overlay data from database:', overlayData);
            
            // Create theme options from database data
            data.overlays.forEach(overlay => {
                const themeOption = document.createElement('div');
                themeOption.className = 'theme-option';
                themeOption.onclick = () => selectTheme(overlay.theme_id, themeOption);
                
                // Generate a consistent color based on theme_id
                const color = generateColorFromThemeId(overlay.theme_id);
                
                themeOption.innerHTML = `
                    <div class="theme-swatch" style="background: ${color};"></div>
                    <div class="theme-name">${overlay.display_name}</div>
                `;
                
                overlayOptions.appendChild(themeOption);
            });

            // Select the first theme by default
            setTimeout(() => {
                const firstTheme = document.querySelector('.theme-option');
                if (firstTheme && data.overlays.length > 0) {
                    const firstThemeId = data.overlays[0].theme_id;
                    const firstThemeName = data.overlays[0].display_name;
                    selectTheme(firstThemeId, firstTheme);
                    
                    // Update the selected overlay name display
                    document.getElementById('selected-overlay-name').textContent = firstThemeName;
                }
            }, 100);
            
        } else {
            // Fallback to default themes if no overlays in database
            loadDefaultOverlayOptions();
        }
    } catch (error) {
        console.error('Error loading overlays:', error);
        // Fallback to default themes
        loadDefaultOverlayOptions();
    }
}

// Fallback function for default overlays
function loadDefaultOverlayOptions() {
    const overlayOptions = document.getElementById('overlay-options');
    if (!overlayOptions) return;
    
    const defaultThemes = [
        { theme_id: 'nature', display_name: 'Nature Theme' },
        { theme_id: 'modern', display_name: 'Modern Theme' },
        { theme_id: 'vintage', display_name: 'Vintage Theme' }
    ];
    
    defaultThemes.forEach(theme => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        themeOption.onclick = () => selectTheme(theme.theme_id, themeOption);
        
        const color = generateColorFromThemeId(theme.theme_id);
        
        themeOption.innerHTML = `
            <div class="theme-swatch" style="background: ${color};"></div>
            <div class="theme-name">${theme.display_name}</div>
        `;
        
        overlayOptions.appendChild(themeOption);
    });

    // Select first default theme
    setTimeout(() => {
        const firstTheme = document.querySelector('.theme-option');
        if (firstTheme) {
            selectTheme(defaultThemes[0].theme_id, firstTheme);
            document.getElementById('selected-overlay-name').textContent = defaultThemes[0].display_name;
        }
    }, 100);
}

// Generate consistent colors from theme_id
function generateColorFromThemeId(themeId) {
    const colors = [
        '#10b981', '#22c55e', '#06b6d4', '#84cc16', '#3b82f6',
        '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#6366f1'
    ];
    
    // Simple hash to get consistent color for same theme_id
    let hash = 0;
    for (let i = 0; i < themeId.length; i++) {
        hash = themeId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// Select theme and update preview
function selectTheme(theme, element) {
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedTheme = theme;
    
    // Update the selected overlay name display
    const selectedOption = element.querySelector('.theme-name');
    if (selectedOption) {
        document.getElementById('selected-overlay-name').textContent = selectedOption.textContent;
    }
    
    // Update preview with selected theme and device
    updateThemePreview();
    resetInactivityTimer();
}

// Update theme preview with correct file paths from database 
function updateThemePreview() {
    const overlayImage = document.getElementById('selected-overlay');
    
    // Get the correct path from overlayData (from database)
    let overlayPath;
    if (overlayData[selectedTheme]) {
        // Use the path from database - this works on both Windows and Linux
        overlayPath = currentDevice === 'mobile' 
            ? overlayData[selectedTheme].mobile_filename
            : overlayData[selectedTheme].desktop_filename;
        console.log('Using database path for theme:', selectedTheme, '| Path:', overlayPath);
    } else {
        // Fallback to constructed path for default themes
        overlayPath = `/assets/overlays/${currentDevice === 'mobile' ? 'MobileOverlay' : 'DesktopOverlay'}/${selectedTheme}Theme${currentDevice === 'mobile' ? 'Mobile' : 'Desktop'}.png`;
        console.log('Using constructed path (fallback) for theme:', selectedTheme, '| Path:', overlayPath);
    }
    
    console.log('Loading overlay from:', overlayPath);
    overlayImage.src = overlayPath;
    
    // Add error handler to help debug
    overlayImage.onerror = function() {
        console.error('❌ Failed to load overlay:', overlayPath);
        console.error('Current device:', currentDevice);
        console.error('Selected theme:', selectedTheme);
        console.error('Available overlay data:', overlayData);
    };
    
    // Also update the preview photo if it exists
    updatePreviewWithCutout();
}

// Update preview with cutout and overlay positioning
function updatePreviewWithCutout() {
    const previewPhoto = document.getElementById('preview-photo');
    const overlayImage = document.getElementById('selected-overlay');
    
    if (!previewPhoto || !overlayImage) return;
    
    const previewCanvas = document.createElement('canvas');
    const ctx = previewCanvas.getContext('2d');
    
    // Set canvas size to match preview frame
    const previewDimensions = {
        'desktop': { width: 800, height: 450 },
        'mobile': { width: 324, height: 405 }
    };
    
    const dimensions = previewDimensions[currentDevice];
    previewCanvas.width = dimensions.width;
    previewCanvas.height = dimensions.height;
    
    // Cutout dimensions and positions for preview (scaled down from original)
    const cutoutSpecs = {
        'desktop': {
            cutoutWidth: 640,  // 1536 * (800/1920)
            cutoutHeight: 360, // 864 * (450/1080)
            cutoutX: 80,       // 192 * (800/1920)
            cutoutY: 23        // 55 * (450/1080)
        },
        'mobile': {
            cutoutWidth: 259,  // 864 * (324/1080)
            cutoutHeight: 324, // 1080 * (405/1350)
            cutoutX: 32,       // 108 * (324/1080)
            cutoutY: 15        // 51 * (405/1350)
        }
    };
    
    const cutout = cutoutSpecs[currentDevice];
    
    const img = new Image();
    img.onload = function() {
        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Calculate scaling to fill the cutout (cover style)
        const scale = Math.max(
            cutout.cutoutWidth / img.width,
            cutout.cutoutHeight / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the scaled image in the cutout
        const x = cutout.cutoutX + (cutout.cutoutWidth - scaledWidth) / 2;
        const y = cutout.cutoutY + (cutout.cutoutHeight - scaledHeight) / 2;
        
        // Draw the scaled photo in the cutout area
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Update the preview image
        previewPhoto.src = previewCanvas.toDataURL('image/png');
        
        console.log('Preview updated with cutout positioning');
    };
    
    img.src = photoData;
}

// Process final photo with overlay for final submission
function processFinalPhoto() {
    return new Promise((resolve) => {
        if (!photoData) {
            resolve();
            return;
        }
        
        // Create a canvas to combine photo and overlay
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size based on device (full size)
        const deviceDimensions = {
            'desktop': { width: 1920, height: 1080 },
            'mobile': { width: 1080, height: 1350 }
        };
        
        const dimensions = deviceDimensions[currentDevice];
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Cutout dimensions and positions based on device (full size)
        const cutoutSpecs = {
            'desktop': {
                cutoutWidth: 1536,
                cutoutHeight: 864,
                cutoutX: 192,
                cutoutY: 55
            },
            'mobile': {
                cutoutWidth: 864,
                cutoutHeight: 1080,
                cutoutX: 108,
                cutoutY: 51
            }
        };
        
        const cutout = cutoutSpecs[currentDevice];
        
        // Load the original photo
        const img = new Image();
        img.onload = function() {
            // Fill background with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Calculate scaling to fill the cutout (cover style)
            const scale = Math.max(
                cutout.cutoutWidth / img.width,
                cutout.cutoutHeight / img.height
            );
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Centre the scaled image in the cutout
            const x = cutout.cutoutX + (cutout.cutoutWidth - scaledWidth) / 2;
            const y = cutout.cutoutY + (cutout.cutoutHeight - scaledHeight) / 2;
            
            // Draw the scaled photo in the cutout area
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Load and apply the overlay (border)
            const overlayImg = new Image();
            overlayImg.onload = function() {
                // Draw the overlay on top (this should be the border with transparent cutout)
                ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
                
                // Save the final processed photo data (but don't save to server yet)
                userData.processedPhoto = canvas.toDataURL('image/png');
                
                console.log('Final photo processed with overlay and proper cutout positioning');
                resolve();
            };
            
            // Get the correct path from overlayData (from database) 
            let overlayPath;
            if (overlayData[selectedTheme]) {
                // Use the path from database - this works on both Windows and Linux
                overlayPath = currentDevice === 'mobile' 
                    ? overlayData[selectedTheme].mobile_filename
                    : overlayData[selectedTheme].desktop_filename;
                console.log('Processing final photo with database path for theme:', selectedTheme, '| Path:', overlayPath);
            } else {
                // Fallback to constructed path for default themes
                overlayPath = `/assets/overlays/${currentDevice === 'mobile' ? 'MobileOverlay' : 'DesktopOverlay'}/${selectedTheme}Theme${currentDevice === 'mobile' ? 'Mobile' : 'Desktop'}.png`;
                console.log('Processing final photo with constructed path (fallback) for theme:', selectedTheme, '| Path:', overlayPath);
            }
            console.log('Processing final photo with overlay:', overlayPath);
            overlayImg.src = overlayPath;
            
            // If overlay fails to load, still proceed with the base photo
            overlayImg.onerror = function() {
                console.error('❌ Failed to load overlay for final processing:', overlayPath);
                console.error('Current device:', currentDevice);
                console.error('Selected theme:', selectedTheme);
                console.error('Available overlay data:', overlayData);
                userData.processedPhoto = canvas.toDataURL('image/png');
                resolve();
            };
        };
        
        img.src = photoData;
    });
}


// ==================== 8. PAGE NAVIGATION FUNCTIONS ====================

// Show consent page from landing page
function showConsentPage() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('consent-page').style.display = 'flex';
    resetInactivityTimer();
}

// Select retention option on consent page
function selectOption(option, element) {
    document.querySelectorAll('.retention-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedRetention = option;
    document.getElementById('proceedBtn').disabled = false;
    resetInactivityTimer();
}

// Show details page from consent page
function showDetailsPage() {
    if (selectedRetention) {
        document.getElementById('consent-page').style.display = 'none';
        document.getElementById('details-page').style.display = 'flex';
        resetInactivityTimer();
    }
}

// Retake photo from style page
function retakePhotoFromStyle() {
    // Hide style page
    document.getElementById('style-page').style.display = 'none';
    
    // Show appropriate photo page based on device
    if (currentDevice === 'mobile') {
        // For mobile users, go to file upload page
        document.getElementById('file-upload-page').style.display = 'flex';
    } else {
        // For desktop users, go to camera capture page
        document.getElementById('photo-page').style.display = 'flex';
        // Reinitialize camera for desktop
        initializeCamera();
    }
    
    resetInactivityTimer();
}

// Confirm style and proceed to confirmation page
function confirmStyle() {
    // Process the final photo with overlay but doesnt save yet
    processFinalPhoto().then(() => {
        document.getElementById('style-page').style.display = 'none';
        document.getElementById('confirmation-page').style.display = 'flex';
        resetInactivityTimer();
        
        // Update confirmation page details
        updateConfirmationDetails();
    });
}

// Update confirmation page with user data
function updateConfirmationDetails() {
    // Update confirmation page with user data
    document.getElementById('confirm-name').textContent = userData.name || 'Not provided';
    document.getElementById('confirm-email').textContent = userData.email || 'Not provided';
    document.getElementById('confirm-pledge').textContent = userData.pledge || 'Not provided';
    document.getElementById('confirm-theme').textContent = selectedTheme;
    document.getElementById('confirm-retention').textContent = selectedRetention === 'longterm' ? 'Long-Term' : '7 Days';
    
    // Show how many questions were answered
    const answeredCount = Object.keys(userData.answers || {}).length;
    document.getElementById('confirm-questions').textContent = `${answeredCount} questions answered`;
}

// Go back from confirmation to style page
function goBackToStyle() {
    document.getElementById('confirmation-page').style.display = 'none';
    document.getElementById('style-page').style.display = 'flex';
    resetInactivityTimer();
}

// Final submission with photo saving
function finalSubmit() {
    const submitBtn = document.querySelector('#confirmation-page .consent-button');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="white" stroke-width="1.5"/>
            <path d="M10 6V10L12 12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Submitting...
    `;
    submitBtn.disabled = true;
    
    // Clear inactivity timer since submission is in progress
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // Save photos and submit data only when user confirms
    Promise.all([
        saveOriginalPhoto(),
        saveProcessedPhoto()
    ]).then(() => {
        // Send final submission to server
        return fetch('/api/feedback/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userData: userData,
                device: currentDevice,
                theme: selectedTheme,
                retention: selectedRetention
            })
        });
    }).then(response => response.json())
    .then(data => {
        console.log('Feedback submitted successfully:', data);
        
        // Show thank you page
        document.getElementById('confirmation-page').style.display = 'none';
        document.getElementById('thankyou-page').style.display = 'flex';
        
        // Set up social share content for the thank-you page based on badge email status - done by XY
        setupSocialShare(data);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback. Please try again.');
        
        // Reset button on error
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Restart timer since submission failed
        startInactivityTimer();
    });
}

// Build share text and social media links for the final thank-you page
// Added by XY: social media sharing implementation
function getShareText() {
    const pledgeText = (userData.pledge || '').trim();
    const topicText = userData.pledgeTopic ? ` (${userData.pledgeTopic.replace('-', ' ')})` : '';
    const pledgeMessage = pledgeText ? `I just pledged: "${pledgeText}"${topicText}.` : 'I just made a sustainability pledge.';
    return `${pledgeMessage} Join me in supporting the Republic Polytechnic sustainability initiative! #RPGreen #Sustainability #ESG`;
}

function sharePledge(platform) {
    const text = getShareText();
    const encodedText = encodeURIComponent(text);
    let shareUrl = '';

    // Instagram share handling and share text fallback - done by XY
    if (platform === 'twitter') {
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    } else if (platform === 'whatsapp') {
        shareUrl = `https://wa.me/?text=${encodedText}`;
    } else if (platform === 'instagram') {
        if (navigator.share) {
            navigator.share({
                title: 'My RP ESG Pledge',
                text: text,
                url: window.location.href
            }).catch(() => {
                copyShareText();
                alert('Instagram share is available by copying text and pasting it into your Instagram story or post.');
            });
            return;
        }
        copyShareText();
        alert('Instagram cannot open directly. The share text has been copied so you can paste it into Instagram.');
        return;
    } else {
        return;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

function copyShareText() {
    const text = getShareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Share text copied to clipboard. Paste it into any social app!');
        }).catch(() => {
            alert('Unable to copy automatically. Please use manual share.');
        });
    } else {
        alert('Clipboard not available. Please copy the text manually.');
    }
}

function setupSocialShare(data) {
    const shareSection = document.getElementById('thankyou-share-section');
    const shareStatus = document.getElementById('thankyou-share-status');
    if (!shareSection || !shareStatus) return;

    // Configure the share section only after badge email status is known - done by XY
    const emailStatusText = data?.badgeEmailSent
        ? `Your badge email has been sent to ${data.email}. Share your pledge below!`
        : data?.emailQueued
            ? 'Your badge email is being queued and will be sent shortly. You can still share your pledge now.'
            : 'Share your pledge with others and help grow the sustainability movement.';

    shareStatus.textContent = emailStatusText;
    shareSection.style.display = 'block';
}

// Reset everything and return to landing page for new submission
function submitAnother() {
    // Stop camera stream if still active
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Reset all data
    selectedRetention = null;
    selectedTheme = 'nature';
    userData = {};
    photoData = null;
    
    // Reset forms
    document.querySelectorAll('form').forEach(form => form.reset());
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('proceedBtn').disabled = true;
    document.getElementById('char-count').textContent = '0';
    
    // Go back to landing page
    document.getElementById('thankyou-page').style.display = 'none';
    document.getElementById('landing-page').style.display = 'flex';
    
    // Restart inactivity timer
    startInactivityTimer();
}


// ==================== 9. BACK NAVIGATION FUNCTIONS ====================

// From Consent to Landing
function goBackToLanding() {
    document.getElementById('consent-page').style.display = 'none';
    document.getElementById('landing-page').style.display = 'flex';
    resetInactivityTimer();
}

// From Details to Consent
function goBackToConsent() {
    document.getElementById('details-page').style.display = 'none';
    document.getElementById('consent-page').style.display = 'flex';
    resetInactivityTimer();
}

// From Feedback to Details
function goBackToDetails() {
    document.getElementById('feedback-page').style.display = 'none';
    document.getElementById('details-page').style.display = 'flex';
    resetInactivityTimer();
}

// From Pledge to Feedback
function goBackToFeedback() {
    document.getElementById('pledge-page').style.display = 'none';
    document.getElementById('feedback-page').style.display = 'flex';
    resetInactivityTimer();
}

// From Photo/Upload to Pledge
function goBackToPledge() {
    // Stop camera stream if active (for desktop)
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Hide both photo pages
    document.getElementById('photo-page').style.display = 'none';
    document.getElementById('file-upload-page').style.display = 'none';
    
    // Show pledge page
    document.getElementById('pledge-page').style.display = 'flex';
    
    resetInactivityTimer();
}

// // From Style to Photo/Upload
// function goBackToPhoto() {
//     // Hide style page
//     document.getElementById('style-page').style.display = 'none';
    
//     // Show appropriate photo page based on device
//     if (currentDevice === 'mobile') {
//         document.getElementById('file-upload-page').style.display = 'flex';
//     } else {
//         document.getElementById('photo-page').style.display = 'flex';
//         // Reinitialize camera for desktop
//         initializeCamera();
//     }
    
//     resetInactivityTimer();
// }


// ==================== 10. EVENT LISTENERS & CLEANUP ====================

// Clean up camera when leaving page
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
});

// Add event listeners for user interactions to reset timer
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('touchstart', resetInactivityTimer);

// ==================== 11. PLEDGEBOARD NAVIGATION ====================

// Navigate to PLEDGEBOARD page
function viewPledgeboard() {
    window.location.href = '/pledgeboard';
}

// ==================== FORM UI CONFIGURATION ====================
// Load and apply form UI settings from server config

async function applyFormUIConfig() {
  try {
    const response = await fetch('/api/feedback/form-ui');
    const config = await response.json();

    // Apply background (CSS variable)
    if (config.background) {
      document.documentElement.style.setProperty('--form-bg', config.background);
    }

    // Apply landing page title
    const titleElement = document.getElementById('form-landing-title');
    if (titleElement && config.landingTitle) {
      titleElement.textContent = config.landingTitle;
    }

    // Apply landing page subtitle
    const subtitleElement = document.getElementById('form-landing-subtitle');
    if (subtitleElement && config.landingSubtitle) {
      subtitleElement.textContent = config.landingSubtitle;
    }
  } catch (error) {
    console.error('Error applying form UI configuration:', error);
  }
}

// Load countdown timer setting from server (DONE BY BERNISSA)
async function loadCountdownTimer() {
    try {
        console.log('Loading countdown timer setting...');
        const response = await fetch('/api/feedback/countdown-timer');
        const data = await response.json();
        
        if (data.success && typeof data.countdown_seconds === 'number') {
            countdownSeconds = data.countdown_seconds >= 0 ? data.countdown_seconds : 3;
            console.log(`Countdown timer loaded: ${countdownSeconds} seconds`);
        } else {
            console.warn('Invalid countdown data, using default');
            countdownSeconds = 3;
        }
    } catch (error) {
        console.error('Error loading countdown timer:', error);
        countdownSeconds = 3; // Fallback to default 3 seconds
    }
}

// ==================== MULTI-LANGUAGE SUPPORT ==================== done by Caeden

const translations = {
    en: {
        brandText: "Community Feedback Portal",
        landingTitle: "Let's turn your ideas into reality",
        landingSubtitle: "Share your thoughts and help us improve our services. Your feedback matters.",
        startButton: "Start Feedback Form",
        pledgeboardButton: "📜 View Pledgeboards",
        qrHeader: "Scan for Mobile Feedback",
        qrDescription: "Point your mobile camera here to open the feedback form on your phone",

        consentTitle: "Data Retention Consent",
        consentDescription: "Before we begin, please choose how long you'd like us to keep your feedback data",
        option7DaysTitle: "7 Days",
        option7DaysDescription: "Your feedback data will be deleted after 7 days.",
        optionLongTermTitle: "Long-Term",
        optionLongTermDescription: "Keep my data long-term for extended impact tracking",
        privacyNotice: "7 day Retention: Your photo and email is retained for 7 days then deleted. Your name and pledge may be displayed publicly.",
        continueFeedbackForm: "Continue to Feedback Form",

        detailsTitle: "Your Details",
        detailsDescription: "Please provide your name and email to continue",
        nameLabel: "Name",
        emailLabel: "Email Address",
        namePlaceholder: "Enter your name",
        emailPlaceholder: "Enter your email",
        continueToFeedback: "Continue to Feedback",
        back: "Back",

        feedbackTitle: "Share Your Feedback",
        feedbackDescription: "Your insights help us improve and serve you better",
        continueToPledge: "Continue to Pledge",

        pledgeTitle: "Make Your Pledge",
        pledgeDescription: "Share your commitment to making a positive impact",
        pledgeExamplesHeader: "Pledge Examples:",
        pledgeExample1: "Carry a reusable bottle and cutlery every day",
        pledgeExample2: "Sort waste properly and recycle whenever possible",
        pledgeExample3: "Reduce food waste by taking only what I can finish",
        pledgeLabel: "Your Pledge",
        pledgePlaceholder: "I pledge to...",
        charactersText: "500 characters",
        pledgePrivacy: "Your pledge will be displayed on our pledgeboard, inspiring others to take action",
        continueToPhoto: "Continue to Photo",

        photoTitle: "Capture Your Photo",
        photoDescription: "Your photo will sent to you through email",
        capturePhoto: "Capture Photo",

        uploadTitle: "Upload Your Photo",
        uploadDescription: "Please take a photo using your camera and upload it",
        uploadStep1: "Tap the button below to open your camera",
        uploadStep2: "Take a clear photo of yourself",
        uploadStep3: "Tap \"Use Photo\" to upload",
        uploadCamera: "Tap to Open Camera",
        uploadHint: "Your photo will be part of our community tree",
        continueToStyle: "Continue to Style Selection",
        retakeUpload: "Retake/Upload New Photo",

        styleTitle: "Choose Your Style",
        styleDescription: "Select your preferred overlay style for your RP memory photo!",
        availableOverlays: "Available Overlays",
        selectedLabel: "Selected:",
        useStyleContinue: "Use This Photo & Style & Continue",
        retakePhoto: "Retake Photo",

        confirmationTitle: "Confirm Submission",
        confirmationDescription: "Please review your information before submitting:",
        confirmName: "Name:",
        confirmEmail: "Email:",
        confirmQuestions: "Questions Answered:",
        confirmTheme: "Theme:",
        confirmRetention: "Data Retention:",
        confirmPledge: "Pledge:",
        confirmPhoto: "Photo:",
        confirmPhotoReady: "✅ Ready to be uploaded",
        confirmEmailPhoto: "Email Photo:",
        confirmEmailPhotoReady: "✅ Will be sent to your email",
        confirmPrimaryConsent: "Primary Consent:",
        confirmPrimaryConsentReady: "✅ Given",
        confirmationNote: "💡 You can go back to change the theme if needed",
        submitFeedback: "Submit Feedback",

        thankYouTitle: "Thank You! ☀️",
        thankYouMessage: "Your feedback has been recorded and a new leaf has been added to our digital tree!",
        emailSentTitle: "Your RP memory photo has been sent to your email!",
        emailSentDescription: "Please check your inbox within the next minute",
        thankYouFooter: "Thank you for contributing to our sustainability journey at Republic Polytechnic!",
        submitAnother: "Submit Another Feedback"
    },

    ms: {
        brandText: "Portal Maklum Balas Komuniti",
        landingTitle: "Mari jadikan idea anda satu kenyataan",
        landingSubtitle: "Kongsikan pandangan anda dan bantu kami menambah baik perkhidmatan kami. Maklum balas anda penting.",
        startButton: "Mula Borang Maklum Balas",
        pledgeboardButton: "📜 Lihat Papan Ikrar",
        qrHeader: "Imbas untuk Maklum Balas Mudah Alih",
        qrDescription: "Halakan kamera telefon anda di sini untuk membuka borang maklum balas pada telefon anda",

        consentTitle: "Persetujuan Penyimpanan Data",
        consentDescription: "Sebelum bermula, sila pilih tempoh masa anda mahu kami menyimpan data maklum balas anda",
        option7DaysTitle: "7 Hari",
        option7DaysDescription: "Data maklum balas anda akan dipadam selepas 7 hari.",
        optionLongTermTitle: "Jangka Panjang",
        optionLongTermDescription: "Simpan data saya untuk jangka panjang bagi penjejakan impak yang berterusan",
        privacyNotice: "Penyimpanan 7 hari: Foto dan e-mel anda disimpan selama 7 hari sebelum dipadam. Nama dan ikrar anda mungkin dipaparkan kepada umum.",
        continueFeedbackForm: "Teruskan ke Borang Maklum Balas",

        detailsTitle: "Butiran Anda",
        detailsDescription: "Sila masukkan nama dan e-mel anda untuk meneruskan",
        nameLabel: "Nama",
        emailLabel: "Alamat E-mel",
        namePlaceholder: "Masukkan nama anda",
        emailPlaceholder: "Masukkan e-mel anda",
        continueToFeedback: "Teruskan ke Maklum Balas",
        back: "Kembali",

        feedbackTitle: "Kongsi Maklum Balas Anda",
        feedbackDescription: "Pandangan anda membantu kami menambah baik dan melayani anda dengan lebih baik",
        continueToPledge: "Teruskan ke Ikrar",

        pledgeTitle: "Buat Ikrar Anda",
        pledgeDescription: "Kongsikan komitmen anda untuk memberi kesan positif",
        pledgeExamplesHeader: "Contoh Ikrar:",
        pledgeExample1: "Bawa botol dan sudu garpu guna semula setiap hari",
        pledgeExample2: "Asingkan sisa dengan betul dan kitar semula apabila boleh",
        pledgeExample3: "Kurangkan pembaziran makanan dengan mengambil hanya apa yang saya boleh habiskan",
        pledgeLabel: "Ikrar Anda",
        pledgePlaceholder: "Saya berikrar untuk...",
        charactersText: "500 aksara",
        pledgePrivacy: "Ikrar anda akan dipaparkan pada papan ikrar kami untuk memberi inspirasi kepada orang lain",
        continueToPhoto: "Teruskan ke Foto",

        photoTitle: "Ambil Foto Anda",
        photoDescription: "Foto anda akan dihantar kepada anda melalui e-mel",
        capturePhoto: "Ambil Foto",

        uploadTitle: "Muat Naik Foto Anda",
        uploadDescription: "Sila ambil foto menggunakan kamera anda dan muat naik",
        uploadStep1: "Tekan butang di bawah untuk membuka kamera anda",
        uploadStep2: "Ambil foto diri anda dengan jelas",
        uploadStep3: "Tekan \"Gunakan Foto\" untuk memuat naik",
        uploadCamera: "Tekan untuk Buka Kamera",
        uploadHint: "Foto anda akan menjadi sebahagian daripada pokok komuniti kami",
        continueToStyle: "Teruskan ke Pemilihan Gaya",
        retakeUpload: "Ambil Semula/Muat Naik Foto Baharu",

        styleTitle: "Pilih Gaya Anda",
        styleDescription: "Pilih gaya lapisan pilihan anda untuk foto memori RP anda!",
        availableOverlays: "Lapisan Tersedia",
        selectedLabel: "Dipilih:",
        useStyleContinue: "Gunakan Foto & Gaya Ini dan Teruskan",
        retakePhoto: "Ambil Semula Foto",

        confirmationTitle: "Sahkan Penghantaran",
        confirmationDescription: "Sila semak maklumat anda sebelum menghantar:",
        confirmName: "Nama:",
        confirmEmail: "E-mel:",
        confirmQuestions: "Soalan Dijawab:",
        confirmTheme: "Tema:",
        confirmRetention: "Penyimpanan Data:",
        confirmPledge: "Ikrar:",
        confirmPhoto: "Foto:",
        confirmPhotoReady: "✅ Sedia untuk dimuat naik",
        confirmEmailPhoto: "Foto E-mel:",
        confirmEmailPhotoReady: "✅ Akan dihantar ke e-mel anda",
        confirmPrimaryConsent: "Persetujuan Utama:",
        confirmPrimaryConsentReady: "✅ Diberikan",
        confirmationNote: "💡 Anda boleh kembali untuk menukar tema jika perlu",
        submitFeedback: "Hantar Maklum Balas",

        thankYouTitle: "Terima Kasih! ☀️",
        thankYouMessage: "Maklum balas anda telah direkodkan dan daun baharu telah ditambah pada pokok digital kami!",
        emailSentTitle: "Foto memori RP anda telah dihantar ke e-mel anda!",
        emailSentDescription: "Sila semak peti masuk anda dalam masa seminit",
        thankYouFooter: "Terima kasih kerana menyumbang kepada perjalanan kelestarian kami di Republic Polytechnic!",
        submitAnother: "Hantar Maklum Balas Lagi"
    },

    zh: {
        brandText: "社区反馈平台",
        landingTitle: "让您的想法成为现实",
        landingSubtitle: "分享您的想法，帮助我们改进服务。您的反馈很重要。",
        startButton: "开始反馈表",
        pledgeboardButton: "📜 查看承诺板",
        qrHeader: "扫描以使用手机反馈",
        qrDescription: "请将手机相机对准此处以在手机上打开反馈表",

        consentTitle: "数据保留同意",
        consentDescription: "在开始之前，请选择您希望我们保留您的反馈数据多长时间",
        option7DaysTitle: "7天",
        option7DaysDescription: "您的反馈数据将在7天后删除。",
        optionLongTermTitle: "长期",
        optionLongTermDescription: "长期保留我的数据以进行持续影响追踪",
        privacyNotice: "7天保留：您的照片和电子邮件将保留7天后删除。您的姓名和承诺可能会公开显示。",
        continueFeedbackForm: "继续到反馈表",

        detailsTitle: "您的资料",
        detailsDescription: "请输入您的姓名和电子邮件以继续",
        nameLabel: "姓名",
        emailLabel: "电子邮件地址",
        namePlaceholder: "请输入您的姓名",
        emailPlaceholder: "请输入您的电子邮件",
        continueToFeedback: "继续反馈",
        back: "返回",

        feedbackTitle: "分享您的反馈",
        feedbackDescription: "您的意见帮助我们改进并更好地为您服务",
        continueToPledge: "继续承诺",

        pledgeTitle: "作出您的承诺",
        pledgeDescription: "分享您为带来积极影响所作的承诺",
        pledgeExamplesHeader: "承诺示例：",
        pledgeExample1: "每天携带可重复使用的水瓶和餐具",
        pledgeExample2: "正确分类垃圾并尽可能回收",
        pledgeExample3: "只拿自己能吃完的食物以减少浪费",
        pledgeLabel: "您的承诺",
        pledgePlaceholder: "我承诺……",
        charactersText: "500个字符",
        pledgePrivacy: "您的承诺将显示在我们的承诺板上，激励其他人采取行动",
        continueToPhoto: "继续到照片",

        photoTitle: "拍摄您的照片",
        photoDescription: "您的照片将通过电子邮件发送给您",
        capturePhoto: "拍摄照片",

        uploadTitle: "上传您的照片",
        uploadDescription: "请使用相机拍照并上传",
        uploadStep1: "点击下方按钮打开相机",
        uploadStep2: "清楚地拍摄您自己的照片",
        uploadStep3: "点击“使用照片”以上传",
        uploadCamera: "点击打开相机",
        uploadHint: "您的照片将成为我们社区树的一部分",
        continueToStyle: "继续选择样式",
        retakeUpload: "重新拍摄/上传新照片",

        styleTitle: "选择您的样式",
        styleDescription: "为您的RP回忆照片选择您喜欢的叠加样式！",
        availableOverlays: "可用叠加层",
        selectedLabel: "已选择：",
        useStyleContinue: "使用此照片和样式并继续",
        retakePhoto: "重新拍摄照片",

        confirmationTitle: "确认提交",
        confirmationDescription: "提交前请检查您的信息：",
        confirmName: "姓名：",
        confirmEmail: "电子邮件：",
        confirmQuestions: "已回答问题：",
        confirmTheme: "主题：",
        confirmRetention: "数据保留：",
        confirmPledge: "承诺：",
        confirmPhoto: "照片：",
        confirmPhotoReady: "✅ 准备上传",
        confirmEmailPhoto: "邮件照片：",
        confirmEmailPhotoReady: "✅ 将发送到您的电子邮件",
        confirmPrimaryConsent: "主要同意：",
        confirmPrimaryConsentReady: "✅ 已给予",
        confirmationNote: "💡 如有需要，您可以返回更改主题",
        submitFeedback: "提交反馈",

        thankYouTitle: "谢谢您！☀️",
        thankYouMessage: "您的反馈已被记录，我们的数字树上新增了一片叶子！",
        emailSentTitle: "您的RP回忆照片已发送到您的电子邮件！",
        emailSentDescription: "请在一分钟内检查您的收件箱",
        thankYouFooter: "感谢您为Republic Polytechnic的可持续发展之旅作出贡献！",
        submitAnother: "再次提交反馈"
    },

    ta: {
        brandText: "சமூக கருத்து தளம்",
        landingTitle: "உங்கள் எண்ணங்களை நனவாக்கலாம்",
        landingSubtitle: "உங்கள் கருத்துகளை பகிர்ந்து எங்கள் சேவைகளை மேம்படுத்த உதவுங்கள். உங்கள் பின்னூட்டம் முக்கியமானது.",
        startButton: "பின்னூட்டப் படிவத்தை தொடங்கு",
        pledgeboardButton: "📜 உறுதிமொழி பலகையை காண்க",
        qrHeader: "மொபைல் பின்னூட்டத்திற்காக ஸ்கேன் செய்யவும்",
        qrDescription: "உங்கள் தொலைபேசியில் பின்னூட்டப் படிவத்தைத் திறக்க உங்கள் கேமராவை இங்கு நோக்குங்கள்",

        consentTitle: "தரவு சேமிப்பு ஒப்புதல்",
        consentDescription: "தொடங்குவதற்கு முன், உங்கள் பின்னூட்டத் தரவை எவ்வளவு காலம் வைத்திருக்க விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்",
        option7DaysTitle: "7 நாட்கள்",
        option7DaysDescription: "உங்கள் பின்னூட்டத் தரவு 7 நாட்களுக்கு பிறகு நீக்கப்படும்.",
        optionLongTermTitle: "நீண்ட காலம்",
        optionLongTermDescription: "தொடர்ந்த தாக்கத்தை கண்காணிக்க எனது தரவை நீண்ட காலம் வைத்திருக்கவும்",
        privacyNotice: "7 நாள் சேமிப்பு: உங்கள் புகைப்படமும் மின்னஞ்சலும் 7 நாட்கள் வைத்திருந்து பின்னர் நீக்கப்படும். உங்கள் பெயரும் உறுதிமொழியும் பொதுவாக காட்டப்படலாம்.",
        continueFeedbackForm: "பின்னூட்டப் படிவத்திற்கு தொடர்க",

        detailsTitle: "உங்கள் விவரங்கள்",
        detailsDescription: "தொடர உங்கள் பெயர் மற்றும் மின்னஞ்சலை வழங்கவும்",
        nameLabel: "பெயர்",
        emailLabel: "மின்னஞ்சல் முகவரி",
        namePlaceholder: "உங்கள் பெயரை உள்ளிடவும்",
        emailPlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
        continueToFeedback: "பின்னூட்டத்திற்கு தொடர்க",
        back: "பின்",

        feedbackTitle: "உங்கள் பின்னூட்டத்தை பகிரவும்",
        feedbackDescription: "உங்கள் கருத்துக்கள் எங்களை மேம்படுத்தவும் உங்களுக்கு சிறப்பாக சேவை செய்யவும் உதவுகின்றன",
        continueToPledge: "உறுதிமொழிக்கு தொடர்க",

        pledgeTitle: "உங்கள் உறுதிமொழியை வழங்கவும்",
        pledgeDescription: "நல்ல மாற்றத்தை உருவாக்கும் உங்கள் உறுதிப்பாட்டைப் பகிரவும்",
        pledgeExamplesHeader: "உறுதிமொழி எடுத்துக்காட்டுகள்:",
        pledgeExample1: "ஒவ்வொரு நாளும் மறுபயன்பாட்டு தண்ணீர் பாட்டிலும் உபகரணங்களும் எடுத்துச் செல்லுங்கள்",
        pledgeExample2: "கழிவுகளை சரியாக பிரித்து இயன்றபோது மறுசுழற்சி செய்யுங்கள்",
        pledgeExample3: "நான் முடிக்க முடியும் அளவிற்கு மட்டுமே உணவை எடுத்து உணவு வீணாவதை குறைப்பேன்",
        pledgeLabel: "உங்கள் உறுதிமொழி",
        pledgePlaceholder: "நான் உறுதிமொழி எடுக்கிறேன்...",
        charactersText: "500 எழுத்துகள்",
        pledgePrivacy: "உங்கள் உறுதிமொழி எங்கள் உறுதிமொழி பலகையில் காட்டப்படும், இது பிறரையும் செயல்பட தூண்டும்",
        continueToPhoto: "புகைப்படத்திற்கு தொடர்க",

        photoTitle: "உங்கள் புகைப்படத்தை எடுக்கவும்",
        photoDescription: "உங்கள் புகைப்படம் மின்னஞ்சல் மூலம் உங்களுக்கு அனுப்பப்படும்",
        capturePhoto: "புகைப்படம் எடு",

        uploadTitle: "உங்கள் புகைப்படத்தை பதிவேற்றவும்",
        uploadDescription: "தயவுசெய்து உங்கள் கேமராவைப் பயன்படுத்தி ஒரு புகைப்படம் எடுத்து பதிவேற்றவும்",
        uploadStep1: "உங்கள் கேமராவைத் திறக்க கீழே உள்ள பொத்தானை அழுத்தவும்",
        uploadStep2: "உங்கள் தெளிவான புகைப்படத்தை எடுக்கவும்",
        uploadStep3: "\"Use Photo\" என்பதை அழுத்தி பதிவேற்றவும்",
        uploadCamera: "கேமராவைத் திறக்கத் தட்டவும்",
        uploadHint: "உங்கள் புகைப்படம் எங்கள் சமூக மரத்தின் ஒரு பகுதியாக இருக்கும்",
        continueToStyle: "பாணி தேர்விற்கு தொடர்க",
        retakeUpload: "மீண்டும் எடுக்க/புதிய புகைப்படம் பதிவேற்ற",

        styleTitle: "உங்கள் பாணியைத் தேர்ந்தெடுக்கவும்",
        styleDescription: "உங்கள் RP நினைவு புகைப்படத்திற்கான விருப்ப ஓவர்லே பாணியைத் தேர்ந்தெடுக்கவும்!",
        availableOverlays: "கிடைக்கும் ஓவர்லேக்கள்",
        selectedLabel: "தேர்ந்தெடுக்கப்பட்டது:",
        useStyleContinue: "இந்த புகைப்படம் & பாணியை பயன்படுத்தி தொடர்க",
        retakePhoto: "மீண்டும் புகைப்படம் எடு",

        confirmationTitle: "சமர்ப்பிப்பை உறுதிப்படுத்தவும்",
        confirmationDescription: "சமர்ப்பிக்கும் முன் உங்கள் தகவலை சரிபார்க்கவும்:",
        confirmName: "பெயர்:",
        confirmEmail: "மின்னஞ்சல்:",
        confirmQuestions: "பதிலளிக்கப்பட்ட கேள்விகள்:",
        confirmTheme: "தீம்:",
        confirmRetention: "தரவு சேமிப்பு:",
        confirmPledge: "உறுதிமொழி:",
        confirmPhoto: "புகைப்படம்:",
        confirmPhotoReady: "✅ பதிவேற்ற தயாராக உள்ளது",
        confirmEmailPhoto: "மின்னஞ்சல் புகைப்படம்:",
        confirmEmailPhotoReady: "✅ உங்கள் மின்னஞ்சலுக்கு அனுப்பப்படும்",
        confirmPrimaryConsent: "முதன்மை ஒப்புதல்:",
        confirmPrimaryConsentReady: "✅ வழங்கப்பட்டது",
        confirmationNote: "💡 தேவைப்பட்டால் தீமையை மாற்ற நீங்கள் பின்னோக்கி செல்லலாம்",
        submitFeedback: "பின்னூட்டத்தை சமர்ப்பிக்கவும்",

        thankYouTitle: "நன்றி! ☀️",
        thankYouMessage: "உங்கள் பின்னூட்டம் பதிவு செய்யப்பட்டுள்ளது மற்றும் எங்கள் டிஜிட்டல் மரத்தில் ஒரு புதிய இலை சேர்க்கப்பட்டுள்ளது!",
        emailSentTitle: "உங்கள் RP நினைவு புகைப்படம் உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது!",
        emailSentDescription: "அடுத்த ஒரு நிமிடத்திற்குள் உங்கள் இன்பாக்ஸைச் சரிபார்க்கவும்",
        thankYouFooter: "Republic Polytechnic இன் நிலைத்தன்மை பயணத்திற்கு நீங்கள் வழங்கிய பங்களிப்பிற்கு நன்றி!",
        submitAnother: "மற்றொரு பின்னூட்டத்தை சமர்ப்பிக்கவும்"
    }
};

let currentLanguage = localStorage.getItem('kioskLanguage') || 'en';

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setPlaceholder(id, value) {
    const el = document.getElementById(id);
    if (el) el.placeholder = value;
}

function updateLanguageButtons() {
    document.querySelectorAll('.language-selector button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === currentLanguage) {
            btn.classList.add('active');
        }
    });
}

function applyTranslations() {
    const t = translations[currentLanguage];
    if (!t) return;

    setText('brand-text', t.brandText);
    setText('form-landing-title', t.landingTitle);
    setText('form-landing-subtitle', t.landingSubtitle);
    setText('start-feedback-btn', t.startButton);
    setText('view-pledgeboards-btn', t.pledgeboardButton);
    setText('qr-header-text', t.qrHeader);

    const qrDescription = document.getElementById('qr-description-text');
    if (qrDescription && !qrDescription.innerHTML.includes('Scan to open:')) {
        qrDescription.textContent = t.qrDescription;
    }

    setText('consent-title', t.consentTitle);
    setText('consent-description', t.consentDescription);
    setText('option-7days-title', t.option7DaysTitle);
    setText('option-7days-description', t.option7DaysDescription);
    setText('option-longterm-title', t.optionLongTermTitle);
    setText('option-longterm-description', t.optionLongTermDescription);
    setText('privacy-notice-text', t.privacyNotice);
    setText('continue-feedback-form-text', t.continueFeedbackForm);

    setText('details-title', t.detailsTitle);
    setText('details-description', t.detailsDescription);
    setText('name-label', t.nameLabel);
    setText('email-label', t.emailLabel);
    setPlaceholder('user-name', t.namePlaceholder);
    setPlaceholder('user-email', t.emailPlaceholder);
    setText('continue-to-feedback-text', t.continueToFeedback);
    setText('back-from-details-text', t.back);

    setText('feedback-title', t.feedbackTitle);
    setText('feedback-description', t.feedbackDescription);
    setText('continue-to-pledge-text', t.continueToPledge);
    setText('back-from-feedback-text', t.back);

    setText('pledge-title', t.pledgeTitle);
    setText('pledge-description', t.pledgeDescription);
    setText('pledge-examples-header', t.pledgeExamplesHeader);
    setText('pledge-example-1', t.pledgeExample1);
    setText('pledge-example-2', t.pledgeExample2);
    setText('pledge-example-3', t.pledgeExample3);
    setText('pledge-label', t.pledgeLabel);
    setPlaceholder('pledge-text', t.pledgePlaceholder);
    setText('characters-text', t.charactersText);
    setText('pledge-privacy-text', t.pledgePrivacy);
    setText('continue-to-photo-text', t.continueToPhoto);
    setText('back-from-pledge-text', t.back);

    setText('photo-title', t.photoTitle);
    setText('photo-description', t.photoDescription);
    setText('capture-photo-text', t.capturePhoto);
    setText('back-from-photo-text', t.back);

    setText('upload-title', t.uploadTitle);
    setText('upload-description', t.uploadDescription);
    setText('upload-step-1', t.uploadStep1);
    setText('upload-step-2', t.uploadStep2);
    setText('upload-step-3', t.uploadStep3);
    setText('upload-camera-text', t.uploadCamera);
    setText('upload-hint-text', t.uploadHint);
    setText('continue-to-style-text', t.continueToStyle);
    setText('back-from-upload-text', t.back);
    setText('retake-upload-text', t.retakeUpload);

    setText('style-title', t.styleTitle);
    setText('style-description', t.styleDescription);
    setText('available-overlays-title', t.availableOverlays);
    setText('selected-label-text', t.selectedLabel);
    setText('use-style-continue-text', t.useStyleContinue);
    setText('retake-photo-text', t.retakePhoto);

    setText('confirmation-title', t.confirmationTitle);
    setText('confirmation-description', t.confirmationDescription);
    setText('confirm-name-label', t.confirmName);
    setText('confirm-email-label', t.confirmEmail);
    setText('confirm-questions-label', t.confirmQuestions);
    setText('confirm-theme-label', t.confirmTheme);
    setText('confirm-retention-label', t.confirmRetention);
    setText('confirm-pledge-label', t.confirmPledge);
    setText('confirm-photo-label', t.confirmPhoto);
    setText('confirm-photo-ready', t.confirmPhotoReady);
    setText('confirm-email-photo-label', t.confirmEmailPhoto);
    setText('confirm-email-photo-ready', t.confirmEmailPhotoReady);
    setText('confirm-primary-consent-label', t.confirmPrimaryConsent);
    setText('confirm-primary-consent-ready', t.confirmPrimaryConsentReady);
    setText('confirmation-note-text', t.confirmationNote);
    setText('submit-feedback-text', t.submitFeedback);
    setText('back-from-confirmation-text', t.back);

    setText('thankyou-title', t.thankYouTitle);
    setText('thankyou-message', t.thankYouMessage);
    setText('email-sent-title', t.emailSentTitle);
    setText('email-sent-description', t.emailSentDescription);
    setText('thankyou-footer-text', t.thankYouFooter);
    setText('submit-another-btn', t.submitAnother);
    setText('thankyou-pledgeboards-btn', t.pledgeboardButton);

    updateLanguageButtons();
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('kioskLanguage', lang);
    applyTranslations();
}

// apply once page is ready
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        applyTranslations();
    }, 100);
});