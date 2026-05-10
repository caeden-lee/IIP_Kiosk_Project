function getTokenFromLocation() {
    const queryToken = new URLSearchParams(window.location.search).get('token');
    if (queryToken) return queryToken;

    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'connect') {
        return parts[1];
    }

    return '';
}

function setState(state, title, copy) {
    const panel = document.getElementById('statusPanel');
    const statusTitle = document.getElementById('statusTitle');
    const statusCopy = document.getElementById('statusCopy');

    panel.dataset.state = state;
    statusTitle.textContent = title;
    statusCopy.textContent = copy;
}

function shortToken(token) {
    if (!token) return 'No token found';
    if (token.length <= 16) return token;
    return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

async function redeemToken(token) {
    setState('loading', 'Checking token...', 'Your QR token is being validated with the backend.');

    const response = await fetch('/api/connect/redeem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        const message = data.error || 'Token verification failed';
        throw new Error(message);
    }

    return data;
}

async function bootstrap() {
    const token = getTokenFromLocation();
    const tokenValue = document.getElementById('tokenValue');
    const retryBtn = document.getElementById('retryBtn');
    const copyBtn = document.getElementById('copyBtn');
    const footerNote = document.getElementById('footerNote');

    tokenValue.textContent = shortToken(token);

    retryBtn.addEventListener('click', () => {
        window.location.reload();
    });

    copyBtn.addEventListener('click', async () => {
        const currentUrl = window.location.href;
        try {
            await navigator.clipboard.writeText(currentUrl);
            copyBtn.textContent = 'Copied';
            setTimeout(() => {
                copyBtn.textContent = 'Copy URL';
            }, 1200);
        } catch (error) {
            copyBtn.textContent = 'Copy failed';
            setTimeout(() => {
                copyBtn.textContent = 'Copy URL';
            }, 1200);
        }
    });

    if (!token) {
        setState('error', 'Token missing', 'Open this page by scanning the kiosk QR code so a token is included in the URL.');
        footerNote.textContent = 'The QR on the kiosk should refresh automatically. Please scan the latest one.';
        return;
    }

    try {
        const result = await redeemToken(token);
        setState('success', 'Token verified', `Your phone is now linked to kiosk ${result.kiosk_id}. Access to pledgeboard is unlocked.`);
        footerNote.textContent = `Session ID: ${result.phoneSessionId}. Redirecting to pledgeboard...`;
        setTimeout(() => {
            window.location.href = result.redirectUrl || '/pledgeboard';
        }, 900);
    } catch (error) {
        setState('error', 'Verification failed', error.message || 'The token could not be validated.');
        footerNote.textContent = 'If the token expired or was already used, scan the fresh QR code shown on the kiosk.';
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
