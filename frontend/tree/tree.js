// ============================================================
// XY CHANGE SUMMARY (DONE BY XY)
// ============================================================
//
// 1. DIGITAL TREE LEAF PLACEMENT
//    class TreeManager                - Stable leaf placement on tree canopy instead of flying/floating leaves (DONE BY XY)
//    badgeConfig mapping              - Badge-specific labels, short labels and preferred leaf sides (DONE BY XY)
//
// 2. ACTIVE BADGE CLEANUP
//    badgeConfig mapping              - Uses Feedback Contributor plus 6 pledge-topic badges only (DONE BY XY)
//    Removed inactive badges          - Eco Warrior and Commitment Champion removed from tree mapping (DONE BY XY)
//
// 3. YEAR REVIEW BOOK
//    yearReviewToggle                 - Opens/closes the yearly review book from a corner button (DONE BY XY)
//    fetchYearReviewData()            - Loads yearly tree summary data from /api/tree/years (DONE BY XY)
//    turnReviewPage()                 - Flips between yearly review pages with animation (DONE BY XY)
//    demoYearsEnabled                 - Supports ?demoYears=1 preview years without database edits (DONE BY XY)
//
// 4. LEAF FALL AND MIDNIGHT GREEN RESET
//    leafFallThreshold                - Trigger full-batch leaf falling when the tree reaches the configured count (DONE BY XY)
//    getLeafCycleState()              - Clear fallen batches so the next pledge starts a new visible leaf batch (DONE BY XY)
//    leafGreenResetTime               - Turn badge-coloured leaves green after the configured daily reset time, default midnight (DONE BY XY)
//    shouldLeafBeGreen()              - Keep VIP leaves gold while older badge leaves become green after reset time (DONE BY XY)
//
// 5. INTERACTIVE LEAF DETAILS
//    bindLeafDetailControls()         - Close leaf detail card with button or Escape key (DONE BY XY)
//    openLeafDetail()                 - Show visitor display name, badge, date and pledge snippet on leaf click (DONE BY XY)
//    createLeaf()                     - Add click and keyboard handlers to each visible leaf (DONE BY XY)
//
// 6. LEAF FALL DEMO MODE
//    demoFallEnabled                  - Supports ?demoFall=1 live tree demo without database records (DONE BY XY)
//    createDemoFallVisitors()         - Builds browser-only demo leaves for lecturer animation demos (DONE BY XY)
//    parseDemoLeafCount()             - Supports ?leaves= and ?duration= controls for demo fall playback (DONE BY XY)
//
// FIND COMMAND
//    rg -n "XY CHANGE SUMMARY|DONE BY XY" frontend backend
//
// CAEDEN CHANGE SUMMARY (DONE BY CAEDEN)
// ============================================================
//
// 1. ADMIN-CONFIGURABLE TREE PARAMETERS
//    function fetchParameterConfig    - Load tree and visual settings from /api/parameters (DONE BY CAEDEN)
//    TreeManager canopy fields        - Apply configurable canopy size, offset, refresh rate and leaf appearance (DONE BY CAEDEN)
//    refreshTreeFromServer            - Refresh tree using admin-configured interval (DONE BY CAEDEN)
//
// FIND COMMAND
//    rg -n "DONE BY CAEDEN|CAEDEN CHANGE SUMMARY" frontend backend
// ============================================================
// YU KANG CHANGE SUMMARY (DONE BY YU KANG)
// ============================================================
//
// - Tree now supports a custom leaf image uploaded via the admin panel
//   and an adjustable display scale controlled by admin parameters.
//   Uploaded leaf assets are saved to ./assets/Tree/leaf and applied to
//   the visual tree when configured. (Done by Yu Kang)
//
// FIND COMMAND
//    rg -n "YU KANG CHANGE SUMMARY|DONE BY YU KANG" frontend backend
// ============================================================


// TREE.JS - TABLE OF CONTENTS
// ============================================================
//
// CLASS: TreeManager
//   - constructor()                    - Initialize TreeManager instance
//
// INITIALIZATION & SETUP
//   - init()                           - Initialize tree and load data
//   - loadTreeImage()                  - Load tree images with promises
//   - normalizeName()                  - Normalize names for VIP matching
//   - fetchVipNames()                  - Fetch VIP names from API (/api/tree/vip-names)
//   - isVipName()                      - Check if a visitor name is VIP (using vipNames Set)
//   - fetchVisitorData()               - Fetch visitor data from API (/api/tree)
//
// TREE VISUALIZATION
//   - createLeaves()                   - Create leaf elements for visitors
//   - calculateOvalArea()              - Calculate oval area (fallback only)
//   - updateOvalOverlay()              - Update debug overlay (optional)
//   - buildMaskCanvas()                - Build offscreen canvas from stage4leaves.png
//   - findRandomPositionInLeavesMask() - Find random position inside mask
//   - createLeaf()                     - Create an individual leaf
//   - findRandomPositionInOval()       - Fallback placement
//
// VISUAL EFFECTS & UPDATES
//   - updateLeavesTransparency()        - Keep mask image ALWAYS hidden
//   - refreshTree()                    - Refresh tree visualization
//
// CONFIGURATION
//   - setOvalPosition()                - Set oval offset (fallback only)
//   - addVisitor()                     - Manual test add
//
// GLOBAL LISTENERS
//   - on load                          - Init
//   - setInterval refresh              - Refresh every 30s (VIP + visitors)
//   - resize                           - Refresh on resize
// ============================================================

class TreeManager {

    constructor() {
        // DOM Elements
        this.treeImage = document.getElementById('treeImage');
        this.treeImageLeaves = document.getElementById('treeImageLeaves');
        this.leavesContainer = document.getElementById('leavesContainer');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.treeTitleBox = document.querySelector('.tree-title');
        this.treeTitle = document.getElementById('treeTitle');
        this.treeSubtitle = document.getElementById('treeSubtitle');
        this.yearReviewToggle = document.getElementById('yearReviewToggle');
        this.treeDemoControls = document.getElementById('treeDemoControls');
        this.demoLandingButton = document.getElementById('demoLandingButton');
        this.demoFallingButton = document.getElementById('demoFallingButton');
        this.yearReviewBook = document.getElementById('yearReviewBook');
        this.bookYear = document.getElementById('bookYear');
        this.bookCount = document.getElementById('bookCount');
        this.reviewTreePreview = document.getElementById('reviewTreePreview');
        this.bookPrevButton = document.getElementById('bookPrevButton');
        this.bookNextButton = document.getElementById('bookNextButton');
        this.bookViewButton = document.getElementById('bookViewButton');
        this.bookLiveButton = document.getElementById('bookLiveButton');
        this.bookCloseButton = document.getElementById('bookCloseButton');
        this.bookTurnSheet = document.getElementById('bookTurnSheet');
        this.bookTurnYear = document.getElementById('bookTurnYear');
        this.leafDetailCard = document.getElementById('leafDetailCard');
        this.leafDetailClose = document.getElementById('leafDetailClose');
        this.leafDetailPrivacy = document.getElementById('leafDetailPrivacy');
        this.leafDetailName = document.getElementById('leafDetailName');
        this.leafDetailBadge = document.getElementById('leafDetailBadge');
        this.leafDetailDate = document.getElementById('leafDetailDate');
        this.leafDetailSnippet = document.getElementById('leafDetailSnippet');

        // Data
        this.visitors = [];
        this.currentYear = new Date().getFullYear();
        this.selectedYear = this.currentYear;
        this.reviewYears = [];
        this.reviewIndex = 0;
        this.isReviewMode = false;
        this.isBookOpen = false;
        this.urlParams = new URLSearchParams(window.location.search);
        this.demoYearsEnabled = this.urlParams.get('demoYears') === '1';
        this.demoFallEnabled = this.urlParams.get('demoFall') === '1';
        this.demoFallLeafCount = this.parseDemoLeafCount(this.urlParams.get('leaves'));
        this.isBookFlipping = false;

        // VIP Names (for golden leaves)
        this.vipNames = new Set();

        this.badgeLeafProfiles = {
            'feedback-completer': {
                label: 'Feedback Contributor',
                shortLabel: 'Feedback',
                className: 'badge-feedback',
                preferredSide: null
            },
            'climate-champion': {
                label: 'Climate Champion',
                shortLabel: 'Climate',
                className: 'badge-climate',
                preferredSide: 'LeftLeaf.png'
            },
            'renewable-innovator': {
                label: 'Renewable Innovator',
                shortLabel: 'Energy',
                className: 'badge-renewable',
                preferredSide: 'RightLeaf.png'
            },
            'sustainable-living-advocate': {
                label: 'Sustainable Living Advocate',
                shortLabel: 'Living',
                className: 'badge-sustainable',
                preferredSide: 'LeftLeaf.png'
            },
            'ocean-guardian': {
                label: 'Ocean Guardian',
                shortLabel: 'Ocean',
                className: 'badge-ocean',
                preferredSide: 'RightLeaf.png'
            },
            'governance-guardian': {
                label: 'Governance Guardian',
                shortLabel: 'Ethics',
                className: 'badge-governance',
                preferredSide: 'LeftLeaf.png'
            },
            'social-champion': {
                label: 'Social Champion',
                shortLabel: 'Social',
                className: 'badge-social',
                preferredSide: 'RightLeaf.png'
            }
        };

        // ====================================================
        // CANOPY AREA (UPDATED: smaller + moved up)
        // ====================================================
        // These control where leaves are allowed to spawn.
        // Smaller area prevents leaves from appearing outside branches.
        this.ovalWidth = 850;
        this.ovalHeight = 300;
        this.ovalTopOffset = -100;
        this.leafRefreshInterval = 30000;
        this.leafOpacity = 0.9;
        this.leafAnimationDuration = 500;
        this.leafFallThreshold = 15;
        this.leafFallDuration = 4200;
        this.leafGreenResetTime = '00:00';
        this.leafDisplayScale = 1;
        this.vipLeafDisplayScale = 1;
        this.badgeLeafColors = {};
        this.treeStage = 0;
        this.showTitleBox = true;
        this.activeCampaign = null;
        this.leafFallStarted = false;
        this.leafGreenified = false;
        this.leafGreenTimer = null;
        this.leafFallCycleNumber = 0;
        this.initialVisitorSnapshotReady = false;
        this.knownLeafKeys = new Set();
        this.pendingLandingLeafKeys = new Set();
        this.landingCleanupTimers = new Map();
        this.recentLandingWindowMs = 2 * 60 * 1000;
        this.demoLandingEnabled = this.urlParams.get('demoLanding') === '1';
        this.demoLandingRunNumber = 0;
        this.manualDemoFallActive = false;
        this.demoMotionTimer = null;
        this.liveTreeRefreshInterval = 5000;
        this.leafGlowDurationMs = 10 * 60 * 1000; //Timing for leaf glow effect (10 minutes)
        this.leafGlowRefreshInterval = 1000;
        this.leafGlowTimer = null;
        this.activeLeafCycle = null;

        // Mask cache
        this.maskData = null;

        // Debug overlay toggle (set true if you want to see an oval)
        this.debugOval = false;

        this.init();

    }

    // ==================== TREE TITLE BOX ====================
    applyTreeTitleSettings() {
        if (!this.treeTitleBox) return;

        const settings = this.visualAssets?.treeTitleBox;
        // Respect the admin visibility toggle before applying any styling.
        if (!this.showTitleBox) {
            this.treeTitleBox.style.display = 'none';
            return;
        }

        this.treeTitleBox.style.display = 'block';

        // Update text content
        const titleEl = document.getElementById('treeTitle');
        const subtitleEl = document.getElementById('treeSubtitle');
        if (titleEl) titleEl.textContent = settings?.titleText || '🌳 ESG Digital Tree';
        if (subtitleEl) subtitleEl.textContent = settings?.subtitleText || 'Growing with every visitor\'s contribution this year';

        // Defaults
        const opacity = settings?.opacity ?? 0.25;
        const blur = settings?.blur ?? 6;
        const radius = settings?.radius ?? 25;
        const position = settings?.position ?? 'top-center';
        const padX = settings?.paddingX ?? 30;
        const padY = settings?.paddingY ?? 15;

        // --- Fixed positioning relative to viewport ---
        this.treeTitleBox.style.position = 'fixed';
        this.treeTitleBox.style.margin = '0';
        this.treeTitleBox.style.boxSizing = 'border-box';
        this.treeTitleBox.style.maxWidth = 'calc(100% - 40px)';   // always leaves 20px on each side
        this.treeTitleBox.style.wordBreak = 'break-word';         // prevent overflow from long words

        // Reset all positioning properties
        this.treeTitleBox.style.top = 'auto';
        this.treeTitleBox.style.bottom = 'auto';
        this.treeTitleBox.style.left = 'auto';
        this.treeTitleBox.style.right = 'auto';
        this.treeTitleBox.style.transform = 'none';

        const MARGIN = 20; // consistent gap from edges

        switch (position) {
            case 'top-left':
                this.treeTitleBox.style.top = MARGIN + 'px';
                this.treeTitleBox.style.left = MARGIN + 'px';
                break;
            case 'top-center':
                this.treeTitleBox.style.top = MARGIN + 'px';
                this.treeTitleBox.style.left = '50%';
                this.treeTitleBox.style.transform = 'translateX(-50%)';
                break;
            case 'top-right':
                this.treeTitleBox.style.top = MARGIN + 'px';
                this.treeTitleBox.style.right = MARGIN + 'px';
                break;
            case 'bottom-left':
                this.treeTitleBox.style.bottom = MARGIN + 'px';
                this.treeTitleBox.style.left = MARGIN + 'px';
                break;
            case 'bottom-center':
                this.treeTitleBox.style.bottom = MARGIN + 'px';
                this.treeTitleBox.style.left = '50%';
                this.treeTitleBox.style.transform = 'translateX(-50%)';
                break;
            case 'bottom-right':
                this.treeTitleBox.style.bottom = MARGIN + 'px';
                this.treeTitleBox.style.right = MARGIN + 'px';
                break;
            default:
                // fallback to top-center
                this.treeTitleBox.style.top = MARGIN + 'px';
                this.treeTitleBox.style.left = '50%';
                this.treeTitleBox.style.transform = 'translateX(-50%)';
        }

        // Apply other styles
        this.treeTitleBox.style.padding = `${padY}px ${padX}px`;
        this.treeTitleBox.style.borderRadius = `${radius}px`;
        this.treeTitleBox.style.background = `rgba(255,255,255,${opacity})`;
        this.treeTitleBox.style.backdropFilter = `blur(${blur}px)`;
        this.treeTitleBox.style.webkitBackdropFilter = `blur(${blur}px)`;
    }

    // ==================== INIT ====================

    async init() {
        try {
            await this.fetchParameterConfig();
            await this.loadTreeImage();

            // Force mask image hidden always
            this.updateLeavesTransparency();

            // Build mask from stage4leaves.png
            this.maskData = this.buildMaskCanvas();

            // Load VIP list first, then visitors
            this.bindYearReviewControls();
            this.bindLeafDetailControls();
            this.bindDemoControls();
            await this.fetchVipNames();
            await this.fetchYearReviewData();
            await this.fetchVisitorData(this.currentYear);
            this.updateTreeHeading();
            this.renderYearReviewBook();

            this.createLeaves();
            this.startLeafGlowMonitor();
        } catch (err) {
            console.error('Init error:', err);
        } finally {
            if (this.loadingMessage) {
                this.loadingMessage.style.display = 'none';
            }
        }
    }

    async fetchParameterConfig() {
        try {
            const response = await fetch('/api/parameters');
            const data = await response.json();
            if (!response.ok || !data.success) return;

            const tree = data.parameters?.treeParameters || {};
            const assets = data.parameters?.visualAssets || {};
            const campaign = data.parameters?.campaignSettings || {};
            const badgeLeafStyles = data.parameters?.badgeLeafStyles || {};

            this.ovalWidth = Number(tree.ovalWidth) || this.ovalWidth;
            this.ovalHeight = Number(tree.ovalHeight) || this.ovalHeight;
            this.ovalTopOffset = Number(tree.ovalTopOffset) || this.ovalTopOffset;
            this.leafRefreshInterval = Number(tree.leafRefreshInterval) || this.leafRefreshInterval;
            this.leafOpacity = Number(tree.leafOpacity) || this.leafOpacity;
            this.leafAnimationDuration = Number(tree.leafAnimationDuration) || this.leafAnimationDuration;
            this.leafFallThreshold = Number(tree.leafFallThreshold) || this.leafFallThreshold;
            this.leafFallDuration = Number(tree.leafFallDuration) || this.leafFallDuration;
            this.leafGreenResetTime = this.normalizeResetTime(tree.leafGreenResetTime) || this.leafGreenResetTime;
            this.treeStage = this.normalizeTreeStage(tree.treeStage);
            this.showTitleBox = tree.showTitleBox !== false;
            this.activeCampaign = campaign.enabled === true ? campaign : null;
            this.applyTitleBoxVisibility();

            this.applyTreeStageAssets(this.treeStage);

            // treeTitleBox is saved under treeParameters by admin.js
            this.visualAssets = assets || {};
            if (tree.treeTitleBox) {
                this.visualAssets.treeTitleBox = tree.treeTitleBox;
            }

            this.applyTreeTitleSettings();

            if (this.demoFallEnabled) {
                this.leafFallThreshold = this.demoFallLeafCount || this.leafFallThreshold;
                this.leafFallDuration = Math.min(Number(this.urlParams.get('duration')) || this.leafFallDuration, 10000);
            }

            if (assets.treeBackground) {
                document.body.style.backgroundImage = `url('${assets.treeBackground}')`;
            }
            // Leaf override image and shared display scale
            const configuredLeafScale = Number(tree.leafDisplayScale);
            const configuredVipLeafScale = Number(tree.vipLeafDisplayScale);
            const configuredBadgeLeafScale = Number(badgeLeafStyles.leafScale);
            this.leafDisplayScale = Number.isFinite(configuredLeafScale)
                ? configuredLeafScale
                : (Number.isFinite(configuredBadgeLeafScale) ? configuredBadgeLeafScale : 1);
            this.vipLeafDisplayScale = Number.isFinite(configuredVipLeafScale)
                ? configuredVipLeafScale
                : this.leafDisplayScale;
            this.badgeLeafColors = {
                ...Object.fromEntries(Object.keys(this.badgeLeafProfiles).map(key => [key, '#4a7c59'])),
                ...(badgeLeafStyles.colors || {})
            };
            this.leafOverrideImage = assets.leafImage
                ? (assets.leafImage.startsWith('/') ? assets.leafImage : `/assets/Tree/leaf/${assets.leafImage}`)
                : null;
            this.vipLeafOverrideImage = assets.vipLeafImage
                ? (assets.vipLeafImage.startsWith('/') ? assets.vipLeafImage : `/assets/Tree/vip-leaf/${assets.vipLeafImage}`)
                : null;
        } catch (error) {
            console.warn('Tree parameter config unavailable:', error);
        }
    }

    applyTitleBoxVisibility() {
        if (this.treeTitleBox) {
            this.treeTitleBox.style.display = this.showTitleBox ? 'block' : 'none';
        }
    }

    normalizeTreeStage(rawStage) {
        const parsed = Number(rawStage);
        if (!Number.isInteger(parsed)) {
            return 0;
        }
        return Math.max(0, Math.min(4, parsed));
    }

    stageHasLeaves() {
        return this.normalizeTreeStage(this.treeStage) > 0;
    }

    stageLeavesShouldShiftUp() {
        const stage = this.normalizeTreeStage(this.treeStage);
        return stage >= 1 && stage <= 3;
    }

    applyTreeStageAssets(stageNumber) {
        const stage = this.normalizeTreeStage(stageNumber);
        this.treeStage = stage;

        if (this.treeImage) {
            this.treeImage.src = `/assets/Tree/stage${stage}.png`;
        }

        if (this.treeImageLeaves) {
            this.treeImageLeaves.src = `/assets/Tree/stage${stage}leaves.png`;
        }

        this.updateStageLeavesVisibility();
    }

    loadTreeImage() {
        return new Promise((resolve) => {
            const stage = this.normalizeTreeStage(this.treeStage);
            const trunkSources = [
                `/assets/Tree/stage/stage${stage}.png`,
                `/assets/Tree/stage${stage}.png`,
                '/assets/Tree/stage0.png'
            ];
            const leavesSources = [
                `/assets/Tree/stage/stage${stage}leaves.png`,
                `/assets/Tree/stage${stage}leaves.png`,
                '/assets/Tree/stage/stage4leaves.png',
                '/assets/Tree/stage4leaves.png'
            ];

            const leavesPromise = this.stageHasLeaves()
                ? this.loadImageWithFallback(this.treeImageLeaves, leavesSources)
                : Promise.resolve(true);

            Promise.all([
                this.loadImageWithFallback(this.treeImage, trunkSources),
                leavesPromise
            ]).finally(resolve);
        });
    }

        loadImageWithFallback(imageEl, sourceCandidates) {
            return new Promise((resolve) => {
                if (!imageEl || !Array.isArray(sourceCandidates) || sourceCandidates.length === 0) {
                    resolve(false);
                    return;
                }

            let index = 0;
            const tryNext = () => {
                if (index >= sourceCandidates.length) {
                    imageEl.onload = null;
                    imageEl.onerror = null;
                    resolve(false);
                    return;
                }

                const source = sourceCandidates[index];
                index += 1;

                imageEl.onload = () => {
                    imageEl.onload = null;
                    imageEl.onerror = null;
                    resolve(true);
                };

                imageEl.onerror = () => {
                    tryNext();
                };

                imageEl.src = source;
            };

            tryNext();
        });
    }

    // ==================== VIP HELPERS ====================

    normalizeName(name) {
        return String(name || '').trim().toLowerCase();
    }

    async fetchVipNames() {
        try {
            const response = await fetch('/api/tree/vip-names');
            const data = await response.json();

            const list = Array.isArray(data.vipNames) ? data.vipNames : [];
            this.vipNames = new Set(list.map(n => this.normalizeName(n)));

            console.log(`✅ Loaded ${this.vipNames.size} VIP names`);
        } catch (error) {
            console.error('❌ Error fetching VIP names:', error);
            this.vipNames = new Set();
        }
    }

    isVipName(name) {
        return this.vipNames.has(this.normalizeName(name));
    }

    getBadgeLeafProfile(visitor) {
        const badgeKey = visitor && visitor.badgeKey ? visitor.badgeKey : 'feedback-completer';
        return this.badgeLeafProfiles[badgeKey] || this.badgeLeafProfiles['feedback-completer'];
    }

    getBadgeLeafColor(visitor) {
        const badgeKey = visitor && visitor.badgeKey ? visitor.badgeKey : 'feedback-completer';
        return this.badgeLeafColors[badgeKey] || visitor?.badgeColor || '#4a7c59';
    }

    normalizeResetTime(value) {
        const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
        return match ? `${match[1]}:${match[2]}` : null;
    }

    getCurrentGreenResetDate(now = new Date()) {
        const [hours, minutes] = (this.normalizeResetTime(this.leafGreenResetTime) || '00:00')
            .split(':')
            .map(Number);
        const reset = new Date(now);
        reset.setHours(hours, minutes, 0, 0);

        if (now < reset) {
            reset.setDate(reset.getDate() - 1);
        }

        return reset;
    }

    shouldLeafBeGreen(visitor, isVip) {
        if (isVip) return false;
        const createdAt = new Date(visitor?.created_at);
        if (Number.isNaN(createdAt.getTime())) return false;
        return createdAt < this.getCurrentGreenResetDate();
    }

    getLeafGlowTimestamp(visitor) {
        const sourceValue = visitor?.user_created_at || visitor?.created_at;
        const createdAt = new Date(sourceValue);
        return Number.isNaN(createdAt.getTime()) ? null : createdAt;
    }

    shouldLeafGlow(visitor) {
        const createdAt = this.getLeafGlowTimestamp(visitor);
        if (!createdAt) return false;

        const ageMs = Date.now() - createdAt.getTime();
        return ageMs >= 0 && ageMs <= this.leafGlowDurationMs;
    }

    syncLeafGlowStates() {
        if (!this.leavesContainer) return;

        const now = Date.now();
        const leaves = Array.from(this.leavesContainer.querySelectorAll('.leaf'));
        leaves.forEach((leaf) => {
            const glowTimestamp = new Date(leaf.dataset.leafGlowTimestamp || '');
            const isGlowing = !Number.isNaN(glowTimestamp.getTime())
                && (now - glowTimestamp.getTime()) >= 0
                && (now - glowTimestamp.getTime()) <= this.leafGlowDurationMs;

            leaf.classList.toggle('leaf-neon-glow', isGlowing);
        });
    }

    startLeafGlowMonitor() {
        if (this.leafGlowTimer) {
            window.clearInterval(this.leafGlowTimer);
        }

        this.syncLeafGlowStates();
        this.leafGlowTimer = window.setInterval(() => {
            this.syncLeafGlowStates();
        }, this.leafGlowRefreshInterval);
    }

    getVisitorSeed(visitor, index) {
        return [
            visitor.id || visitor.feedback_id || '',
            visitor.name || 'visitor',
            visitor.created_at || '',
            visitor.badgeKey || '',
            index
        ].join('|');
    }

    getLeafKey(visitor, index = 0) {
        const id = visitor?.feedback_id || visitor?.id;
        if (id !== undefined && id !== null && String(id).trim() !== '') {
            return `feedback:${String(id).trim()}`;
        }

        return [
            'leaf',
            visitor?.created_at || '',
            visitor?.name || 'visitor',
            visitor?.badgeKey || '',
            index
        ].join('|');
    }

    isRecentLandingCandidate(visitor) {
        const createdAt = new Date(visitor?.created_at);
        if (Number.isNaN(createdAt.getTime())) return false;

        const age = Date.now() - createdAt.getTime();
        return age >= 0 && age <= this.recentLandingWindowMs;
    }

    updateLandingLeafState(nextVisitors) {
        const visitors = Array.isArray(nextVisitors) ? nextVisitors : [];
        const nextKeys = new Set(visitors.map((visitor, index) => this.getLeafKey(visitor, index)));

        if (this.isReviewMode || this.demoFallEnabled) {
            this.knownLeafKeys = nextKeys;
            this.initialVisitorSnapshotReady = true;
            return;
        }

        if (!this.initialVisitorSnapshotReady) {
            const recentVisitors = visitors.filter(visitor => this.isRecentLandingCandidate(visitor));
            const landingVisitors = this.demoLandingEnabled && visitors.length
                ? [visitors[visitors.length - 1]]
                : recentVisitors.slice(-3);

            landingVisitors.forEach((visitor) => {
                const index = visitors.findIndex(candidate => candidate === visitor);
                this.pendingLandingLeafKeys.add(this.getLeafKey(visitor, Math.max(0, index)));
            });

            this.knownLeafKeys = nextKeys;
            this.initialVisitorSnapshotReady = true;
            return;
        }

        visitors.forEach((visitor, index) => {
            const key = this.getLeafKey(visitor, index);
            if (!this.knownLeafKeys.has(key)) {
                this.pendingLandingLeafKeys.add(key);
            }
        });

        this.knownLeafKeys = nextKeys;
    }

    hashString(value) {
        let hash = 2166136261;
        const text = String(value || '');

        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        return hash >>> 0;
    }

    createSeededRandom(seed) {
        let state = this.hashString(seed) || 1;

        return () => {
            state = Math.imul(1664525, state) + 1013904223;
            return (state >>> 0) / 4294967296;
        };
    }

    parseDemoLeafCount(value) {
        const count = Number(value);
        if (!Number.isInteger(count) || count < 1 || count > 80) return null;
        return count;
    }

    // ==================== DATA ====================

    async fetchVisitorData(year = this.selectedYear) {
        if (this.demoFallEnabled && !this.isReviewMode) {
            const count = this.demoFallLeafCount || Math.max(1, Number(this.leafFallThreshold) || 15);
            this.leafFallThreshold = count;
            this.visitors = this.createDemoFallVisitors(count);
            console.log(`Loaded ${this.visitors.length} demo fall visitors`);
            return;
        }

        try {
            const query = year ? `?year=${encodeURIComponent(year)}` : '';
            const response = await fetch(`/api/tree${query}`);
            const data = await response.json();

            this.visitors = Array.isArray(data) ? data : [];
            if (this.demoLandingEnabled && !this.isReviewMode && !this.visitors.length) {
                this.visitors = [this.createDemoLandingVisitor()];
            }
            this.updateLandingLeafState(this.visitors);
            console.log(`Loaded ${this.visitors.length} visitors`);
        } catch (error) {
            console.error('Error fetching visitor data:', error);
            this.visitors = this.demoLandingEnabled && !this.isReviewMode
                ? [this.createDemoLandingVisitor()]
                : [];
            this.updateLandingLeafState(this.visitors);
        }
    }

    async fetchYearReviewData() {
        try {
            const response = await fetch('/api/tree/years');
            const data = await response.json();

            this.currentYear = Number(data.currentYear) || new Date().getFullYear();
            this.selectedYear = this.isReviewMode ? this.selectedYear : this.currentYear;
            this.reviewYears = Array.isArray(data.years) ? data.years : [];
            this.addDemoYearsIfNeeded();

            if (!this.reviewYears.some(item => Number(item.year) === this.currentYear)) {
                this.reviewYears.unshift({
                    year: this.currentYear,
                    leafCount: 0,
                    isCurrentYear: true
                });
            }

            if (!this.reviewYears.length) {
                this.reviewYears = [{
                    year: this.currentYear,
                    leafCount: 0,
                    isCurrentYear: true
                }];
            }

            const activeIndex = this.reviewYears.findIndex(item => Number(item.year) === this.selectedYear);
            this.reviewIndex = activeIndex >= 0 ? activeIndex : 0;
        } catch (error) {
            console.error('Error fetching tree year review data:', error);
            this.reviewYears = [{
                year: this.currentYear,
                leafCount: this.visitors.length,
                isCurrentYear: true
            }];
            this.addDemoYearsIfNeeded();
            this.reviewIndex = 0;
        }
    }

    addDemoYearsIfNeeded() {
        if (!this.demoYearsEnabled) return;

        const demoYears = [
            { year: this.currentYear - 1, leafCount: 48 },
            { year: this.currentYear - 2, leafCount: 72 },
            { year: this.currentYear - 3, leafCount: 35 }
        ];

        demoYears.forEach((demoYear) => {
            const hasYear = this.reviewYears.some(item => Number(item.year) === demoYear.year);
            if (!hasYear) {
                this.reviewYears.push({
                    ...demoYear,
                    firstSubmission: `${demoYear.year}-01-12T09:00:00.000Z`,
                    lastSubmission: `${demoYear.year}-12-18T17:30:00.000Z`,
                    isCurrentYear: false,
                    isDemo: true
                });
            }
        });

        this.reviewYears.sort((a, b) => Number(b.year) - Number(a.year));
    }

    bindYearReviewControls() {
        if (this.yearReviewToggle) {
            this.yearReviewToggle.addEventListener('click', () => this.toggleYearReviewBook());
        }

        if (this.bookCloseButton) {
            this.bookCloseButton.addEventListener('click', () => this.closeYearReviewBook());
        }

        if (this.bookPrevButton) {
            this.bookPrevButton.addEventListener('click', () => this.turnReviewPage(-1));
        }

        if (this.bookNextButton) {
            this.bookNextButton.addEventListener('click', () => this.turnReviewPage(1));
        }

        if (this.bookViewButton) {
            this.bookViewButton.addEventListener('click', () => this.viewReviewYear());
        }

        if (this.bookLiveButton) {
            this.bookLiveButton.addEventListener('click', () => this.viewLiveYear());
        }
    }

    bindLeafDetailControls() {
        if (this.leafDetailClose) {
            this.leafDetailClose.addEventListener('click', () => this.closeLeafDetail());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.closeLeafDetail();
        });
    }

    bindDemoControls() {
        if (this.demoLandingButton) {
            this.demoLandingButton.addEventListener('click', () => this.playDemoLanding());
        }

        if (this.demoFallingButton) {
            this.demoFallingButton.addEventListener('click', () => this.playDemoFalling());
        }
    }

    playDemoLanding() {
        this.manualDemoFallActive = false;
        this.enableDemoMotion(7600);
        this.closeYearReviewBook();
        this.isReviewMode = false;
        this.selectedYear = this.currentYear;

        const threshold = Math.max(3, Number(this.leafFallThreshold) || 15);
        this.leafFallThreshold = threshold;
        const baseVisitors = (Array.isArray(this.visitors) ? this.visitors : [])
            .filter(visitor => !String(visitor?.id || '').startsWith('demo-'))
            .slice(-(threshold - 2));
        const demoVisitor = this.createDemoLandingVisitor();

        this.visitors = [...baseVisitors, demoVisitor];
        this.pendingLandingLeafKeys.clear();
        this.pendingLandingLeafKeys.add(this.getLeafKey(demoVisitor, this.visitors.length - 1));
        this.knownLeafKeys = new Set(this.visitors.map((visitor, index) => this.getLeafKey(visitor, index)));
        this.initialVisitorSnapshotReady = true;
        this.leafFallStarted = false;
        this.leafGreenified = false;
        this.activeLeafCycle = null;

        this.updateTreeHeading();
        this.renderYearReviewBook();
        this.refreshTree();
        this.resumeLiveRefreshAfter(7600);
    }

    playDemoFalling() {
        this.closeYearReviewBook();
        this.isReviewMode = false;
        this.selectedYear = this.currentYear;
        this.manualDemoFallActive = true;

        const count = this.demoFallLeafCount || Math.max(3, Number(this.leafFallThreshold) || 15);
        const fallPlaybackMs = Math.min(1600, count * 105 + 1070) + Math.max(1200, Number(this.leafFallDuration) || 4200) + 1400;
        this.enableDemoMotion(fallPlaybackMs);
        this.leafFallThreshold = count;
        this.leafFallDuration = Math.max(1200, Number(this.leafFallDuration) || 4200);
        this.visitors = this.createDemoFallVisitors(count);
        this.pendingLandingLeafKeys.clear();
        this.knownLeafKeys = new Set(this.visitors.map((visitor, index) => this.getLeafKey(visitor, index)));
        this.initialVisitorSnapshotReady = true;
        this.leafFallStarted = false;
        this.leafGreenified = false;
        this.leafFallCycleNumber = 0;
        this.activeLeafCycle = null;

        this.updateTreeHeading();
        this.renderYearReviewBook();
        this.refreshTree();

        this.resumeLiveRefreshAfter(fallPlaybackMs);
    }

    enableDemoMotion(durationMs) {
        document.body.classList.add('tree-demo-motion-active');

        if (this.demoMotionTimer) {
            window.clearTimeout(this.demoMotionTimer);
        }

        this.demoMotionTimer = window.setTimeout(() => {
            document.body.classList.remove('tree-demo-motion-active');
            this.demoMotionTimer = null;
        }, Math.max(1000, Number(durationMs) || 5000));
    }

    resumeLiveRefreshAfter(delayMs) {
        if (typeof treeRefreshTimer !== 'undefined') {
            window.clearTimeout(treeRefreshTimer);
            treeRefreshTimer = window.setTimeout(() => {
                this.manualDemoFallActive = false;
                document.body.classList.remove('tree-demo-motion-active');
                if (this.demoMotionTimer) {
                    window.clearTimeout(this.demoMotionTimer);
                    this.demoMotionTimer = null;
                }
                refreshTreeFromServer();
            }, Math.max(1000, Number(delayMs) || 5000));
        }
    }

    formatLeafDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Date unavailable';
        return date.toLocaleDateString('en-SG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    openLeafDetail(visitor, badgeProfile) {
        if (!this.leafDetailCard) return;

        const badgeName = visitor.badgeName || badgeProfile.label || 'Feedback Contributor';
        const snippet = visitor.pledgeSnippet || 'No pledge snippet was shared for this leaf.';

        if (this.leafDetailPrivacy) {
            this.leafDetailPrivacy.textContent = visitor.privacyLabel || 'Leaf details';
        }
        if (this.leafDetailName) {
            this.leafDetailName.textContent = visitor.name || 'Anonymous visitor';
        }
        if (this.leafDetailBadge) {
            this.leafDetailBadge.textContent = badgeName;
        }
        if (this.leafDetailDate) {
            this.leafDetailDate.textContent = this.formatLeafDate(visitor.created_at);
        }
        if (this.leafDetailSnippet) {
            this.leafDetailSnippet.textContent = snippet;
        }

        this.leafDetailCard.classList.add('active');
        this.leafDetailCard.setAttribute('aria-hidden', 'false');
    }

    closeLeafDetail() {
        if (!this.leafDetailCard) return;
        this.leafDetailCard.classList.remove('active');
        this.leafDetailCard.setAttribute('aria-hidden', 'true');
    }

    toggleYearReviewBook() {
        if (this.isBookOpen) {
            this.closeYearReviewBook();
        } else {
            this.openYearReviewBook();
        }
    }

    openYearReviewBook() {
        this.isBookOpen = true;
        if (this.yearReviewBook) {
            this.yearReviewBook.classList.add('open');
            this.yearReviewBook.setAttribute('aria-hidden', 'false');
        }
        if (this.yearReviewToggle) {
            this.yearReviewToggle.classList.add('active');
            this.yearReviewToggle.setAttribute('aria-expanded', 'true');
        }
    }

    closeYearReviewBook() {
        this.isBookOpen = false;
        if (this.yearReviewBook) {
            this.yearReviewBook.classList.remove('open');
            this.yearReviewBook.setAttribute('aria-hidden', 'true');
        }
        if (this.yearReviewToggle) {
            this.yearReviewToggle.classList.remove('active');
            this.yearReviewToggle.setAttribute('aria-expanded', 'false');
        }
    }

    turnReviewPage(direction) {
        if (!this.reviewYears.length || this.isBookFlipping) return;

        const nextIndex = (this.reviewIndex + direction + this.reviewYears.length) % this.reviewYears.length;
        const nextPage = this.reviewYears[nextIndex];

        this.animateBookFlip(direction, nextPage);

        window.setTimeout(() => {
            this.reviewIndex = nextIndex;
            this.renderYearReviewBook();
        }, 260);
    }

    animateBookFlip(direction, nextPage) {
        if (!this.yearReviewBook) return;

        this.yearReviewBook.classList.remove('flip-forward', 'flip-back');
        this.isBookFlipping = true;

        if (this.bookTurnYear && nextPage) {
            this.bookTurnYear.textContent = nextPage.year;
        }

        void this.yearReviewBook.offsetWidth;
        this.yearReviewBook.classList.add(direction > 0 ? 'flip-forward' : 'flip-back');

        window.setTimeout(() => {
            if (this.yearReviewBook) {
                this.yearReviewBook.classList.remove('flip-forward', 'flip-back');
            }
            this.isBookFlipping = false;
        }, 720);
    }

    async viewReviewYear() {
        const page = this.reviewYears[this.reviewIndex];
        if (!page) return;

        this.selectedYear = Number(page.year) || this.currentYear;
        this.isReviewMode = this.selectedYear !== this.currentYear;
        await this.fetchVisitorData(this.selectedYear);
        if (this.demoYearsEnabled && !this.visitors.length && page.isDemo) {
            this.visitors = this.createDemoVisitors(this.selectedYear, Number(page.leafCount) || 36);
        }
        this.updateTreeHeading();
        this.renderYearReviewBook();
        this.refreshTree();
    }

    async viewLiveYear() {
        this.selectedYear = this.currentYear;
        this.isReviewMode = false;
        await this.fetchVisitorData(this.currentYear);
        this.updateTreeHeading();
        this.refreshTree();
        this.renderYearReviewBook();
    }

    updateTreeHeading() {
        if ((this.demoFallEnabled || this.manualDemoFallActive) && !this.isReviewMode) {
            if (this.treeTitle) {
                this.treeTitle.textContent = 'ESG Digital Tree - Leaf Fall Demo';
            }
            if (this.treeSubtitle) {
                this.treeSubtitle.textContent = `${this.visitors.length} demo leaves will fall. No live feedback data is changed.`;
            }
            return;
        }

        const settings = this.visualAssets?.treeTitleBox;
        const configTitle = settings?.titleText || '🌳 ESG Digital Tree';
        const configSubtitle = settings?.subtitleText || `Growing with every visitor's contribution in ${this.currentYear}`;

        if (this.treeTitle) {
            this.treeTitle.textContent = this.isReviewMode
                ? `${this.selectedYear} ESG Tree Review`
                : configTitle;
        }

        if (this.treeSubtitle) {
            this.treeSubtitle.textContent = this.isReviewMode
                ? `Completed yearly tree with ${this.visitors.length} contribution${this.visitors.length === 1 ? '' : 's'}`
                : (this.activeCampaign?.treeSubtitle || configSubtitle);
        }
    }

    renderYearReviewBook() {
        if (!this.yearReviewBook || !this.bookYear || !this.bookCount || !this.reviewTreePreview) return;

        const page = this.reviewYears[this.reviewIndex] || {
            year: this.currentYear,
            leafCount: this.visitors.length,
            isCurrentYear: true
        };
        const leafCount = Number(page.leafCount) || 0;

        this.bookYear.textContent = page.year;
        this.bookCount.textContent = `${leafCount} ${leafCount === 1 ? 'leaf' : 'leaves'}`;
        this.reviewTreePreview.innerHTML = '';

        const dotCount = Math.min(leafCount, 90);
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'review-leaf-dot';
            const random = this.createSeededRandom(`${page.year}|review-dot|${i}`);
            const angle = random() * Math.PI * 2;
            const radius = Math.sqrt(random());
            const x = 50 + Math.cos(angle) * radius * 33;
            const y = 35 + Math.sin(angle) * radius * 22;

            dot.style.left = `${x}%`;
            dot.style.top = `${y}%`;
            this.reviewTreePreview.appendChild(dot);
        }

        if (this.bookViewButton) {
            this.bookViewButton.textContent = Number(page.year) === this.currentYear ? 'View Live' : 'View Tree';
        }

        if (this.bookLiveButton) {
            this.bookLiveButton.classList.toggle('active', !this.isReviewMode);
        }
    }

    createDemoVisitors(year, count) {
        const badgeKeys = Object.keys(this.badgeLeafProfiles);
        return Array.from({ length: count }, (_, index) => {
            const badgeKey = badgeKeys[index % badgeKeys.length];
            const month = String((index % 12) + 1).padStart(2, '0');
            const day = String((index % 26) + 1).padStart(2, '0');

            return {
                id: `demo-${year}-${index + 1}`,
                name: `Visitor ${index + 1}`,
                visit_count: 1 + (index % 4),
                created_at: `${year}-${month}-${day}T10:00:00.000Z`,
                isVip: false,
                badgeKey,
                badgeName: this.badgeLeafProfiles[badgeKey].label,
                badgeColor: '',
                pledgeTopic: '',
                pledgeSnippet: 'Demo pledge snippet for the yearly review tree.',
                hasPublicName: false,
                privacyLabel: 'Demo visitor'
            };
        });
    }

    createDemoLandingVisitor() {
        this.demoLandingRunNumber += 1;
        const badgeKey = 'sustainable-living-advocate';
        const badgeProfile = this.badgeLeafProfiles[badgeKey];

        return {
            id: `demo-landing-${Date.now()}-${this.demoLandingRunNumber}`,
            name: 'Demo Landing',
            visit_count: 1,
            created_at: new Date().toISOString(),
            isVip: false,
            badgeKey,
            badgeName: badgeProfile.label,
            badgeColor: '',
            pledgeTopic: badgeKey,
            pledgeSnippet: 'Demo leaf for showing the kiosk landing animation.',
            hasPublicName: false,
            privacyLabel: 'Demo mode - no database record',
            isDemoLanding: true
        };
    }

    createDemoFallVisitors(count) {
        const badgeKeys = Object.keys(this.badgeLeafProfiles);
        const now = Date.now();

        return Array.from({ length: count }, (_, index) => {
            const badgeKey = badgeKeys[index % badgeKeys.length];
            const badgeProfile = this.badgeLeafProfiles[badgeKey];

            return {
                id: `demo-fall-${index + 1}`,
                name: `Demo Visitor ${index + 1}`,
                visit_count: 1 + (index % 3),
                created_at: new Date(now - ((count - index) * 1800)).toISOString(),
                isVip: false,
                badgeKey,
                badgeName: badgeProfile.label,
                badgeColor: '',
                pledgeTopic: badgeKey,
                pledgeSnippet: 'Demo leaf for showing the kiosk leaf falling animation.',
                hasPublicName: false,
                privacyLabel: 'Demo mode - no database record'
            };
        });
    }

    // ==================== VISUALIZATION ====================

    createLeaves() {
        this.leavesContainer.innerHTML = '';
        this.closeLeafDetail();
        if (!this.stageHasLeaves()) {
            return;
        }
        const leafCycle = this.getLeafCycleState();
        this.activeLeafCycle = leafCycle;

        const treeRect = this.treeImage.getBoundingClientRect();
        const containerRect = this.leavesContainer.getBoundingClientRect();
        const ovalArea = this.calculateOvalArea(treeRect, containerRect);

        if (this.debugOval) {
            this.updateOvalOverlay(ovalArea);
        } else {
            const overlay = document.getElementById('ovalOverlay');
            if (overlay) {
                overlay.style.borderColor = 'rgba(255, 0, 0, 0)';
                overlay.style.background = 'transparent';
            }
        }

        leafCycle.visibleVisitors.forEach((visitor, index) => {
            this.createLeaf(visitor, index, ovalArea);
        });

        this.applyLeafThresholdEffect(leafCycle);
    }

    getLeafCycleState() {
        const threshold = Math.max(1, Number(this.leafFallThreshold) || 15);
        const visitors = Array.isArray(this.visitors) ? this.visitors : [];

        if ((this.demoFallEnabled || this.manualDemoFallActive) && !this.isReviewMode) {
            return {
                visibleVisitors: visitors.slice(0, threshold),
                shouldFallAway: visitors.length > 0,
                cycleNumber: Date.now(),
                threshold
            };
        }

        if (this.isReviewMode || visitors.length < threshold) {
            return {
                visibleVisitors: visitors,
                shouldFallAway: false,
                cycleNumber: 0,
                threshold
            };
        }

        const completedCycles = Math.floor(visitors.length / threshold);
        const remainder = visitors.length % threshold;

        if (remainder > 0) {
            return {
                visibleVisitors: visitors.slice(-remainder),
                shouldFallAway: false,
                cycleNumber: completedCycles,
                threshold
            };
        }

        const clearedCycle = this.getClearedLeafCycle(threshold);
        if (completedCycles <= clearedCycle) {
            return {
                visibleVisitors: [],
                shouldFallAway: false,
                cycleNumber: completedCycles,
                threshold
            };
        }

        return {
            visibleVisitors: visitors.slice(-threshold),
            shouldFallAway: true,
            cycleNumber: completedCycles,
            threshold
        };
    }

    getClearedLeafCycleKey(threshold) {
        return `rp-tree-cleared-cycle:${this.selectedYear}:${threshold}`;
    }

    getClearedLeafCycle(threshold) {
        const value = Number(localStorage.getItem(this.getClearedLeafCycleKey(threshold)));
        return Number.isFinite(value) ? value : 0;
    }

    setClearedLeafCycle(threshold, cycleNumber) {
        localStorage.setItem(this.getClearedLeafCycleKey(threshold), String(cycleNumber));
    }

    calculateOvalArea(treeRect, containerRect) {
        const centerX =
            treeRect.left - containerRect.left + (treeRect.width / 2);

        // UPDATED: move canopy center slightly higher
        const centerY =
            treeRect.top - containerRect.top + (treeRect.height * 0.32);

        return {
            x: centerX - (this.ovalWidth / 2),
            y: centerY - (this.ovalHeight / 2) + this.ovalTopOffset,
            width: this.ovalWidth,
            height: this.ovalHeight
        };
    }

    updateOvalOverlay(ovalArea) {
        let ovalOverlay = document.getElementById('ovalOverlay');

        if (!ovalOverlay) {
            ovalOverlay = document.createElement('div');
            ovalOverlay.id = 'ovalOverlay';
            document.getElementById('treeContainer').appendChild(ovalOverlay);
        }

        ovalOverlay.style.position = 'absolute';
        ovalOverlay.style.width = `${ovalArea.width}px`;
        ovalOverlay.style.height = `${ovalArea.height}px`;
        ovalOverlay.style.left = `${ovalArea.x}px`;
        ovalOverlay.style.top = `${ovalArea.y}px`;
        ovalOverlay.style.transform = 'none';
    }

    // ==================== MASK ====================

    buildMaskCanvas() {
        if (!this.stageHasLeaves()) {
            return null;
        }

        if (!this.treeImageLeaves) {
            console.warn('treeImageLeaves not found - mask disabled');
            return null;
        }

        const img = this.treeImageLeaves;
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        if (!w || !h) {
            console.warn('stage4leaves image not ready - mask disabled');
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        return { canvas, ctx, w, h };
    }

    maskPixelHasLeafSupport(ctx, x, y, w, h, leafSize, scaleX, scaleY) {
        const radiusX = Math.max(8, leafSize * 0.18 * scaleX);
        const radiusY = Math.max(8, leafSize * 0.18 * scaleY);
        const samples = [
            [x, y],
            [x - radiusX, y],
            [x + radiusX, y],
            [x, y - radiusY],
            [x, y + radiusY]
        ];

        let supportedSamples = 0;

        for (const [sampleX, sampleY] of samples) {
            const px = Math.max(0, Math.min(w - 1, Math.floor(sampleX)));
            const py = Math.max(0, Math.min(h - 1, Math.floor(sampleY)));
            const alpha = ctx.getImageData(px, py, 1, 1).data[3];

            if (alpha > 45) {
                supportedSamples += 1;
            }
        }

        return supportedSamples >= 4;
    }

    findRandomPositionInLeavesMask(leafSize, seed) {
        if (!this.maskData || !this.treeImageLeaves) {
            return null;
        }

        const { ctx, w, h } = this.maskData;
        const random = this.createSeededRandom(seed);

        const rect = this.treeImageLeaves.getBoundingClientRect();
        const containerRect = this.leavesContainer.getBoundingClientRect();

        const left = rect.left - containerRect.left;
        const top = rect.top - containerRect.top;

        const displayW = rect.width;
        const displayH = rect.height;

        if (!displayW || !displayH) {
            return null;
        }

        const scaleX = w / displayW;
        const scaleY = h / displayH;

        for (let i = 0; i < 900; i++) {
            const rx = random() * displayW;
            const ry = random() * displayH;

            const nx = Math.floor(rx * scaleX);
            const ny = Math.floor(ry * scaleY);

            const pixel = ctx.getImageData(nx, ny, 1, 1).data;
            const alpha = pixel[3];

            // Alpha plus neighbour checks keep leaves anchored in the canopy, away from loose edges.
            if (alpha > 55 && this.maskPixelHasLeafSupport(ctx, nx, ny, w, h, leafSize, scaleX, scaleY)) {
                return {
                    x: left + rx - leafSize / 2,
                    y: top + ry - leafSize / 2
                };
            }
        }

        return null;
    }

    // ==================== LEAF CREATION ====================

    createLeaf(visitor, index, ovalArea) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        const visitorSeed = this.getVisitorSeed(visitor, index);
        const leafKey = this.getLeafKey(visitor, index);
        const seededRandom = this.createSeededRandom(`${visitorSeed}|leaf`);

        const isVip = Boolean(visitor.isVip) || this.isVipName(visitor.name);
        if (isVip) {
            leaf.classList.add('vip');
        }
        const isGreenified = this.shouldLeafBeGreen(visitor, isVip);
        if (isGreenified) {
            leaf.classList.add('leaf-greenified');
        }
        const isNeonGlowing = this.shouldLeafGlow(visitor);
        if (isNeonGlowing) {
            leaf.classList.add('leaf-neon-glow');
        }

        const badgeProfile = this.getBadgeLeafProfile(visitor);
        leaf.classList.add(badgeProfile.className);
        if (!isVip && !isGreenified) {
            leaf.classList.add('leaf-tinted');
            leaf.style.setProperty('--leaf-badge-color', this.getBadgeLeafColor(visitor));
        }
        leaf.dataset.badge = visitor.badgeKey || 'feedback-completer';
        leaf.title = `${visitor.name || 'Anonymous visitor'} - ${visitor.badgeName || badgeProfile.label}`;
        leaf.setAttribute('role', 'button');
        leaf.setAttribute('tabindex', '0');
        leaf.setAttribute('aria-label', `View ${visitor.name || 'anonymous visitor'} leaf details`);

        const side = badgeProfile.preferredSide || (seededRandom() > 0.5
            ? 'LeftLeaf.png'
            : 'RightLeaf.png');

        const visitTime = new Date(visitor.created_at);
        const now = new Date();
        const diffInMinutes = (now - visitTime) / 60000;

        let finalLeafImage;

        if (isVip) {
            finalLeafImage = 'Gold' + side;
        } else {
            finalLeafImage =
                diffInMinutes >= 0 && diffInMinutes <= 2
                    ? 'New' + side
                    : 'Old' + side;
        }

        const leafBasePath = isVip ? '/assets/Tree/vip-leaf' : '/assets/Tree/leaf';

        if (isVip) {
            if (this.vipLeafOverrideImage) {
                leaf.style.backgroundImage = `url('${this.vipLeafOverrideImage}')`;
            } else {
                leaf.style.backgroundImage = `url('${leafBasePath}/${finalLeafImage}')`;
            }
        } else if (this.leafOverrideImage) {
            leaf.style.backgroundImage = `url('${this.leafOverrideImage}')`;
        } else {
            leaf.style.backgroundImage = `url('${leafBasePath}/${finalLeafImage}')`;
        }
        leaf.style.opacity = String(this.leafOpacity);
        leaf.style.setProperty('--leaf-visible-opacity', String(this.leafOpacity));
        leaf.style.setProperty('--leaf-appear-duration', `${this.leafAnimationDuration}ms`);
        leaf.style.setProperty('--leaf-fall-duration', `${this.leafFallDuration}ms`);
        const windDirection = seededRandom() > 0.5 ? 1 : -1;
        let fallDelay = Math.min(index * 105 + Math.round(seededRandom() * 170), 1600);
        if (this.manualDemoFallActive && !this.isReviewMode) {
            fallDelay += 900;
        }
        const fallDistance = Math.round(Math.max(360, Math.min(window.innerHeight * (0.5 + seededRandom() * 0.32), 760)));
        const finalDrift = Math.round(windDirection * (90 + seededRandom() * 230));
        const swayA = Math.round(windDirection * (28 + seededRandom() * 68));
        const swayB = Math.round(windDirection * -(44 + seededRandom() * 96));
        const swayC = Math.round(windDirection * (24 + seededRandom() * 88));
        const swayD = Math.round(windDirection * (10 + seededRandom() * 46));
        const fallRotation = Math.round(windDirection * (140 + seededRandom() * 340));
        const fallTilt = Math.round((seededRandom() - 0.5) * 64);
        const fallYaw = Math.round(windDirection * (22 + seededRandom() * 34));
        const flutterDuration = Math.round(620 + seededRandom() * 520);
        const endScale = (0.72 + seededRandom() * 0.1).toFixed(2);
        const preEndScale = Math.min(0.88, Number(endScale) + 0.04).toFixed(2);
        const endBlur = (0.12 + seededRandom() * 0.28).toFixed(2);
        const appearDrift = Math.round((seededRandom() - 0.5) * 28);
        const appearRotation = Math.round((seededRandom() - 0.5) * 26);

        leaf.dataset.fallDelay = String(fallDelay);
        leaf.style.setProperty('--leaf-fall-delay', `${fallDelay}ms`);
        leaf.style.setProperty('--leaf-fall-distance', `${fallDistance}px`);
        leaf.style.setProperty('--leaf-fall-drift', `${finalDrift}px`);
        leaf.style.setProperty('--leaf-fall-sway-a', `${swayA}px`);
        leaf.style.setProperty('--leaf-fall-sway-b', `${swayB}px`);
        leaf.style.setProperty('--leaf-fall-sway-c', `${swayC}px`);
        leaf.style.setProperty('--leaf-fall-sway-d', `${swayD}px`);
        leaf.style.setProperty('--leaf-fall-rotation', `${fallRotation}deg`);
        leaf.style.setProperty('--leaf-fall-tilt', `${fallTilt}deg`);
        leaf.style.setProperty('--leaf-fall-yaw', `${fallYaw}deg`);
        leaf.style.setProperty('--leaf-fall-end-tilt', `${Math.round(fallTilt * 0.18)}deg`);
        leaf.style.setProperty('--leaf-fall-end-scale', endScale);
        leaf.style.setProperty('--leaf-fall-pre-end-scale', preEndScale);
        leaf.style.setProperty('--leaf-fall-end-blur', `${endBlur}px`);
        leaf.style.setProperty('--leaf-flutter-duration', `${flutterDuration}ms`);
        leaf.style.setProperty('--leaf-appear-drift', `${appearDrift}px`);
        leaf.style.setProperty('--leaf-appear-rotation', `${appearRotation}deg`);

        const baseLeafSize = 80 + ((visitor.visit_count || 1) * 5);
        const scale = isVip
            ? (typeof this.vipLeafDisplayScale === 'number' ? this.vipLeafDisplayScale : this.leafDisplayScale)
            : (typeof this.leafDisplayScale === 'number' ? this.leafDisplayScale : 1);
        const leafSize = Math.max(8, Math.round(baseLeafSize * scale));
        leaf.style.width = `${leafSize}px`;
        leaf.style.height = `${leafSize}px`;
        leaf.style.setProperty('--leaf-size', `${leafSize}px`);
        const glowTimestamp = this.getLeafGlowTimestamp(visitor);
        if (glowTimestamp) {
            leaf.dataset.leafGlowTimestamp = glowTimestamp.toISOString();
        }

        // 1) Place within mask
        let position = this.findRandomPositionInLeavesMask(leafSize, `${visitorSeed}|position`);

        // 2) Fallback to oval
        if (!position) {
            position = this.findRandomPositionInOval(ovalArea, leafSize, `${visitorSeed}|fallback`);
        }

        leaf.style.left = `${position.x}px`;
        leaf.style.top = `${position.y}px`;

        const leafOverrideUrl = isVip
            ? this.vipLeafOverrideImage
            : this.leafOverrideImage;
        const useFlippedOverride = Boolean(leafOverrideUrl) && seededRandom() > 0.5;
        const leafImageUrl = leafOverrideUrl || `${leafBasePath}/${finalLeafImage}`;

        leaf.classList.toggle('leaf-image-flipped', useFlippedOverride);
        leaf.style.setProperty('--leaf-image-url', `url('${leafImageUrl}')`);
        leaf.style.setProperty('--leaf-image-scale-x', useFlippedOverride ? '-1' : '1');
        leaf.style.backgroundImage = 'none';

        if (this.pendingLandingLeafKeys.has(leafKey) && !this.activeLeafCycle?.shouldFallAway) {
            this.configureLeafLandingAnimation(leaf, leafKey, position, leafSize, seededRandom, index, visitor);
        }

        const nameElement = document.createElement('div');
        nameElement.className = 'leaf-name';
        nameElement.textContent = visitor.name || 'Anonymous';
        nameElement.style.setProperty('--leaf-name-font-size', `${this.getLeafNameFontSize(visitor.name || 'Anonymous', leafSize)}px`);
        leaf.appendChild(nameElement);

        leaf.addEventListener('click', (event) => {
            event.stopPropagation();
            this.openLeafDetail(visitor, badgeProfile);
        });
        leaf.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openLeafDetail(visitor, badgeProfile);
            }
        });

        this.leavesContainer.appendChild(leaf);
    }

    configureLeafLandingAnimation(leaf, leafKey, position, leafSize, random, index, visitor) {
        const windDirection = random() > 0.5 ? 1 : -1;
        const isDemoLanding = visitor?.isDemoLanding === true;
        const landingDuration = isDemoLanding
            ? Math.round(4300 + random() * 500)
            : Math.round(3200 + random() * 900);
        const landingDelay = isDemoLanding
            ? 80
            : Math.min(index * 70 + Math.round(random() * 120), 640);
        const containerRect = this.leavesContainer?.getBoundingClientRect();
        const containerWidth = containerRect?.width || window.innerWidth || 1920;
        const containerHeight = containerRect?.height || window.innerHeight || 1080;
        const finalCenterX = (position?.x || 0) + (leafSize / 2);
        const finalCenterY = (position?.y || 0) + (leafSize / 2);
        const startCenterX = isDemoLanding
            ? containerWidth * (0.5 + ((random() - 0.5) * 0.2))
            : containerWidth * (0.5 + ((random() - 0.5) * 0.12));
        const startCenterY = isDemoLanding
            ? containerHeight * (0.9 + (random() * 0.08))
            : containerHeight * (0.62 + (random() * 0.12));
        const startX = Math.round(startCenterX - finalCenterX);
        const startY = Math.round(startCenterY - finalCenterY);
        const swayAX = Math.round((startX * 0.68) + (windDirection * (80 + random() * 120)));
        const swayAY = Math.round((startY * 0.72) - (26 + random() * 72));
        const swayBX = Math.round((startX * 0.42) - (windDirection * (80 + random() * 150)));
        const swayBY = Math.round((startY * 0.43) - (88 + random() * 120));
        const approachX = Math.round((startX * 0.18) + (windDirection * (20 + random() * 56)));
        const approachY = Math.round((startY * 0.16) - (34 + random() * 70));
        const finalX = Math.round(windDirection * (6 + random() * 28));
        const yaw = Math.round(windDirection * (22 + random() * 38));
        const startRotate = Math.round(windDirection * -(16 + random() * 28));
        const swayARotate = Math.round(windDirection * (22 + random() * 34));
        const swayBRotate = Math.round(windDirection * -(12 + random() * 28));
        const approachRotate = Math.round(windDirection * (14 + random() * 24));
        const finalRotate = Math.round(windDirection * -(5 + random() * 18));
        const flutterDuration = Math.round(500 + random() * 360);
        const closeScale = (isDemoLanding ? 3.1 + random() * 0.4 : 2.25 + random() * 0.55).toFixed(2);
        const nearScale = (isDemoLanding ? 2.24 + random() * 0.3 : 1.76 + random() * 0.26).toFixed(2);
        const midScale = (isDemoLanding ? 1.62 + random() * 0.22 : 1.36 + random() * 0.18).toFixed(2);
        const farScale = (isDemoLanding ? 1.14 + random() * 0.14 : 1.1 + random() * 0.12).toFixed(2);

        leaf.classList.add('leaf-landing');
        leaf.classList.toggle('leaf-demo-landing', isDemoLanding);
        leaf.style.setProperty('--leaf-land-duration', `${landingDuration}ms`);
        leaf.style.setProperty('--leaf-land-delay', `${landingDelay}ms`);
        leaf.style.setProperty('--leaf-land-start-x', `${startX}px`);
        leaf.style.setProperty('--leaf-land-start-y', `${startY}px`);
        leaf.style.setProperty('--leaf-land-sway-a-x', `${swayAX}px`);
        leaf.style.setProperty('--leaf-land-sway-a-y', `${swayAY}px`);
        leaf.style.setProperty('--leaf-land-sway-b-x', `${swayBX}px`);
        leaf.style.setProperty('--leaf-land-sway-b-y', `${swayBY}px`);
        leaf.style.setProperty('--leaf-land-approach-x', `${approachX}px`);
        leaf.style.setProperty('--leaf-land-approach-y', `${approachY}px`);
        leaf.style.setProperty('--leaf-land-final-x', `${finalX}px`);
        leaf.style.setProperty('--leaf-land-start-rotate', `${startRotate}deg`);
        leaf.style.setProperty('--leaf-land-sway-a-rotate', `${swayARotate}deg`);
        leaf.style.setProperty('--leaf-land-sway-b-rotate', `${swayBRotate}deg`);
        leaf.style.setProperty('--leaf-land-approach-rotate', `${approachRotate}deg`);
        leaf.style.setProperty('--leaf-land-final-rotate', `${finalRotate}deg`);
        leaf.style.setProperty('--leaf-land-yaw', `${yaw}deg`);
        leaf.style.setProperty('--leaf-land-flutter-duration', `${flutterDuration}ms`);
        leaf.style.setProperty('--leaf-land-close-scale', closeScale);
        leaf.style.setProperty('--leaf-land-near-scale', nearScale);
        leaf.style.setProperty('--leaf-land-mid-scale', midScale);
        leaf.style.setProperty('--leaf-land-far-scale', farScale);

        if (this.landingCleanupTimers.has(leafKey)) {
            window.clearTimeout(this.landingCleanupTimers.get(leafKey));
        }

        const cleanup = () => {
            this.pendingLandingLeafKeys.delete(leafKey);
            this.landingCleanupTimers.delete(leafKey);
            leaf.classList.remove('leaf-landing');
            leaf.classList.add('leaf-landed');
        };

        leaf.addEventListener('animationend', (event) => {
            if (event.animationName === 'leafLandOnTree') {
                cleanup();
            }
        }, { once: true });

        const timer = window.setTimeout(cleanup, landingDelay + landingDuration + 350);
        this.landingCleanupTimers.set(leafKey, timer);
    }

    getLeafNameFontSize(name, leafSize) {
        const normalizedName = String(name || '').trim();
        const length = normalizedName.length || 1;
        const size = Number(leafSize) || 80;

        const sizeBasedFont = size * 0.13;
        const lengthPenalty = Math.min(0.6, Math.max(0, (length - 6) * 0.035));
        const adjustedFont = sizeBasedFont * (1 - lengthPenalty);

        return Math.max(6, Math.min(14, Math.round(adjustedFont)));
    }

    applyLeafThresholdEffect(leafCycle) {
        if (!leafCycle.shouldFallAway) {
            this.leafFallStarted = false;
            this.leafGreenified = false;
            this.leafFallCycleNumber = leafCycle.cycleNumber || 0;
            if (this.leafGreenTimer) {
                window.clearTimeout(this.leafGreenTimer);
                this.leafGreenTimer = null;
            }
            return;
        }

        const leaves = Array.from(this.leavesContainer.querySelectorAll('.leaf'));

        leaves.forEach(leaf => {
            leaf.classList.add('leaf-falling');
        });

        if (this.leafFallStarted && this.leafFallCycleNumber === leafCycle.cycleNumber) return;
        this.leafFallStarted = true;
        this.leafFallCycleNumber = leafCycle.cycleNumber;

        const maxFallDelay = leaves.reduce((maxDelay, leaf) => {
            const delay = Number(leaf.dataset.fallDelay || 0);
            return Number.isFinite(delay) ? Math.max(maxDelay, delay) : maxDelay;
        }, 0);
        const clearDelay = maxFallDelay + Math.max(500, Number(this.leafFallDuration) || 4200);
        this.leafGreenTimer = window.setTimeout(() => {
            this.leafGreenified = true;
            this.setClearedLeafCycle(leafCycle.threshold, leafCycle.cycleNumber);
            this.leavesContainer.querySelectorAll('.leaf').forEach(leaf => {
                leaf.classList.remove('leaf-falling');
                leaf.classList.add('leaf-fallen', 'leaf-greenified', 'leaf-cleared');
            });
            this.leafGreenTimer = null;
        }, clearDelay);
    }

    findRandomPositionInOval(ovalArea, leafSize, seed) {
        let x;
        let y;
        let tries = 0;
        const random = this.createSeededRandom(seed);

        const cx = ovalArea.x + ovalArea.width / 2;
        const cy = ovalArea.y + ovalArea.height / 2;

        const a = ovalArea.width / 2;
        const b = ovalArea.height / 2;

        do {
            x = (random() * 2 - 1) * a;
            y = (random() * 2 - 1) * b;

            tries += 1;
            if (tries > 500) break;
        } while ((x * x) / (a * a) + (y * y) / (b * b) > 1);

        return {
            x: cx + x - leafSize / 2,
            y: cy + y - leafSize / 2
        };
    }

    // ==================== FIX: KEEP MASK ALWAYS HIDDEN ====================

    updateLeavesTransparency() {
        if (this.treeImageLeaves) {
            /*this.treeImageLeaves.style.display = 'block';
            this.treeImageLeaves.style.opacity = '0';*/
            this.treeImageLeaves.style.pointerEvents = 'none';
        }

        this.updateStageLeavesVisibility();
    }

    updateStageLeavesVisibility() {
        if (!this.treeImageLeaves) {
            return;
        }

        this.treeImageLeaves.classList.toggle('stage-leaves-upward', this.stageLeavesShouldShiftUp());

        if (!this.stageHasLeaves()) {
            this.treeImageLeaves.style.display = 'none';
            return;
        }

        this.treeImageLeaves.style.display = 'block';
    }

    refreshTree() {
        this.updateLeavesTransparency();

        // rebuild mask (helps after resize)
        this.maskData = this.buildMaskCanvas();

        this.createLeaves();
        this.syncLeafGlowStates();
    }

    // ==================== CONFIG ====================

    setOvalPosition(topOffset) {
        this.ovalTopOffset = topOffset;
        this.refreshTree();
    }

    addVisitor(name, visitCount = 1) {
        this.visitors.push({
            name,
            visit_count: visitCount,
            created_at: new Date().toISOString()
        });

        this.refreshTree();
    }
}

// ==================== GLOBAL ====================

let treeManager;

// ==================== EVENT LISTENERS ====================

window.addEventListener('load', () => {
    treeManager = new TreeManager();
});

let treeRefreshTimer;

function triggerTreeVipRefresh() {
    if (!treeManager) return;

    Promise.all([
        treeManager.fetchVipNames(),
        treeManager.fetchYearReviewData(),
        treeManager.fetchVisitorData(treeManager.isReviewMode ? treeManager.selectedYear : treeManager.currentYear)
    ]).then(() => {
        treeManager.updateTreeHeading();
        treeManager.renderYearReviewBook();
        treeManager.refreshTree();
    }).catch((error) => {
        console.warn('VIP refresh failed:', error);
    });
}

function refreshTreeFromServer() {
    if (treeManager) {
        const yearToRefresh = treeManager.isReviewMode ? treeManager.selectedYear : treeManager.currentYear;

        Promise.all([
            treeManager.fetchParameterConfig(),
            treeManager.fetchVipNames(),
            treeManager.fetchYearReviewData(),
            treeManager.fetchVisitorData(yearToRefresh)
        ]).then(() => {
            treeManager.updateTreeHeading();
            treeManager.renderYearReviewBook();
            treeManager.refreshTree();
        }).catch((error) => {
            console.warn('Tree refresh failed:', error);
        }).finally(() => {
            scheduleTreeRefresh();
        });
    } else {
        scheduleTreeRefresh();
    }
}

function scheduleTreeRefresh() {
    window.clearTimeout(treeRefreshTimer);
    const configuredInterval = Math.max(5000, Number(treeManager?.leafRefreshInterval) || 30000);
    const interval = treeManager && !treeManager.isReviewMode
        ? Math.min(configuredInterval, treeManager.liveTreeRefreshInterval || 5000)
        : configuredInterval;
    treeRefreshTimer = window.setTimeout(refreshTreeFromServer, interval);
}

scheduleTreeRefresh();

window.addEventListener('tree-vip-refresh', triggerTreeVipRefresh);
window.addEventListener('storage', (event) => {
    if (event.key === 'tree-vip-refresh') {
        triggerTreeVipRefresh();
    }
});

window.addEventListener('resize', () => {
    if (treeManager) {
        setTimeout(() => {
            treeManager.refreshTree();
        }, 150);
    }
});
