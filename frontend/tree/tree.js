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

        // Data
        this.visitors = [];

        // VIP Names (for golden leaves)
        this.vipNames = new Set();

        // ====================================================
        // CANOPY AREA (UPDATED: smaller + moved up)
        // ====================================================
        // These control where leaves are allowed to spawn.
        // Smaller area prevents leaves from appearing outside branches.
        this.ovalWidth = 850;
        this.ovalHeight = 300;
        this.ovalTopOffset = -100;

        // Mask cache
        this.maskData = null;

        // Debug overlay toggle (set true if you want to see an oval)
        this.debugOval = false;

        this.init();
    }

    // ==================== INIT ====================

    async init() {
        try {
            await this.loadTreeImage();

            // Force mask image hidden always
            this.updateLeavesTransparency();

            // Build mask from stage4leaves.png
            this.maskData = this.buildMaskCanvas();

            // Load VIP list first, then visitors
            await this.fetchVipNames();
            await this.fetchVisitorData();

            this.createLeaves();
        } catch (err) {
            console.error('Init error:', err);
        } finally {
            if (this.loadingMessage) {
                this.loadingMessage.style.display = 'none';
            }
        }
    }

    loadTreeImage() {
        return new Promise((resolve) => {
            let loaded = 0;
            const done = () => {
                loaded += 1;
                if (loaded >= 2) resolve();
            };

            // trunk
            if (this.treeImage && this.treeImage.complete) {
                done();
            } else if (this.treeImage) {
                this.treeImage.onload = done;
                this.treeImage.onerror = done;
            } else {
                done();
            }

            // leaves mask image
            if (this.treeImageLeaves && this.treeImageLeaves.complete) {
                done();
            } else if (this.treeImageLeaves) {
                this.treeImageLeaves.onload = done;
                this.treeImageLeaves.onerror = done;
            } else {
                done();
            }
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

    // ==================== DATA ====================

    async fetchVisitorData() {
        try {
            const response = await fetch('/api/tree');
            const data = await response.json();

            this.visitors = Array.isArray(data) ? data : [];
            console.log(`Loaded ${this.visitors.length} visitors`);
        } catch (error) {
            console.error('Error fetching visitor data:', error);
            this.visitors = [];
        }
    }

    // ==================== VISUALIZATION ====================

    createLeaves() {
        this.leavesContainer.innerHTML = '';

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

        this.visitors.forEach((visitor, index) => {
            this.createLeaf(visitor, index, ovalArea);
        });
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

    findRandomPositionInLeavesMask(leafSize) {
        if (!this.maskData || !this.treeImageLeaves) {
            return null;
        }

        const { ctx, w, h } = this.maskData;

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

        for (let i = 0; i < 700; i++) {
            const rx = Math.random() * displayW;
            const ry = Math.random() * displayH;

            const nx = Math.floor(rx * scaleX);
            const ny = Math.floor(ry * scaleY);

            const pixel = ctx.getImageData(nx, ny, 1, 1).data;
            const alpha = pixel[3];

            // alpha threshold (higher = stricter)
            if (alpha > 35) {
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

        const isVip = this.isVipName(visitor.name);
        if (isVip) {
            leaf.classList.add('vip');
        }

        const side = Math.random() > 0.5
            ? 'LeftLeaf.png'
            : 'RightLeaf.png';

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

        leaf.style.backgroundImage = `url('/assets/Tree/${finalLeafImage}')`;

        const leafSize = 80 + ((visitor.visit_count || 1) * 5);
        leaf.style.width = `${leafSize}px`;
        leaf.style.height = `${leafSize}px`;

        // 1) Place within mask
        let position = this.findRandomPositionInLeavesMask(leafSize);

        // 2) Fallback to oval
        if (!position) {
            position = this.findRandomPositionInOval(ovalArea, leafSize);
        }

        leaf.style.left = `${position.x}px`;
        leaf.style.top = `${position.y}px`;

        const nameElement = document.createElement('div');
        nameElement.className = 'leaf-name';
        nameElement.textContent = visitor.name || '';
        leaf.appendChild(nameElement);

        this.leavesContainer.appendChild(leaf);
    }

    findRandomPositionInOval(ovalArea, leafSize) {
        let x;
        let y;
        let tries = 0;

        const cx = ovalArea.x + ovalArea.width / 2;
        const cy = ovalArea.y + ovalArea.height / 2;

        const a = ovalArea.width / 2;
        const b = ovalArea.height / 2;

        do {
            x = (Math.random() * 2 - 1) * a;
            y = (Math.random() * 2 - 1) * b;

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
            this.treeImageLeaves.style.display = 'block';
            this.treeImageLeaves.style.opacity = '0';
            this.treeImageLeaves.style.pointerEvents = 'none';
        }
    }

    refreshTree() {
        this.updateLeavesTransparency();

        // rebuild mask (helps after resize)
        this.maskData = this.buildMaskCanvas();

        this.createLeaves();
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

setInterval(() => {
    if (treeManager) {
        Promise.all([
            treeManager.fetchVipNames(),
            treeManager.fetchVisitorData()
        ]).then(() => {
            treeManager.refreshTree();
        });
    }
}, 30000);

window.addEventListener('resize', () => {
    if (treeManager) {
        setTimeout(() => {
            treeManager.refreshTree();
        }, 150);
    }
});
