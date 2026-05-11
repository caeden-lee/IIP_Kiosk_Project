const { spawn } = require('child_process');
const path = require('path');

// Start the split gateway, kiosk and admin services; db.js is imported by these servers. (Done by Caeden)
const scripts = ['backend/gatewayServer.js', 'backend/kioskServer.js', 'backend/adminServer.js'];
const children = [];
let shuttingDown = false;

function startScript(scriptName) {
	const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
		cwd: __dirname,
		stdio: 'inherit',
		env: process.env,
	});

	child.on('exit', (code, signal) => {
		console.log(`Process ended: ${scriptName} ${signal ? `(${signal})` : `(code ${code})`}`);

		if (shuttingDown) {
			return;
		}

		const allExited = children.every((otherChild) => otherChild.killed || otherChild.exitCode !== null);
		if (allExited && !process.exitCode) {
			process.exitCode = code && code !== 0 ? code : 0;
		}
	});

	child.on('error', (error) => {
		console.error(`Failed to start ${scriptName}:`, error.message);
		process.exitCode = 1;
	});

	children.push(child);
}

for (const scriptName of scripts) {
	startScript(scriptName);
}

function shutdown() {
	shuttingDown = true;
	for (const child of children) {
		if (!child.killed) {
			child.kill();
		}
	}
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
