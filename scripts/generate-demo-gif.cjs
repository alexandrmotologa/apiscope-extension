const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5173;
const URL = `http://localhost:${PORT}/`;
const FRAMES_DIR = path.join(__dirname, '..', 'temp_demo_frames');
const OUTPUT_GIF = path.join(__dirname, '..', 'docs', 'images', 'apiscope-demo.gif');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      if (res.statusCode === 200) resolve(true);
      else resolve(false);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServerReady()) return true;
    await wait(400);
  }
  throw new Error('Vite server failed to start within timeout');
}

async function main() {
  console.log('1. Starting Vite dev server...');
  let viteProcess = null;
  const alreadyRunning = await checkServerReady();
  if (!alreadyRunning) {
    viteProcess = spawn('npx.cmd', ['vite', '--port', String(PORT)], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
      detached: false,
      shell: true
    });
    await waitForServer();
  }
  console.log('Vite server is ready.');

  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('2. Launching Chrome with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1280,800',
      '--force-device-scale-factor=1'
    ],
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0' });

  // Inject sleek SVG animated cursor
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.85a.5.5 0 0 0-.35-.15z" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <div id="demo-ripple" style="position: absolute; top: -6px; left: -6px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #38bdf8; opacity: 0; pointer-events: none; transform: scale(0.5); transition: transform 0.3s ease-out, opacity 0.3s ease-out;"></div>
    `;
    cursor.style.position = 'fixed';
    cursor.style.top = '0px';
    cursor.style.left = '0px';
    cursor.style.zIndex = '999999';
    cursor.style.pointerEvents = 'none';
    cursor.style.transform = 'translate(640px, 400px)';
    cursor.style.transition = 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)';
    document.body.appendChild(cursor);
  });

  let frameCount = 0;
  async function captureFrame() {
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
  }

  async function moveCursorTo(x, y, steps = 4) {
    const currentPos = await page.evaluate(() => {
      const cursor = document.getElementById('demo-cursor');
      const transform = cursor.style.transform;
      const match = transform.match(/translate\((\d+(?:\.\d+)?)px,\s*(\d+(?:\.\d+)?)px\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 640, y: 400 };
    });

    for (let i = 1; i <= steps; i++) {
      const curX = currentPos.x + (x - currentPos.x) * (i / steps);
      const curY = currentPos.y + (y - currentPos.y) * (i / steps);
      await page.evaluate((px, py) => {
        const cursor = document.getElementById('demo-cursor');
        if (cursor) cursor.style.transform = `translate(${px}px, ${py}px)`;
      }, curX, curY);
      await captureFrame();
    }
  }

  async function clickAt(x, y) {
    await moveCursorTo(x, y, 4);
    await page.evaluate(() => {
      const ripple = document.getElementById('demo-ripple');
      if (ripple) {
        ripple.style.transition = 'none';
        ripple.style.transform = 'scale(0.5)';
        ripple.style.opacity = '1';
        requestAnimationFrame(() => {
          ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
          ripple.style.transform = 'scale(2.2)';
          ripple.style.opacity = '0';
        });
      }
    });
    await page.mouse.click(x, y);
    await captureFrame();
    await captureFrame();
  }

  async function getElementCenter(selector, textMatch = null) {
    return await page.evaluate((sel, text) => {
      const elements = Array.from(document.querySelectorAll(sel));
      const target = text 
        ? elements.find(el => el.textContent && el.textContent.includes(text))
        : elements[0];
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, selector, textMatch);
  }

  console.log('3. Recording showcase actions...');

  // Pause at start (3 frames)
  for (let i = 0; i < 3; i++) await captureFrame();

  // Phase 1: Traffic & Request Selection (Stripe POST /v1/payment_intents)
  console.log('- Phase 1: Selecting Stripe payment intent request');
  let stripePos = await getElementCenter('tr, [role="row"], div', 'payment_intents');
  if (!stripePos) {
    stripePos = await getElementCenter('tr:nth-child(2)');
  }
  if (stripePos) {
    await clickAt(stripePos.x, stripePos.y);
  }
  for (let i = 0; i < 4; i++) await captureFrame();

  // Phase 2: Security Audit tab
  console.log('- Phase 2: Clicking Security Audit tab');
  let secTab = await getElementCenter('button', 'Security');
  if (!secTab) secTab = await getElementCenter('[role="tab"]', 'Security');
  if (secTab) {
    await clickAt(secTab.x, secTab.y);
  }
  for (let i = 0; i < 6; i++) await captureFrame();

  // Click High/Critical filter badge if present
  let badgePos = await getElementCenter('button, span, div', 'High');
  if (badgePos) {
    await clickAt(badgePos.x, badgePos.y);
    for (let i = 0; i < 3; i++) await captureFrame();
  }

  // Phase 3: Payload & Schema Generator
  console.log('- Phase 3: Clicking Payload tab & Schema Generator');
  let payloadTab = await getElementCenter('button', 'Payload');
  if (!payloadTab) payloadTab = await getElementCenter('[role="tab"]', 'Payload');
  if (payloadTab) {
    await clickAt(payloadTab.x, payloadTab.y);
  }
  for (let i = 0; i < 4; i++) await captureFrame();

  let zodBtn = await getElementCenter('button', 'Zod');
  if (!zodBtn) zodBtn = await getElementCenter('button', 'Schema');
  if (zodBtn) {
    await clickAt(zodBtn.x, zodBtn.y);
  }
  for (let i = 0; i < 5; i++) await captureFrame();

  // Phase 4: Quick Action Bar & Export
  console.log('- Phase 4: Quick Action Bar & Export');
  let exportBtn = await getElementCenter('button', 'Export');
  if (exportBtn) {
    await clickAt(exportBtn.x, exportBtn.y);
    for (let i = 0; i < 6; i++) await captureFrame();
  }

  // Phase 5: Live Traffic Stream (Stream OFF -> Stream ON)
  console.log('- Phase 5: Toggle Stream ON');
  let streamBtn = await getElementCenter('button', 'Stream OFF');
  if (!streamBtn) streamBtn = await getElementCenter('button', 'Stream');
  if (streamBtn) {
    await clickAt(streamBtn.x, streamBtn.y);
    for (let i = 0; i < 10; i++) {
      await wait(100);
      await captureFrame();
    }
  }

  // Final hold
  for (let i = 0; i < 4; i++) await captureFrame();

  console.log(`Captured ${frameCount} frames.`);
  await browser.close();

  if (viteProcess) {
    viteProcess.kill();
  }

  console.log('4. Compiling GIF with FFmpeg (2-pass palette optimization)...');
  const palettePath = path.join(FRAMES_DIR, 'palette.png');
  const pass1 = `ffmpeg -y -framerate 10 -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -vf "scale=960:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" "${palettePath}"`;
  execSync(pass1, { stdio: 'inherit' });

  const pass2 = `ffmpeg -y -framerate 10 -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -i "${palettePath}" -lavfi "scale=960:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" "${OUTPUT_GIF}"`;
  execSync(pass2, { stdio: 'inherit' });

  const stats = fs.statSync(OUTPUT_GIF);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`GIF generated successfully: ${OUTPUT_GIF}`);
  console.log(`File size: ${sizeMB} MB (${stats.size} bytes)`);

  if (stats.size > 4194304) {
    console.error('WARNING: GIF exceeds 4MB limit!');
    process.exit(1);
  } else {
    console.log('GIF is strictly under 4MB constraint. SUCCESS!');
  }

  // Cleanup frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
