// Frontend helper to use Web Bluetooth APIs and report devices to server
// Usage: call `startBluetoothScan()` from a user gesture (button click)

async function startBluetoothScan() {
    if (!navigator.bluetooth) {
        console.warn('⚠️ Web Bluetooth API not available in this browser');
        alert('Web Bluetooth not supported. Use Chrome/Edge on Windows/Mac/Linux with Bluetooth.');
        return;
    }

    try {
        console.log('🔍 Opening Bluetooth device picker...');
        // Request a device. This shows the browser picker to the user.
        const device = await navigator.bluetooth.requestDevice({
            // Accept all devices so user can pick; filtering may be added for production
            acceptAllDevices: true,
            optionalServices: []
        });

        console.log(`✅ Device selected: ${device.name} (${device.id})`);

        // Send an initial report to the server with device.id and name
        await sendReport({ id: device.id, name: device.name || null, rssi: null });

        // If the device supports advertisements, listen for RSSI updates
        if (device.watchAdvertisements) {
            try {
                console.log('📡 Starting advertisement watcher for RSSI updates...');
                await device.watchAdvertisements();
                device.addEventListener('advertisementreceived', (event) => {
                    const rssi = event.rssi !== undefined ? event.rssi : null;
                    console.log(`📡 RSSI update: ${rssi} dBm`);
                    sendReport({ id: device.id, name: device.name || null, rssi });
                });
            } catch (err) {
                console.warn('⚠️ watchAdvertisements not available:', err.message);
            }
        } else {
            console.warn('⚠️ Advertisement watching not supported by this device');
        }

        // Optionally connect and read RSSI via GATT (not always available)
        // Note: Many devices do not expose RSSI via GATT; advertisement events are preferred
        try {
            console.log('🔗 Attempting GATT connection...');
            const server = await device.gatt.connect();
            console.log('✅ GATT connected');
            // No standard RSSI read; rely on advertisementreceived when available
            // Disconnect when page unloads
            window.addEventListener('beforeunload', () => {
                try { 
                    server.disconnect();
                    console.log('🔌 GATT disconnected');
                } catch (e) {}
            });
        } catch (err) {
            console.warn('⚠️ GATT connection failed:', err.message);
            // Not critical
        }

    } catch (error) {
        console.warn('⚠️ Bluetooth requestDevice failed or was cancelled by user', error);
    }
}

async function sendReport(payload) {
    try {
        console.log('📤 Sending device report to server:', payload);
        const response = await fetch('/api/bluetooth/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Device report sent successfully');
        } else {
            console.error('❌ Server returned error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Failed to send bluetooth report to server:', error);
    }
}

// Expose for debugging
window.startBluetoothScan = startBluetoothScan;
window.sendReport = sendReport;

console.log('📡 Bluetooth client loaded. Call startBluetoothScan() to begin scanning for devices.');
