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
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const db = require('./db');
const feedbackRoutes = require('./feedbackRoutes');
const adminRoutes = require('./adminRoutes');
const dataExportRoutes = require('./dataExportRoutes');
const pledgeboardRoutes = require('./pledgeboardRoutes');
const os = require('os');
const emailService = require('./emailService');

// Import tree routes and wire them to the shared DB
const { router: treeRoutes, setDatabase: setTreeDatabase } = require('./treeRoutes');

// Import cleanup module
const dataRetentionCleanup = require('./dataRetentionCleanup');

// Import QR code generation
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Tree API for the leaves (names from feedback.db)
app.use('/api/tree', treeRoutes);

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

app.get('/pledgeboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/Pledgeboard/Pledgeboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/admin.html'));
});

// Tree page – assumes file: frontend/tree/tree.html
app.get('/tree', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tree/tree.html'));
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
    if (sslOptions) {
        // Start HTTPS server
        const server = https.createServer(sslOptions, app);
        server.listen(PORT, bindHost, () => {
            printServerInfo(true);
        });
    } else {
        // Start HTTP server (fallback)
        app.listen(PORT, bindHost, () => {
            printServerInfo(false);
        });
    }
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
