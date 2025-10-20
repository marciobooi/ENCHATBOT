#!/usr/bin/env node

import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import axe from 'axe-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_TARGET_URL = 'http://localhost:5173';
const targetUrl = process.env.ACCESSIBILITY_TARGET_URL ?? DEFAULT_TARGET_URL;
const watchRequested = process.argv.includes('--watch');
const reportAsJson = process.argv.includes('--json');

const WATCH_GLOBS = [
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'public', '**', '*.{html,htm,md,mdx}'),
  path.join(projectRoot, 'src', '**', '*.{tsx,ts,jsx,js,md,mdx,html,css}'),
  path.join(projectRoot, '**', '*.md')
];

async function runAccessibilityScan(triggerLabel = 'manual') {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const startedAt = new Date();
  console.log(`\n[accessibility] Starting scan (${triggerLabel}) against ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  } catch (error) {
    console.error('[accessibility] Failed to load application. Make sure the dev server is running or set ACCESSIBILITY_TARGET_URL.');
    console.error(`[accessibility] ${error.message}`);
    await browser.close();
    throw error;
  }

  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    return await window.axe.run({
      resultTypes: ['violations'],
      reporter: 'v2'
    });
  });

  await browser.close();

  const finishedAt = new Date();
  const duration = ((finishedAt - startedAt) / 1000).toFixed(2);

  if (reportAsJson) {
    console.log(JSON.stringify(results, null, 2));
  }

  if (results.violations.length === 0) {
    console.log(`[accessibility] ✅ No violations detected (${duration}s).`);
    return { hasViolations: false };
  }

  console.log(`[accessibility] ❌ Found ${results.violations.length} violation group(s) (${duration}s).`);

  for (const violation of results.violations) {
    const nodesPreview = violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(', ');
    const truncatedPreview = nodesPreview || '(no selector)';
    const snippet = violation.nodes[0]?.html?.trim().slice(0, 120) ?? '';

    console.log(`  • [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`);
    console.log(`      selectors: ${truncatedPreview}`);
    if (snippet) {
      console.log(`      snippet: ${snippet}`);
    }
    console.log(`      help: ${violation.helpUrl}`);
  }

  return { hasViolations: true, results };
}

async function runOnce() {
  try {
    const { hasViolations } = await runAccessibilityScan();
    if (hasViolations) {
      process.exitCode = 1;
    }
  } catch (error) {
    process.exitCode = 1;
  }
}

function startWatcher() {
  console.log('[accessibility] Watch mode enabled. Listening for HTML/Markdown/component changes...');
  console.log(`[accessibility] Target URL: ${targetUrl}`);

  const relativeGlobs = WATCH_GLOBS.map((glob) => path.relative(projectRoot, glob));
  console.log(`[accessibility] Globs: ${relativeGlobs.join(', ')}`);

  let debounceTimer;
  let pendingTrigger;
  let scanInProgress = false;

  const scheduleScan = (trigger) => {
    pendingTrigger = trigger;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      if (scanInProgress) {
        return;
      }

      const label = pendingTrigger;
      pendingTrigger = undefined;
      scanInProgress = true;

      try {
        const { hasViolations } = await runAccessibilityScan(label);
        if (hasViolations) {
          console.log('[accessibility] Violations detected. Address issues before shipping.');
        }
      } catch (error) {
        console.error('[accessibility] Scan failed.', error);
      } finally {
        scanInProgress = false;
      }
    }, 250);
  };

  const watcher = chokidar.watch(WATCH_GLOBS, {
    ignoreInitial: true,
    ignored: [
      path.join(projectRoot, 'node_modules', '**'),
      path.join(projectRoot, 'dist', '**'),
      path.join(projectRoot, '.git', '**')
    ],
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50
    }
  });

  watcher.on('all', (event, filePath) => {
    const relativePath = path.relative(projectRoot, filePath);
    scheduleScan(`${event}: ${relativePath}`);
  });

  // Initial scan once watchers are ready.
  watcher.on('ready', () => {
    scheduleScan('initial');
  });
}

if (watchRequested) {
  startWatcher();
} else {
  runOnce();
}
