//
//=============================================================
// Yu Kang Change Summary:
//=============================================================
//
// 1. BLUETOOTH CLOSE PROXIMITY DETECTION
//    bluetooth scanner                - Detects nearby devices for proximity-based access control (Done by Yu Kang)
//    /secure-data route               - Grants access only when a device is detected nearby (Done by Yu Kang)
//    /nearby-devices route            - Exposes the current nearby device list for monitoring (Done by Yu Kang)
//
// 2. QR CODE PHONE PAIRING
// - Short-lived single-use JWT QR tokens for phone pairing (QR lifetime default: 30s)
// - `/api/kiosk/generate-qr?kiosk_id=...` endpoint to issue per-kiosk QR SVGs (single-use)
// - `/connect?token=...` endpoint to redeem token and create pairing session
// - `/api/kiosk/heartbeat` HTTP endpoint and Socket.IO `heartbeat` event for kiosk liveness
// - Socket.IO support: kiosks register with `register-kiosk` and receive `paired` events
// - DB tables `kiosks`, `qr_sessions`, `device_pairings` defined in `database/schema.sql`
//
// ============================================================
// XY CHANGE SUMMARY (DONE BY XY)
// ============================================================
//
//
// 1. LIVE PULSE ROUTING
//    const pulseRoutes                - Live Pulse API routes for dashboard data (DONE BY XY)
//    app.use('/api/pulse')            - Protected Pulse API route wiring (DONE BY XY)
//    app.get('/pulse')                - Protected Pulse dashboard page route (DONE BY XY)
//
// 2. ACCESS CONTROL
//    auth middleware                  - Keeps Pulse dashboard behind authenticated admin flow (DONE BY XY)
//
// 3. PUBLIC PARAMETER CONFIG ROUTE
//    parametersConfigStore            - Reads shared kiosk parameter settings for public pages (DONE BY XY)
//    GET /api/parameters              - Exposes retention text, pledge examples, tree settings and assets to frontend (DONE BY XY)
//
// 4. KIOSK PHOTO UPLOAD BODY LIMIT
//    const JSON_BODY_LIMIT            - Raises standalone server upload payload limit for base64 kiosk photos (DONE BY XY)
//    upload error middleware          - Returns JSON for oversized uploads instead of an HTML error page (DONE BY XY)
//
// 5. QR PAIRING TABLE SELF-HEALING
//    ensureQrPairingTables()          - Creates missing kiosk QR pairing tables without a full database rebuild (DONE BY XY)
//    QR/heartbeat routes              - Verify kiosk, qr_sessions and device_pairings tables before use (DONE BY XY)
//
//=============================================================
// FIND COMMAND
//    rg -n "XY CHANGE SUMMARY|DONE BY XY" frontend backend
// ============================================================

// ============================================================
// SERVER.JS - TABLE OF CONTENTS (CTRL+F SEARCHABLE)
// ============================================================
// 
// 1. DEPENDENCIES & CONFIGURATION
//    require('dotenv').config()       - Load environment variables (DONE BY PRETI)
//    const express                    - Express framework import (DONE BY PRETI)
//    const https                      - HTTPS server module (DONE BY PRETI)
//    const fs                         - File system operations (DONE BY PRETI)
//    const path                       - Path utilities (DONE BY PRETI)
//    const session                    - Express session middleware (DONE BY PRETI)
//    const db                         - Database connection (DONE BY PRETI)
//    const feedbackRoutes             - Feedback routes module (DONE BY PRETI)
//    const adminRoutes                - Admin routes module (DONE BY PRETI)
//    const dataExportRoutes           - Data export routes module (DONE BY PRETI)
//    const pledgeboardRoutes          - Pledgeboard routes module (DONE BY PRETI)
//    const os                         - Operating system utilities (DONE BY PRETI)
//    const emailService               - Email service utilities (DONE BY PRETI)
//    const treeRoutes                 - Tree routes module (DONE BY PRETI)
//    const dataRetentionCleanup       - Data retention cleanup module (DONE BY PRETI)
//    const QRCode                     - QR code generation library (DONE BY PRETI)
//    const app                        - Express application instance (DONE BY PRETI)
//    const PORT                       - Server port number (3000) (DONE BY PRETI)
//
// 2. NETWORK INTERFACE FUNCTIONS
//    function getAllNetworkIPs()      - Get all available network IP addresses (DONE BY PRETI)
//    function getSelectedIP()         - Determine which IP address to use for server (DONE BY PRETI)
//    function getInterfaceForIP()     - Get network interface name for given IP (DONE BY PRETI)
//    const localIP                    - Selected local IP address (DONE BY PRETI)
//    const interfaceName              - Network interface name (DONE BY PRETI)
//
// 3. SSL CERTIFICATE CONFIGURATION
//    const certsDir                   - SSL certificates directory path (DONE BY PRETI)
//    const certPath                   - SSL certificate file path (DONE BY PRETI)
//    const keyPath                    - SSL private key file path (DONE BY PRETI)
//    let sslOptions                   - SSL configuration options (DONE BY PRETI)
//
// 4. MIDDLEWARE CONFIGURATION
//    app.use(express.json())          - JSON body parser middleware (DONE BY PRETI)
//    app.use(express.urlencoded())    - URL-encoded body parser middleware (DONE BY PRETI)
//    app.use(session())               - Session middleware configuration (DONE BY PRETI)
//    app.use(express.static())        - Static file serving for frontend (DONE BY PRETI)
//    app.use('/uploads'               - Static file serving for uploads (DONE BY PRETI)
//    app.use('/assets'                - Static file serving for assets (DONE BY PRETI)
//
// 5. API ROUTES (COMBINED - KIOSK + ADMIN)
//    app.use('/api/feedback'          - Feedback submission and management routes (DONE BY PRETI)
//    app.use('/api/admin'             - Admin API routes (DONE BY PRETI)
//    app.use('/api/admin/data-export' - Data export API routes (DONE BY PRETI)
//    app.use('/api/pledgeboard'       - Pledgeboard data routes (DONE BY PRETI)
//    app.use('/api/tree'              - Tree data fetching routes (DONE BY PRETI)
//    app.get('/api/network-interfaces' - Get network interface information (DONE BY PRETI)
//    app.get('/api/server-info'       - Get server configuration information (DONE BY PRETI)
//    app.get('/api/generate-qr'       - Generate QR code for feedback URL (DONE BY PRETI)
//    app.get('/api/test-db'           - Test database connection endpoint (DONE BY PRETI)
//    app.get('/api/status'            - Server status for kiosk monitor (DONE BY PRETI)
//    app.get('/api/test-email-service' - Test email service endpoint (DONE BY PRETI)
//
// 6. PAGE ROUTES (COMBINED - KIOSK + ADMIN)
//    app.get('/feedback'              - Serve feedback HTML page (DONE BY PRETI)
//    app.get('/admin'                 - Serve admin HTML page (DONE BY PRETI)
//    app.get('/pledgeboard'           - Serve pledgeboard HTML page (DONE BY PRETI)
//    app.get('/tree'                  - Serve tree HTML page (DONE BY PRETI)
//    app.get('/'                      - Redirect root to /feedback (DONE BY PRETI)
//
// 7. SERVER STARTUP FUNCTIONS
//    function printServerInfo()       - Display server information on startup (DONE BY PRETI)
//    function startServer()           - Start HTTPS or HTTP server (DONE BY PRETI)
//    const emailInitialized           - Email service initialization status (DONE BY PRETI)


// ==================== 1. IMPORTS & INITIALIZATION ====================

require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const db = require('./db');
const feedbackRoutes = require('./feedbackRoutes');
const adminRoutes = require('./adminRoutes');
const dataExportRoutes = require('./dataExportRoutes');
const pledgeboardRoutes = require('./pledgeboardRoutes');
const pulseRoutes = require('./pulseRoutes');
const os = require('os');
const emailService = require('./emailService');
const auth = require('./auth');
const parametersConfigStore = require('./parametersConfigStore');
const { startBluetoothScanner, nearbyDevices, logNearbyDevices } = require('./bluetooth');

function isMobileUserAgent(userAgent) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent || '');
}

function requireMobileTokenForPledgeboard(req, res, next) {
    if (!isMobileUserAgent(req.get('user-agent'))) {
        return next();
    }

    if (req.session && req.session.mobileAccessGranted) {
        return next();
    }

    return res.redirect('/feedback');
}

// Import tree routes and wire them to the shared DB
const { router: treeRoutes, setDatabase: setTreeDatabase } = require('./treeRoutes');

// Import cleanup module
const dataRetentionCleanup = require('./dataRetentionCleanup');

// Import QR code generation
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Server: SocketIOServer } = require('socket.io');

// Configuration for QR/session tokens
const QR_LIFETIME_SECONDS = parseInt(process.env.QR_LIFETIME_SECONDS || '30', 10); // 30s default
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '10', 10); // 10 minutes default
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';

// In-memory mapping of kiosk_id -> socket.id for real-time pairing notifications
const kioskSockets = new Map();

let qrPairingSchemaReady = null;

function runSchemaQuery(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, [], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function ensureQrPairingTables() {
    if (qrPairingSchemaReady) return qrPairingSchemaReady;

    qrPairingSchemaReady = (async () => {
        await runSchemaQuery(`
            CREATE TABLE IF NOT EXISTS kiosks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kiosk_id VARCHAR(255) UNIQUE,
                status VARCHAR(50),
                last_seen TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await runSchemaQuery(`
            CREATE TABLE IF NOT EXISTS qr_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token TEXT,
                kiosk_id VARCHAR(255),
                expires_at DATETIME,
                used_token BOOLEAN DEFAULT FALSE,
                connected BOOLEAN DEFAULT FALSE,
                phone_session VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await runSchemaQuery(`
            CREATE TABLE IF NOT EXISTS device_pairings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kiosk_id VARCHAR(255),
                phone_session VARCHAR(255),
                paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('QR pairing tables ready');
    })().catch((error) => {
        qrPairingSchemaReady = null;
        throw error;
    });

    return qrPairingSchemaReady;
}

const app = express();
const PORT = 3000;
const JSON_BODY_LIMIT = '50mb';


// Start Bluetooth scanner for proximity-based access control
app.use(express.json({ limit: JSON_BODY_LIMIT }));

startBluetoothScanner();

// Log detected Bluetooth devices every 30 seconds
setInterval(() => {
    logNearbyDevices();
}, 30000);

// Protected route
app.get('/secure-data', auth.bluetoothAccessControl, (req, res) => {
    res.json({
        success: true,
        message: 'Access granted because device is nearby'
    });
});

// Monitoring route
app.get('/nearby-devices', (req, res) => {
    res.json({
        devices: Array.from(nearbyDevices.entries())
    });
});

// Accept device reports from browser clients using Web Bluetooth
// POST { id?, mac?, name?, rssi? }
app.post('/api/bluetooth/report', (req, res) => {
    try {
        const { reportDevice } = require('./bluetooth');
        const payload = req.body || {};
        const ok = reportDevice(payload);
        if (!ok) {
            console.warn('⚠️ Invalid bluetooth report (missing id or mac):', payload);
            return res.status(400).json({ success: false, error: 'Missing id or mac in payload' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling bluetooth report:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// TEST ENDPOINT: Manually add a test device (for debugging)
// GET /api/bluetooth/test-device?mac=AA:BB:CC:DD:EE:FF&name=TestDevice&rssi=-50
app.get('/api/bluetooth/test-device', (req, res) => {
    try {
        const { reportDevice, getNearbyDevicesList } = require('./bluetooth');
        const { mac, name, rssi } = req.query;
        
        if (!mac) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing mac parameter. Usage: /api/bluetooth/test-device?mac=AA:BB:CC:DD:EE:FF&name=TestDevice&rssi=-50',
                example: 'http://localhost:3000/api/bluetooth/test-device?mac=AA:BB:CC:DD:EE:FF&name=TestPhone&rssi=-65'
            });
        }
        
        const rssiNum = rssi ? parseInt(rssi) : -65;
        reportDevice({ 
            mac: mac.toUpperCase(), 
            name: name || 'Test Device',
            rssi: rssiNum,
            source: 'test'
        });
        
        res.json({ 
            success: true,
            message: `Test device added: ${mac}`,
            nearbyDevices: getNearbyDevicesList()
        });
    } catch (error) {
        console.error('Error in test-device endpoint:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});




// Bind host controls what network interfaces the server listens on. (Done By Yu Kang)
// Default to 0.0.0.0 so phones on the same LAN can connect reliably. (Done By Yu Kang)
function getBindHost() {
    let bindHost = null;
    const args = process.argv.slice(2);

    for (const arg of args) {
        if (arg.startsWith('--bind=')) {
            bindHost = arg.split('=')[1];
            break;
        }
    }

    if (!bindHost && process.env.BIND_HOST) {
        bindHost = process.env.BIND_HOST;
    }

    return bindHost || '0.0.0.0';
}

// ==================== 2. NETWORK INTERFACE FUNCTIONS ====================
// CROSS-PLATFORM: os.networkInterfaces() works on Windows, Linux, and macOS
// Automatically detects WiFi, Ethernet, and other network adapters
// Perfect for QR code generation and mobile device access

// Get all available network interfaces and their IPs
function getAllNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const ifaceName in interfaces) {
        for (const iface of interfaces[ifaceName]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({
                    interface: ifaceName,
                    address: iface.address,
                    mac: iface.mac,
                    cidr: iface.cidr
                });
            }
        }
    }
    return ips;
}

// Get selected IP address
function getSelectedIP() {
    // Priority: Command line argument > Environment variable > First available IP
    let selectedIP = null;
    const preferredInterface = process.env.PREFERRED_INTERFACE || 'Wi-Fi 2';
    
    // Check command line arguments (e.g., node server.js --ip=192.168.1.100)
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (arg.startsWith('--ip=')) {
            selectedIP = arg.split('=')[1];
            break;
        }
    }
    
    // Check environment variable
    if (!selectedIP && process.env.SERVER_IP) {
        selectedIP = process.env.SERVER_IP;
    }
    
    // Validate the selected IP is available
    if (selectedIP) {
        const availableIPs = getAllNetworkIPs();
        const isValidIP = availableIPs.some(ip => ip.address === selectedIP);
        
        if (!isValidIP) {
            console.warn(`⚠️  Selected IP "${selectedIP}" is not available on any network interface`);
            console.log('   Available IPs:');
            availableIPs.forEach(ip => {
                console.log(`   - ${ip.address} (${ip.interface})`);
            });
            console.log('   Using first available IP instead');
            selectedIP = null;
        }
    }
    
    // Use first available IP if none selected
    if (!selectedIP) {
        const availableIPs = getAllNetworkIPs();

        // Prefer the configured interface (default: Wi-Fi 2) for mobile/QR access. (Done By Yu Kang)
        const preferredIP = availableIPs.find(
            ip => ip.interface.toLowerCase() === preferredInterface.toLowerCase()
        );

        if (preferredIP) {
            selectedIP = preferredIP.address;
            console.log(`📡 Using preferred interface IP: ${selectedIP} (${preferredIP.interface})`);
            return selectedIP;
        }

        if (availableIPs.length > 0) {
            selectedIP = availableIPs[0].address;
            console.log(`📡 Using first available IP: ${selectedIP} (${availableIPs[0].interface})`);
        } else {
            selectedIP = 'localhost';
            console.log('⚠️  No network interfaces found. Using localhost');
        }
    }
    
    return selectedIP;
}

// Get interface name for the selected IP
function getInterfaceForIP(ipAddress) {
    const interfaces = os.networkInterfaces();
    
    for (const ifaceName in interfaces) {
        for (const iface of interfaces[ifaceName]) {
            if (iface.family === 'IPv4' && iface.address === ipAddress) {
                return ifaceName;
            }
        }
    }
    return 'Unknown';
}

const localIP = getSelectedIP();
const interfaceName = getInterfaceForIP(localIP);
const bindHost = getBindHost();

// ==================== 3. SSL CERTIFICATE CONFIGURATION ====================

// Check for existing SSL certificate or generate new one
// Updated paths to use certs/ folder
const certsDir = path.join(__dirname, 'certs');
const certPath = path.join(certsDir, 'selfsigned.pem');
const keyPath = path.join(certsDir, 'selfsigned.key');

let sslOptions = null;

// Try to load existing certificates
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('🔒 Using existing SSL certificates from certs/ folder');
    sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
} else {
    // Auto-generate if missing
    console.log('🔒 Generating new SSL certificates...');
    try {
        const selfsigned = require('selfsigned');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = selfsigned.generate(attrs, { 
            days: 365,  // Valid for 1 year
            keySize: 2048 
        });
        
        // Create certs directory if it doesn't exist
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
            console.log('✅ Created certs/ directory');
        }
        
        fs.writeFileSync(certPath, pems.cert);
        fs.writeFileSync(keyPath, pems.private);
        
        sslOptions = {
            key: pems.private,
            cert: pems.cert
        };
        
        console.log('✅ SSL certificates generated in certs/ folder');
    } catch (error) {
        console.warn('⚠️  Could not generate SSL certificates');
        console.log('   Install: npm install selfsigned');
        console.log('   Running in HTTP mode instead');
    }
}

// ==================== 4. MIDDLEWARE CONFIGURATION ====================

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
        return res.status(413).json({
            success: false,
            error: `Upload is too large. Please retake the photo or use a smaller image. Limit: ${JSON_BODY_LIMIT}.`
        });
    }

    return next(err);
});

// Session middleware - set secure based on HTTPS availability
// app.use(session({
//     secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
//     resave: false,
//     saveUninitialized: false,
//     cookie: { 
//         secure: sslOptions !== null,
//         httpOnly: true,
//         maxAge: 1800000 // 30 minutes
//     }
// }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: true,  
    saveUninitialized: false,
    rolling: true,  
    cookie: { 
        secure: sslOptions !== null,
        httpOnly: true,
        maxAge: 1800000,
        sameSite: 'lax'  
    }
}));

// Keep the Pulse screen inside the authenticated admin experience.
app.use('/pulse', auth.requireAuth);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Wire the shared DB into the tree routes
setTreeDatabase(db);

// ==================== 5. API ROUTES ====================

app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/data-export', dataExportRoutes);
app.use('/api/pledgeboard', pledgeboardRoutes);
app.use('/api/pulse', auth.requireAuth, pulseRoutes);

// Tree API for the leaves (names from feedback.db)
app.use('/api/tree', treeRoutes);

app.get('/api/parameters', (req, res) => {
    try {
        res.json({ success: true, parameters: parametersConfigStore.readParametersConfig() });
    } catch (error) {
        console.error('Error loading public parameters:', error);
        res.status(500).json({ success: false, error: 'Failed to load parameters' });
    }
});

// API endpoint to get all network interfaces
app.get('/api/network-interfaces', (req, res) => {
    const interfaces = getAllNetworkIPs();
    res.json({
        interfaces: interfaces,
        current: {
            ip: localIP,
            interface: interfaceName,
            port: PORT
        }
    });
});

// API endpoint to get server info (IP, protocol, QR code)
app.get('/api/server-info', (req, res) => {
    const protocol = sslOptions ? 'https' : 'http';
    const url = `${protocol}://${localIP}:${PORT}/feedback`;
    
    res.json({
        ip: localIP,
        bindHost: bindHost,
        interface: interfaceName,
        port: PORT,
        protocol: protocol,
        url: url,
        httpsAvailable: sslOptions !== null,
        networkInterfaces: getAllNetworkIPs(),
        certsPath: sslOptions ? certsDir : null
    });
});

// Generate QR code endpoint
app.get('/api/generate-qr', async (req, res) => {
    try {
        const protocol = sslOptions ? 'https' : 'http';
        const url = `${protocol}://${localIP}:${PORT}/feedback`;
        
        
        const qrSvg = await QRCode.toString(url, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 200,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        res.json({
            success: true,
            qrSvg: qrSvg,
            url: url,
            ip: localIP,
            interface: interfaceName,
            port: PORT
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate QR code' 
        });
    }
});

// Kiosk-specific QR generation (single-use, short lifetime) (Done By Yu Kang)
app.get('/api/kiosk/generate-qr', async (req, res) => {
    try {
        await ensureQrPairingTables();

        const kiosk_id = req.query.kiosk_id;
        if (!kiosk_id) return res.status(400).json({ success: false, error: 'Missing kiosk_id' });

        const protocol = sslOptions ? 'https' : 'http';
        const urlBase = `${protocol}://${localIP}:${PORT}`;

        // Create a JWT token with short expiry and unique id
        const jti = uuidv4();
        const token = jwt.sign({ kiosk_id, jti }, JWT_SECRET, { expiresIn: `${QR_LIFETIME_SECONDS}s` });

        // Compute expires_at for DB
        const expiresAt = new Date(Date.now() + QR_LIFETIME_SECONDS * 1000);

        // Insert session record
        await new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO qr_sessions (token, kiosk_id, expires_at, used_token, connected) VALUES (?, ?, ?, 0, 0)`,
                [token, kiosk_id, expiresAt],
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        });

        const feedbackQueryUrl = `${urlBase}/feedback?token=${encodeURIComponent(token)}`;
        const feedbackPathUrl = `${urlBase}/feedback/${encodeURIComponent(token)}`;

        const qrSvg = await QRCode.toString(feedbackQueryUrl, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        res.json({ success: true, qrSvg, url: feedbackQueryUrl, urlPath: feedbackPathUrl, expiresAt: expiresAt.toISOString(), token });
    } catch (error) {
        console.error('Error generating kiosk QR:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Failed to generate QR' });
        }
    }
});

// Kiosk heartbeat via HTTP (alternative to socket heartbeat)
app.post('/api/kiosk/heartbeat', (req, res) => {
    const { kiosk_id } = req.body || {};
    if (!kiosk_id) return res.status(400).json({ success: false, error: 'Missing kiosk_id' });

    ensureQrPairingTables()
        .then(() => {
            db.query(`INSERT INTO kiosks (kiosk_id, status, last_seen) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW(), status='online'`, [kiosk_id, 'online'], (err) => {
                if (err) {
                    console.error('heartbeat error', err.message);
                    return res.status(500).json({ success: false, error: 'DB error' });
                }
                res.json({ success: true });
            });
        })
        .catch((schemaError) => {
            console.error('heartbeat schema setup error', schemaError.message);
            res.status(500).json({ success: false, error: 'QR setup failed' });
        });
});

// Phone connect token redemption helper
async function redeemToken(req, res, token) {
    if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const kiosk_id = payload.kiosk_id;
        await ensureQrPairingTables();

        // Look up session in DB
        db.query(`SELECT * FROM qr_sessions WHERE token = ? ORDER BY id DESC LIMIT 1`, [token], (err, results) => {
            if (err) {
                console.error('DB select qr_sessions error', err.message);
                return res.status(500).json({ success: false, error: 'DB error' });
            }

            const session = results && results[0];
            if (!session) return res.status(400).json({ success: false, error: 'Invalid session' });

            if (session.used_token) return res.status(400).json({ success: false, error: 'Token already used' });
            const now = new Date();
            if (session.expires_at && new Date(session.expires_at) < now) return res.status(400).json({ success: false, error: 'Token expired' });

            // Mark as used and connected
            const phoneSessionId = uuidv4();
            db.query(`UPDATE qr_sessions SET used_token = 1, connected = 1, phone_session = ? WHERE id = ?`, [phoneSessionId, session.id], (err2) => {
                if (err2) console.error('Error updating qr_sessions', err2.message);

                // Record pairing
                db.query(`INSERT INTO device_pairings (kiosk_id, phone_session) VALUES (?, ?)`, [kiosk_id, phoneSessionId], (err3) => {
                    if (err3) console.error('Error inserting device_pairings', err3.message);
                });

                // Notify kiosk via Socket.IO if connected
                const sid = kioskSockets.get(kiosk_id);
                if (sid && ioServer) {
                    ioServer.to(sid).emit('paired', { phoneSessionId, kiosk_id });
                }

                if (req.session) {
                    req.session.mobileAccessGranted = true;
                    req.session.mobileAccessToken = token;
                    req.session.mobileAccessKioskId = kiosk_id;
                    req.session.mobileAccessExpiresAt = session.expires_at || null;

                    return req.session.save((sessionErr) => {
                        if (sessionErr) {
                            console.error('Error saving mobile access session:', sessionErr.message);
                        }

                        res.json({
                            success: true,
                            kiosk_id,
                            phoneSessionId,
                            redirectUrl: '/pledgeboard'
                        });
                    });
                }

                // Respond to phone (could redirect to a mobile UI)
                res.json({ success: true, kiosk_id, phoneSessionId, redirectUrl: '/pledgeboard' });
            });
        });
    } catch (error) {
        console.error('Token verify error', error.message);
        const isTokenError = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';
        return res.status(isTokenError ? 400 : 500).json({
            success: false,
            error: isTokenError ? 'Invalid or expired token' : 'QR setup failed'
        });
    }
}

app.post('/api/connect/redeem', express.json(), (req, res) => {
    const token = (req.body && req.body.token) || req.query.token;
    return redeemToken(req, res, token);
});

// Test route
app.get('/api/test-db', (req, res) => {
    db.query(
        "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
        [process.env.DB_NAME || 'dp_kiosk_db'],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            res.json({
                message: 'MySQL database is working!',
                tables: results.length > 0 ? results.map(r => r.TABLE_NAME) : 'No tables found',
                database: process.env.DB_NAME || 'dp_kiosk_db'
            });
        }
    );
});

// Status endpoint for kiosk status monitor
// Returns online: true for standalone mode (Windows/testing without gateway)
// In production with gateway, the gateway handles this endpoint
app.get('/api/status', (req, res) => {
    res.json({
        online: true,
        mode: 'standalone',
        server: 'kiosk',
        message: 'Server is running (standalone mode)',
        timestamp: new Date().toISOString()
    });
});

// ==================== 6. PAGE ROUTES ====================

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/feedback/feedback.html'));
});

app.get('/bluetooth-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/bluetooth-test.html'));
});

app.get('/connect', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/connect/connect.html'));
});

app.get('/connect/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/connect/connect.html'));
});

app.get('/pledgeboard', requireMobileTokenForPledgeboard, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/Pledgeboard/Pledgeboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/admin.html'));
});

// Tree page – assumes file: frontend/tree/tree.html
app.get('/tree', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tree/tree.html'));
});

app.get('/pulse', auth.requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pulse/pulse.html'));
});

// Default redirect
app.get('/', (req, res) => {
    res.redirect('/feedback');
});

// ==================== 7. CERTIFICATE & SERVER FUNCTIONS ====================

// Function to generate self-signed certificate if needed
function generateSelfSignedCertificate() {
    try {
        const selfsigned = require('selfsigned');
        console.log('🔐 Generating self-signed SSL certificate...');
        
        const attrs = [{ name: 'commonName', value: localIP }];
        const pems = selfsigned.generate(attrs, { 
            days: 365,
            keySize: 2048
        });
        
        // Create certs directory if it doesn't exist
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }
        
        // Update paths to write to certs folder
        fs.writeFileSync(certPath, pems.cert);
        fs.writeFileSync(keyPath, pems.private);
        
        console.log('✅ Self-signed certificate generated in certs/ folder');
        return {
            key: pems.private,
            cert: pems.cert
        };
    } catch (error) {
        console.error('❌ Failed to generate SSL certificate:', error.message);
        console.log('💡 Install selfsigned package: npm install selfsigned');
        return null;
    }
}

// Start server
function startServer() {
    // DB schema is provided in database/schema.sql; run manually or via migration (Done By Yu Kang)

    let server;
    if (sslOptions) {
        server = https.createServer(sslOptions, app);
    } else {
        server = http.createServer(app);
    }

    // Initialize Socket.IO
    initSocketServer(server);

    server.listen(PORT, bindHost, () => {
        printServerInfo(!!sslOptions);
    });
}

function printServerInfo(isHttps) {
    const protocol = isHttps ? 'HTTPS' : 'HTTP';
    const availableIPs = getAllNetworkIPs();
    const platform = os.platform();
    const platformNames = {
        'win32': 'Windows',
        'linux': 'Linux',
        'darwin': 'macOS',
        'freebsd': 'FreeBSD'
    };
    
    console.log('\n🌐 ============================================');
    console.log('   FEEDBACK KIOSK SERVER');
    console.log('============================================');
    console.log(`💻 Platform: ${platformNames[platform] || platform}`);
    console.log(`🔌 Bind Host: ${bindHost}`);
    console.log(`📡 Selected Interface: ${interfaceName}`);
    console.log(`📡 Selected IP: ${localIP}`);
    console.log(`🚀 ${protocol}: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}`);
    console.log(`📊 Feedback: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/feedback`);
    console.log(`🏆 Pledgeboard: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/pledgeboard`);
    console.log(`🌳 Tree: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/tree`);
    console.log(`⚙️  Admin: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/admin`);
    console.log(`📦 Data Export: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/api/admin/data-export`); 
    console.log(`📅 Started: ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`);
    console.log('🌏 Timezone: Singapore (UTC+8)');
    console.log(`🗄️  Database: MySQL (${process.env.DB_NAME || 'dp_kiosk_db'})`);
    console.log(`🔐 SSL Certificates: ${certsDir}/`);
    console.log('============================================');
    
    console.log('\n🌐 Available Network Interfaces:');
    if (availableIPs.length > 0) {
        availableIPs.forEach(ip => {
            const indicator = ip.address === localIP ? '→ ' : '  ';
            console.log(`   ${indicator}${ip.address} (${ip.interface}) ${ip.cidr ? `[${ip.cidr}]` : ''}`);
        });
    } else {
        console.log('   No network interfaces found');
    }
    
    console.log('\n📱 Mobile Access (QR Code URLs):');
    console.log(`   Feedback: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/feedback`);
    console.log(`   Pledgeboard: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/pledgeboard`);
    console.log(`   QR API: ${isHttps ? 'https' : 'http'}://${localIP}:${PORT}/api/generate-qr`);
    
    // Platform-specific tips
    if (platform === 'win32') {
        console.log('\n💡 Windows Tips:');
        console.log('   • Use start-simple.bat for easy testing');
        console.log('   • Check firewall for ports 3000-3002');
        console.log('   • For production, use Linux with systemd');
    } else if (platform === 'linux') {
        console.log('\n💡 Linux Tips:');
        console.log('   • Use systemctl for service management');
        console.log('   • Check firewall: sudo ufw status');
        console.log('   • For scheduling: Use kiosk-schedules.json');
    }
    
    console.log('============================================\n');

    // Initialize data retention cleanup system
    dataRetentionCleanup.initializeCleanup();
}

// Note: DB schema creation moved to `database/schema.sql`.

// Socket.IO server instance (set when starting)
let ioServer = null;

function initSocketServer(httpServer) {
    ioServer = new SocketIOServer(httpServer, {
        cors: {
            origin: '*'
        }
    });

    ioServer.on('connection', (socket) => {
        // Kiosk or admin clients should call 'register-kiosk' with their kiosk_id
        socket.on('register-kiosk', (data) => {
            try {
                const kiosk_id = data && data.kiosk_id;
                if (!kiosk_id) return;
                kioskSockets.set(kiosk_id, socket.id);
                ensureQrPairingTables()
                    .then(() => {
                        db.query(
                            `INSERT INTO kiosks (kiosk_id, status, last_seen) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE status=VALUES(status), last_seen=NOW()`,
                            [kiosk_id, 'online'],
                            (err) => { if (err) console.error('kiosk upsert error', err); }
                        );
                    })
                    .catch((schemaError) => {
                        console.error('kiosk schema setup error', schemaError.message);
                    });
            } catch (e) {
                console.error('register-kiosk error', e);
            }
        });

        socket.on('heartbeat', (data) => {
            const kiosk_id = data && data.kiosk_id;
            if (!kiosk_id) return;
            ensureQrPairingTables()
                .then(() => {
                    db.query(`UPDATE kiosks SET last_seen = NOW(), status='online' WHERE kiosk_id = ?`, [kiosk_id], (err) => {
                        if (err) console.error('heartbeat db update error', err.message);
                    });
                })
                .catch((schemaError) => {
                    console.error('socket heartbeat schema setup error', schemaError.message);
                });
        });

        socket.on('disconnect', () => {
            // remove socket id from kioskSockets if present
            for (const [kiosk_id, sid] of kioskSockets.entries()) {
                if (sid === socket.id) kioskSockets.delete(kiosk_id);
            }
        });
    });
}

// Try to enable HTTPS if selfsigned package is available
try {
    require.resolve('selfsigned');
    
    if (!sslOptions) {
        // Generate certificate if selfsigned is available
        sslOptions = generateSelfSignedCertificate();
    }
} catch (error) {
    console.log('⚠️  "selfsigned" package not installed. Running in HTTP mode.');
    console.log('💡 For HTTPS, run: npm install selfsigned');
}

// ==================== 8. SERVER STARTUP & INITIALIZATION ====================

// Email test endpoint
app.get('/api/test-email-service', (req, res) => {
    const emailInitialized = emailService.initEmailService();
    if (emailInitialized) {
        res.json({ 
            success: true, 
            message: 'Email service initialized',
            smtpUser: process.env.SMTP_USER || 'Using default'
        });
    } else {
        res.json({ 
            success: false, 
            message: 'Email service failed to initialize',
            error: 'Check SMTP credentials'
        });
    }
});

// Initialize email service
const emailInitialized = emailService.initEmailService();
if (emailInitialized) {
    console.log('📧 Email service initialized successfully');
} else {
    console.log('⚠️ Email service not initialized - check SMTP credentials');
}

// Display help if requested
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUsage:');
    console.log('  node server.js [options]');
    console.log('\nOptions:');
    console.log('  --ip=<IP_ADDRESS>    Specify the IP address to bind to');
    console.log('  --bind=<HOST>        Specify bind host (default: 0.0.0.0)');
    console.log('  --help, -h           Show this help message');
    console.log('\nExamples:');
    console.log('  node server.js --ip=192.168.1.100');
    console.log('  node server.js --ip=10.0.0.5');
    console.log('\nEnvironment Variables:');
    console.log('  SERVER_IP=<IP_ADDRESS>  Specify IP via environment variable');
    console.log('  PREFERRED_INTERFACE=<NAME> Prefer adapter when auto-selecting IP (default: Wi-Fi 2)');
    console.log('  BIND_HOST=<HOST>        Specify bind host (default: 0.0.0.0)');
    console.log('  PORT=<PORT_NUMBER>      Change port (default: 3000)');
    console.log('\nAvailable IPs:');
    const availableIPs = getAllNetworkIPs();
    if (availableIPs.length > 0) {
        availableIPs.forEach(ip => {
            console.log(`  - ${ip.address} (${ip.interface})`);
        });
    } else {
        console.log('  No network interfaces found');
    }
    console.log('');
    process.exit(0);
}

// Start the server
startServer();

// ==================== PLATFORM-SPECIFIC NOTES ====================
// 
// WINDOWS (Testing/Development):
// - Use start-simple.bat to start all servers
// - Run node find-ip.js to get network IP for QR codes
// - Mobile devices must be on same WiFi network
// - Accept self-signed certificate warning in browsers
// - For firewall: netsh advfirewall firewall add rule name="Kiosk" dir=in action=allow protocol=TCP localport=3000-3002
//
// LINUX (Production):
// - Use systemd services (gateway.service, admin.service, kiosk.service)
// - Use scheduleRunner.js with cron for automated scheduling
// - For firewall: sudo ufw allow 3000:3002/tcp
// - SSL certificates in /certs/ directory
//
// BOTH PLATFORMS:
// - Network IP detection works automatically
// - QR codes use detected network IP
// - Self-signed SSL certificates auto-generated
// - Database connection via db.js (MySQL)
// - Environment variables in .env file
//
// ============================================================
