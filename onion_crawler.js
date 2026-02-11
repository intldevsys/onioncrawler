// ==UserScript==
// @name         Universal Onion Directory Crawler
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Recursively crawl any onion directory listing and export file list to txt
// @author       You
// @match        http://*.onion/*
// @match        https://*.onion/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CRAWL_DELAY = 500; // ms between requests to avoid overwhelming server
    const MAX_DEPTH = 50; // prevent infinite loops

    let discoveredFiles = new Set();
    let discoveredDirs = new Set();
    let crawlQueue = [];
    let isRunning = false;
    let shouldStop = false;

    // Detect if current page is a directory listing
    function isDirectoryListing() {
        // Check for common directory listing indicators
        const title = document.title.toLowerCase();
        const body = document.body ? document.body.textContent.toLowerCase() : '';

        // Common patterns in directory listings
        const indicators = [
            title.includes('index of'),
            title.includes('directory listing'),
            document.querySelector('pre a[href]'), // Common in Apache/nginx
            document.querySelectorAll('table a[href]').length > 3, // Table-based listings
            /parent directory|\.\.\//i.test(body) // Parent directory link
        ];

        return indicators.some(x => x);
    }

    // Parse directory listing page (works with multiple formats)
    function parseDirectoryListing(html, baseUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');

        const items = {
            files: [],
            directories: []
        };

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '../' || href === '..') return;

            // Skip external links, anchors, and common non-file links
            if (href.startsWith('http://') || href.startsWith('https://') || 
                href.startsWith('#') || href.startsWith('?') ||
                href.startsWith('mailto:') || href.startsWith('javascript:')) {
                return;
            }

            try {
                const fullUrl = new URL(href, baseUrl).href;

                // Only process URLs on the same domain
                const baseHost = new URL(baseUrl).hostname;
                const linkHost = new URL(fullUrl).hostname;
                if (baseHost !== linkHost) return;

                // Check if it's a directory (ends with /)
                if (href.endsWith('/')) {
                    items.directories.push(fullUrl);
                } else {
                    items.files.push(fullUrl);
                }
            } catch (e) {
                console.warn(`Invalid URL: ${href}`, e);
            }
        });

        return items;
    }

    // Fetch and parse a URL
    async function crawlUrl(url, depth) {
        if (depth > MAX_DEPTH) {
            console.log(`Max depth reached for ${url}`);
            return;
        }

        if (discoveredDirs.has(url)) {
            return; // Already crawled
        }

        discoveredDirs.add(url);
        console.log(`Crawling [depth ${depth}]: ${url}`);

        try {
            const response = await fetch(url);
            const html = await response.text();
            const items = parseDirectoryListing(html, url);

            // Add files to discovered set
            items.files.forEach(file => {
                discoveredFiles.add(file);
                console.log(`Found file: ${file}`);
            });

            // Add directories to queue
            items.directories.forEach(dir => {
                if (!discoveredDirs.has(dir)) {
                    crawlQueue.push({ url: dir, depth: depth + 1 });
                }
            });

        } catch (error) {
            console.error(`Error crawling ${url}:`, error);
        }
    }

    // Process crawl queue
    async function processCrawlQueue() {
        while (crawlQueue.length > 0 && !shouldStop) {
            const { url, depth } = crawlQueue.shift();
            await crawlUrl(url, depth);

            // Update UI
            updateStatus();

            // Delay between requests
            await new Promise(resolve => setTimeout(resolve, CRAWL_DELAY));
        }

        // Done crawling (completed or stopped)
        if (shouldStop) {
            console.log('Crawl stopped by user');
        } else {
            console.log('Crawl complete!');
        }
        console.log(`Found ${discoveredFiles.size} files in ${discoveredDirs.size} directories`);
        generateOutputFile();
    }

    // Generate and download txt file
    function generateOutputFile() {
        const sortedFiles = Array.from(discoveredFiles).sort();
        const output = sortedFiles.join('\n');

        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const hostname = window.location.hostname.replace('.onion', '');
        a.download = `crawl_${hostname}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const statusMsg = shouldStop ? 'stopped' : 'complete';
        alert(`Crawl ${statusMsg}!\nFiles found: ${discoveredFiles.size}\nDirectories: ${discoveredDirs.size}`);
        isRunning = false;
        shouldStop = false;
        updateUI();
    }

    // Create UI controls
    function createUI() {
        // Check if UI already exists
        if (document.getElementById('crawler-control')) {
            console.log('Crawler UI already exists');
            return;
        }

        // Only show UI on directory listings
        if (!isDirectoryListing()) {
            console.log('Not a directory listing, UI hidden');
            return;
        }

        console.log('Creating crawler UI...');

        const controlPanel = document.createElement('div');
        controlPanel.id = 'crawler-control';
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #2d2d2d;
            color: #fff;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: monospace;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            min-width: 250px;
        `;

        controlPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 14px;">🕷️ Directory Crawler</h3>
            <button id="start-crawl" style="width: 100%; padding: 8px; margin-bottom: 5px; cursor: pointer; background: #4a4; color: white; border: none; border-radius: 3px;">
                Start Crawl
            </button>
            <button id="stop-crawl" style="width: 100%; padding: 8px; margin-bottom: 10px; cursor: pointer; background: #c44; color: white; border: none; border-radius: 3px; display: none;">
                Stop & Export
            </button>
            <div id="crawl-status" style="font-size: 12px; line-height: 1.5;">
                <div>Files: <span id="file-count">0</span></div>
                <div>Directories: <span id="dir-count">0</span></div>
                <div>Queue: <span id="queue-count">0</span></div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; font-size: 10px; color: #aaa;">
                Delay: ${CRAWL_DELAY}ms | Max depth: ${MAX_DEPTH}
            </div>
        `;

        document.body.appendChild(controlPanel);

        document.getElementById('start-crawl').addEventListener('click', startCrawl);
        document.getElementById('stop-crawl').addEventListener('click', stopCrawl);
        updateUI();

        console.log('Crawler UI created successfully');
    }

    // Update UI state
    function updateUI() {
        const startButton = document.getElementById('start-crawl');
        const stopButton = document.getElementById('stop-crawl');

        if (startButton && stopButton) {
            startButton.textContent = isRunning ? 'Crawling...' : 'Start Crawl';
            startButton.disabled = isRunning;
            startButton.style.opacity = isRunning ? '0.5' : '1';
            startButton.style.display = isRunning ? 'none' : 'block';

            stopButton.style.display = isRunning ? 'block' : 'none';
        }
    }

    // Update status counters
    function updateStatus() {
        const fileCount = document.getElementById('file-count');
        const dirCount = document.getElementById('dir-count');
        const queueCount = document.getElementById('queue-count');

        if (fileCount) fileCount.textContent = discoveredFiles.size;
        if (dirCount) dirCount.textContent = discoveredDirs.size;
        if (queueCount) queueCount.textContent = crawlQueue.length;
    }

    // Start crawling process
    function startCrawl() {
        if (isRunning) return;

        isRunning = true;
        shouldStop = false;
        discoveredFiles.clear();
        discoveredDirs.clear();
        crawlQueue = [];

        // Start from current URL
        const startUrl = window.location.href;
        crawlQueue.push({ url: startUrl, depth: 0 });

        updateUI();
        processCrawlQueue();
    }

    // Stop crawling and export results
    function stopCrawl() {
        if (!isRunning) return;
        shouldStop = true;
        console.log('Stop requested, finishing current request...');
    }

    // Initialize - try multiple methods to ensure UI is created
    function init() {
        console.log('Initializing universal crawler userscript...');
        console.log('Document ready state:', document.readyState);
        console.log('Current URL:', window.location.href);

        if (document.body) {
            createUI();
        } else {
            console.log('Body not ready, waiting...');
            setTimeout(init, 100);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();