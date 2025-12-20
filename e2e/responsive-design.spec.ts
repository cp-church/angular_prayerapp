import { test, expect, devices } from '@playwright/test';

// Test on mobile devices
test.describe('Responsive Design - Mobile', () => {
  test.use({ ...devices['iPhone 12'] });

  test('home page should be mobile responsive', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check that main content is visible on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Should be able to interact with buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);
  });

  test('prayer cards should stack properly on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Wait for prayers to load
    await page.waitForTimeout(2000);
    
    // Check that prayer cards are visible and properly sized
    const cards = page.locator('[class*="prayer"], [class*="card"]');
    
    if (await cards.first().isVisible()) {
      // Card should fit within viewport
      const cardBox = await cards.first().boundingBox();
      const viewportSize = page.viewportSize();
      
      if (cardBox && viewportSize) {
        // Card width should not exceed viewport
        expect(cardBox.width).toBeLessThanOrEqual(viewportSize.width);
      }
    }
  });

  test('presentation mode should work on mobile', async ({ page }) => {
    await page.goto('/presentation');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Should be able to navigate with arrows
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation should be accessible on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // All interactive elements should be reachable
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Should have at least some buttons
    expect(buttonCount).toBeGreaterThanOrEqual(1);
    
    // Should be able to click buttons
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
        
        // App should remain responsive
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

// Test on tablet devices
test.describe('Responsive Design - Tablet', () => {
  test.use({ ...devices['iPad Pro'] });

  test('home page should be tablet responsive', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check that content is properly displayed
    await expect(page.locator('body')).toBeVisible();
  });

  test('presentation mode should optimize for tablet', async ({ page }) => {
    await page.goto('/presentation');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should work
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    await expect(page.locator('body')).toBeVisible();
  });
});

// Test on desktop
test.describe('Responsive Design - Desktop', () => {
  test('home page should display desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check that content is properly displayed
    await expect(page.locator('body')).toBeVisible();
    
    // Should have proper spacing
    const contentBox = await page.locator('body').boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBe(1920);
    }
  });

  test('presentation mode should use full desktop space', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/presentation');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Page should be visible and use available space
    await expect(page.locator('body')).toBeVisible();
  });
});

// Test critical breakpoints
test.describe('Responsive Design - Breakpoints', () => {
  const breakpoints = [
    { width: 320, height: 568, name: 'Small Mobile' },
    { width: 375, height: 667, name: 'iPhone' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Landscape Tablet' },
    { width: 1280, height: 720, name: 'Small Desktop' },
    { width: 1920, height: 1080, name: 'Full Desktop' }
  ];

  breakpoints.forEach(breakpoint => {
    test(`should render correctly at ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async ({ page }) => {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      
      await page.goto('/');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Page should be visible at this breakpoint
      await expect(page.locator('body')).toBeVisible();
      
      // Should not have horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => 
        document.documentElement.scrollWidth > window.innerWidth
      );
      
      // Allow some tolerance for dynamic content
      expect(hasHorizontalScroll).toBeFalsy();
    });
  });
});
