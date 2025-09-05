#!/usr/bin/env node
/*
 Simple ngrok helper for local dev using the ngrok CLI.
 No npm ngrok dependency required; this spawns the CLI.
 Usage:
  - NGROK_AUTHTOKEN=<token> node scripts/ngrok.js --port 3000
  - node scripts/ngrok.js --port 8000
*/

const { spawnSync, spawn } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { port: 3000 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--port' || a === '-p') && args[i + 1]) {
      options.port = parseInt(args[++i], 10);
    } else if ((a === '--region' || a === '-r') && args[i + 1]) {
      options.region = args[++i];
    } else if (a === '--domain' && args[i + 1]) {
      options.domain = args[++i];
    } else if (a === '--help' || a === '-h') {
      options.help = true;
    }
  }
  return options;
}

function ensureNgrokCli() {
  const check = spawnSync('ngrok', ['version'], { stdio: 'pipe' });
  if (check.error) {
    console.error('ngrok CLI not found on PATH.');
    console.error('Install it, e.g. on macOS: brew install ngrok/ngrok/ngrok');
    console.error('Then authenticate: ngrok config add-authtoken <YOUR_TOKEN>');
    process.exit(1);
  }
}

function runTunnel(opts) {
  // Force IPv4 loopback to avoid systems where 'localhost' resolves to ::1
  const upstream = `http://127.0.0.1:${opts.port}`;
  const args = ['http', upstream, '--log=stdout'];
  if (process.env.NGROK_AUTHTOKEN) {
    args.push('--authtoken', process.env.NGROK_AUTHTOKEN);
  }
  if (opts.region) {
    args.push('--region', opts.region);
  }
  if (opts.domain) {
    // Reserved domain requires authtoken and reservation in dashboard
    args.push('--domain', opts.domain);
  }

  console.log(`Starting ngrok tunnel → http://localhost:${opts.port}`);
  console.log('Tip: set NGROK_AUTHTOKEN for stable URLs.');
  const child = spawn('ngrok', args, { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}

function main() {
  const opts = parseArgs();
  if (opts.help) {
    console.log('Usage: node scripts/ngrok.js --port <number> [--region us|eu|ap|au|sa|jp|in] [--domain <your-domain>]');
    process.exit(0);
  }
  ensureNgrokCli();
  runTunnel(opts);
}

main();
