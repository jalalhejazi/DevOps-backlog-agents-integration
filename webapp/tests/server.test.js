const { spawn } = require('child_process');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');

describe('Backlog.md Demo Server Tests', () => {
  let server;
  let browser;
  let page;
  const PORT = 1234;
  const BASE_URL = `http://localhost:${PORT}`;

  beforeAll(async () => {
    // Start the HTTP server
    return new Promise((resolve, reject) => {
      server = spawn('npx', ['http-server', '-p', PORT.toString(), '-c-1'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      // Wait for server to start
      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within 5 seconds'));
      }, 5000);

      server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Server output:', output);
        if (output.includes('Available on:') || output.includes('Hit CTRL-C')) {
          clearTimeout(timeout);
          // Give server a moment to fully initialize
          setTimeout(resolve, 1000);
        }
      });

      server.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      server.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill('SIGTERM');
      // Give server time to shut down
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('should verify server starts successfully on port 1234', async () => {
    return new Promise((resolve, reject) => {
      const req = http.get(BASE_URL, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
        resolve();
      });

      req.on('error', (error) => {
        reject(new Error(`Failed to connect to server: ${error.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });
  });

  test('should serve index.html with correct content', async () => {
    return new Promise((resolve, reject) => {
      const req = http.get(BASE_URL, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            expect(data).toContain('<!DOCTYPE html>');
            expect(data).toContain('<title>Backlog.md Demo - Task Management</title>');
            expect(data).toContain('Backlog.md CLI Tool');
            expect(data).toContain('Simple and powerful task management');
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });
  });

  test('should render page correctly in browser', async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport for testing responsive design
    await page.setViewport({ width: 1200, height: 800 });
    
    const response = await page.goto(BASE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    expect(response.status()).toBe(200);
    
    // Check page title
    const title = await page.title();
    expect(title).toBe('Backlog.md Demo - Task Management');
    
    // Check main heading
    const mainHeading = await page.$eval('h1', el => el.textContent);
    expect(mainHeading).toBe('Backlog.md CLI Tool');
    
    // Check that key sections exist
    const sections = await page.$$eval('.demo-section', 
      sections => sections.map(section => section.querySelector('h2').textContent)
    );
    
    expect(sections).toContain('What is Backlog.md?');
    expect(sections).toContain('Getting Started');
    expect(sections).toContain('Current Project Tasks');
  });

  test('should display task cards correctly', async () => {
    if (!page) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    }
    
    // Check task cards
    const taskCards = await page.$$eval('.task-card', 
      cards => cards.map(card => ({
        title: card.querySelector('h4').textContent,
        status: card.querySelector('.task-status').textContent
      }))
    );
    
    expect(taskCards).toHaveLength(3);
    expect(taskCards[0].title).toContain('Task 1: Create Static HTML5');
    expect(taskCards[0].status).toBe('Done');
    expect(taskCards[1].title).toContain('Task 2: Add CSS3 Layout');
    expect(taskCards[2].title).toContain('Task 3: Add Unit Tests');
  });

  test('should be responsive on mobile devices', async () => {
    if (!page) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    }
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 }); // iPhone dimensions
    
    // Check that header is still visible and properly styled
    const headerHeight = await page.$eval('header', el => el.offsetHeight);
    expect(headerHeight).toBeGreaterThan(0);
    
    // Check that task grid adapts to mobile
    const taskGrid = await page.$eval('.task-grid', el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.gridTemplateColumns;
    });
    
    // On mobile, should be single column
    expect(taskGrid).toBe('1fr');
    
    // Check that text is readable (not too small)
    const mainHeadingSize = await page.$eval('h1', el => {
      const computedStyle = window.getComputedStyle(el);
      return parseFloat(computedStyle.fontSize);
    });
    
    expect(mainHeadingSize).toBeGreaterThan(24); // Should be at least 24px on mobile
  });

  test('should load CSS styles correctly', async () => {
    if (!page) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    }
    
    // Check that CSS variables are applied
    const bodyBackground = await page.$eval('body', el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.background;
    });
    
    expect(bodyBackground).toContain('linear-gradient');
    
    // Check that demo sections have proper styling
    const sectionBorderRadius = await page.$eval('.demo-section', el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.borderRadius;
    });
    
    expect(sectionBorderRadius).toBe('15px');
  });

  test('should handle animations and transitions', async () => {
    if (!page) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    }
    
    // Check that elements have transition properties
    const sectionTransition = await page.$eval('.demo-section', el => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.transition;
    });
    
    expect(sectionTransition).toContain('all');
    expect(sectionTransition).toContain('0.3s');
    expect(sectionTransition).toContain('ease');
  });

  test('should verify accessibility features', async () => {
    if (!page) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    }
    
    // Check lang attribute
    const langAttribute = await page.$eval('html', el => el.getAttribute('lang'));
    expect(langAttribute).toBe('en');
    
    // Check viewport meta tag
    const viewportContent = await page.$eval('meta[name="viewport"]', el => el.getAttribute('content'));
    expect(viewportContent).toContain('width=device-width');
    expect(viewportContent).toContain('initial-scale=1.0');
    
    // Check that heading hierarchy is proper
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
      headings => headings.map(h => h.tagName.toLowerCase())
    );
    
    expect(headings[0]).toBe('h1'); // First heading should be h1
    expect(headings.filter(h => h === 'h1')).toHaveLength(1); // Only one h1
  });
});