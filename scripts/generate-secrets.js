const fs = require('fs');
const path = require('path');

function generateSecret(bytes = 32) {
	return require('crypto').randomBytes(bytes).toString('base64url');
}

function upsertEnvVars(filePath, entries) {
	let content = '';
	try {
		content = fs.readFileSync(filePath, 'utf8');
	} catch {}

	for (const key of Object.keys(entries)) {
		const regex = new RegExp(`^${key}=.*\r?\n?`, 'm');
		content = content.replace(regex, '');
	}

	const needsNewline = content.length > 0 && !content.endsWith('\n');
	const lines = Object.entries(entries).map(([k, v]) => `${k}=${v}`);
	const suffix = (needsNewline ? '\n' : '') + lines.join('\n') + '\n';
	fs.writeFileSync(filePath, content + suffix, 'utf8');
}

const envPath = path.resolve(process.cwd(), '.env.local');
const ADMIN_SESSION_SECRET = generateSecret(32);
const TEACHER_SESSION_SECRET = generateSecret(32);

upsertEnvVars(envPath, { ADMIN_SESSION_SECRET, TEACHER_SESSION_SECRET });

console.log('Secrets written to .env.local');


