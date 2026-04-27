const REFRESH_MS = 20000;
const MAX_TREE_LEAVES = 54;

const leafImages = [
    '/assets/Tree/NewLeftLeaf.png',
    '/assets/Tree/NewRightLeaf.png',
    '/assets/Tree/OldLeftLeaf.png',
    '/assets/Tree/OldRightLeaf.png'
];

const leafPositions = Array.from({ length: MAX_TREE_LEAVES }, (_, index) => {
    const angle = (index / MAX_TREE_LEAVES) * Math.PI * 2;
    const ring = index % 3;
    const radiusX = 14 + (ring * 9) + ((index * 7) % 10);
    const radiusY = 7 + (ring * 5) + ((index * 5) % 7);
    return {
        left: 50 + Math.cos(angle) * radiusX + (((index * 13) % 9) - 4),
        top: 38 + Math.sin(angle) * radiusY + (((index * 11) % 7) - 3),
        rotation: ((index * 37) % 50) - 25
    };
});

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-SG').format(Number(value) || 0);
}

function formatTime(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';

    return date.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function updateClock() {
    const now = new Date();
    setText('pulse-time', now.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit'
    }));
    setText('pulse-date', now.toLocaleDateString('en-SG', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    }));
}

function renderMetrics(stats) {
    setText('pledges-today', formatNumber(stats.pledgesToday));
    setText('pledges-month', formatNumber(stats.pledgesThisMonth));
    setText('tree-leaves', formatNumber(stats.treeLeaves));
    setText('total-pledges', formatNumber(stats.totalPledges));
    setText('campaign-percent', `${stats.progressPercent}%`);
    setText('campaign-copy', `${formatNumber(stats.pledgesThisMonth)} of ${formatNumber(stats.campaignGoal)} pledges reached`);

    const bar = $('campaign-bar');
    if (bar) bar.style.width = `${stats.progressPercent}%`;
}

function renderPledges(pledges) {
    const container = $('newest-pledges');
    if (!container) return;

    if (!pledges || pledges.length === 0) {
        container.innerHTML = '<div class="empty-state">No pledges yet. The next visitor can start the pulse.</div>';
        return;
    }

    container.innerHTML = pledges.slice(0, 6).map((pledge) => `
        <article class="pledge-card">
            <p class="pledge-text">${escapeHtml(pledge.pledge)}</p>
            <div class="pledge-meta">${escapeHtml(pledge.displayName)} - ${escapeHtml(pledge.badge)} - ${formatTime(pledge.created_at)}</div>
        </article>
    `).join('');
}

function renderBadgeEarners(earners) {
    const container = $('badge-earners');
    if (!container) return;

    if (!earners || earners.length === 0) {
        container.innerHTML = '<div class="empty-state">No badges earned yet.</div>';
        return;
    }

    container.innerHTML = earners.map((earner, index) => `
        <div class="badge-row">
            <span class="rank">${index + 1}</span>
            <div>
                <div class="badge-name">${escapeHtml(earner.name)}</div>
                <div class="badge-subtitle">${escapeHtml(earner.latestBadge || 'Feedback Contributor')}</div>
            </div>
            <span class="badge-count">${formatNumber(earner.badgeCount)}</span>
        </div>
    `).join('');
}

function renderBadgeBreakdown(items) {
    const container = $('badge-breakdown');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">Badge topics will appear after pledges arrive.</div>';
        return;
    }

    const max = Math.max(...items.map(item => Number(item.count) || 0), 1);

    container.innerHTML = items.slice(0, 5).map((item) => {
        const width = Math.max(8, Math.round(((Number(item.count) || 0) / max) * 100));
        return `
            <div class="topic-row">
                <div class="topic-name">${escapeHtml(item.badge)}</div>
                <div class="topic-track"><div class="topic-fill" style="width: ${width}%"></div></div>
                <div class="topic-count">${formatNumber(item.count)}</div>
            </div>
        `;
    }).join('');
}

function renderTree(visitors) {
    const container = $('pulse-leaves');
    if (!container) return;

    const visibleVisitors = (visitors || []).slice(0, MAX_TREE_LEAVES);
    container.innerHTML = visibleVisitors.map((visitor, index) => {
        const position = leafPositions[index];
        const isNew = index < 8;
        const image = leafImages[index % leafImages.length];
        const delay = (index % 8) * -0.35;
        return `
            <div
                class="pulse-leaf${isNew ? ' new' : ''}"
                title="${escapeHtml(visitor.name || 'Visitor')}"
                style="
                    left: ${position.left}%;
                    top: ${position.top}%;
                    background-image: url('${image}');
                    --leaf-rotate: ${position.rotation}deg;
                    animation-delay: ${delay}s;
                "
            ></div>
        `;
    }).join('');
}

async function loadPulse() {
    try {
        const response = await fetch('/api/pulse/summary', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Unable to load pulse data');
        }

        renderMetrics(data.stats || {});
        renderPledges(data.newestPledges || []);
        renderBadgeEarners(data.topBadgeEarners || []);
        renderBadgeBreakdown(data.badgeBreakdown || []);
        renderTree(data.treeVisitors || []);
        setText('last-updated', `Updated ${formatTime(data.generatedAt)}`);
    } catch (error) {
        console.error('Pulse load failed:', error);
        setText('last-updated', 'Connection issue');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    loadPulse();
    setInterval(updateClock, 1000);
    setInterval(loadPulse, REFRESH_MS);
});
