const fs = require('fs');
const path = require('path');
const { describe, test, expect } = require('@jest/globals');

describe('HTML Structure Tests', () => {
  let htmlContent;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  test('should have valid HTML5 doctype', () => {
    expect(htmlContent).toMatch(/^<!DOCTYPE html>/i);
  });

  test('should have proper HTML structure', () => {
    expect(htmlContent).toContain('<html lang="en">');
    expect(htmlContent).toContain('<head>');
    expect(htmlContent).toContain('<body>');
    expect(htmlContent).toContain('</html>');
  });

  test('should have required meta tags', () => {
    expect(htmlContent).toContain('<meta charset="UTF-8">');
    expect(htmlContent).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  });

  test('should have proper title', () => {
    expect(htmlContent).toContain('<title>Backlog.md Demo - Task Management</title>');
  });

  test('should contain CSS3 features', () => {
    // Check for CSS3 features
    expect(htmlContent).toContain('linear-gradient');
    expect(htmlContent).toContain('border-radius');
    expect(htmlContent).toContain('box-shadow');
    expect(htmlContent).toContain('transform');
    expect(htmlContent).toContain('transition');
    expect(htmlContent).toContain('@media');
  });

  test('should have responsive design elements', () => {
    // Check for responsive design
    expect(htmlContent).toContain('clamp(');
    expect(htmlContent).toContain('@media (max-width:');
    expect(htmlContent).toContain('grid-template-columns');
    expect(htmlContent).toContain('auto-fit');
    expect(htmlContent).toContain('minmax(');
  });

  test('should contain backlog.md content examples', () => {
    expect(htmlContent).toContain('backlog task create');
    expect(htmlContent).toContain('backlog task edit');
    expect(htmlContent).toContain('backlog task list');
    expect(htmlContent).toContain('Backlog.md CLI Tool');
  });

  test('should have semantic HTML5 elements', () => {
    expect(htmlContent).toContain('<header>');
    expect(htmlContent).toContain('<main>');
    expect(htmlContent).toContain('<section>');
    expect(htmlContent).toContain('<footer>');
  });

  test('should have task cards section', () => {
    expect(htmlContent).toContain('Current Project Tasks');
    expect(htmlContent).toContain('Task 1: Create Static HTML5');
    expect(htmlContent).toContain('Task 2: Add CSS3 Layout');
    expect(htmlContent).toContain('Task 3: Add Unit Tests');
  });

  test('should have CSS custom properties (variables)', () => {
    expect(htmlContent).toContain(':root {');
    expect(htmlContent).toContain('--primary-color');
    expect(htmlContent).toContain('--secondary-color');
    expect(htmlContent).toContain('var(--');
  });

  test('should include accessibility features', () => {
    expect(htmlContent).toContain('lang="en"');
    expect(htmlContent).toContain('alt='); // Should have alt attributes for images if any
  });

  test('should have modern CSS features', () => {
    // Check for modern CSS features
    expect(htmlContent).toContain('backdrop-filter');
    expect(htmlContent).toContain('@keyframes');
    expect(htmlContent).toContain('grid');
    expect(htmlContent).toContain('flex');
  });
});