#!/usr/bin/env node

/**
 * Command-line runner for HTML-based tests using Puppeteer
 * Usage: node tests/run-html-tests.js
 */

// Try to load Puppeteer, fallback gracefully if not available
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.log('📦 Puppeteer not found. Install it with:');
    console.log('   npm install puppeteer');
    console.log('\n🔄 Falling back to extracted tests...');
    
    // Run the extracted tests instead
    try {
        require('./run-extracted-tests.js');
    } catch (fallbackError) {
        console.error('❌ Fallback tests also failed:', fallbackError.message);
        process.exit(1);
    }
    return;
}
const path = require('path');
const fs = require('fs');

async function runHTMLTests() {
    console.log('🚀 Starting HTML test execution via headless browser...');
    
    let browser;
    try {
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from the page
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'log') {
                console.log(`📄 ${text}`);
            } else if (type === 'error') {
                console.error(`❌ ${text}`);
            } else if (type === 'warn') {
                console.warn(`⚠️  ${text}`);
            }
        });
        
        // Handle page errors
        page.on('pageerror', error => {
            console.error('💥 Page Error:', error.message);
        });
        
        // Load the test HTML file
        const testFilePath = path.resolve(__dirname, 'test-integration-upload.html');
        const fileUrl = `file://${testFilePath}`;
        
        console.log(`📂 Loading test file: ${fileUrl}`);
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // Wait for components to load
        await page.waitForTimeout(1000);
        
        // Run component tests (auto-runs on load)
        console.log('\n🧪 Component Tests (auto-run):');
        await page.waitForTimeout(2000);
        
        // Run integration tests
        console.log('\n🔗 Running Integration Tests:');
        await page.click('button[onclick="runIntegrationTests()"]');
        await page.waitForTimeout(3000);
        
        // Run E2E tests
        console.log('\n🎯 Running End-to-End Tests:');
        await page.click('button[onclick="runE2ETests()"]');
        await page.waitForTimeout(3000);
        
        // Run performance tests
        console.log('\n📊 Running Performance Tests:');
        await page.click('button[onclick="runPerformanceTests()"]');
        await page.waitForTimeout(5000);
        
        // Run browser compatibility tests
        console.log('\n🌐 Running Browser Compatibility Tests:');
        await page.click('button[onclick="runBrowserCompatibilityTests()"]');
        await page.waitForTimeout(2000);
        
        // Extract test results
        const results = await page.evaluate(() => {
            const testResults = [];
            const resultElements = document.querySelectorAll('.test-result');
            
            resultElements.forEach(element => {
                const text = element.textContent;
                const isPass = element.classList.contains('test-pass');
                const isFail = element.classList.contains('test-fail');
                const isInfo = element.classList.contains('test-info');
                
                testResults.push({
                    text: text,
                    status: isPass ? 'PASS' : isFail ? 'FAIL' : isInfo ? 'INFO' : 'UNKNOWN'
                });
            });
            
            return testResults;
        });
        
        // Display summary
        console.log('\n📋 Test Results Summary:');
        console.log('=' .repeat(50));
        
        let passed = 0;
        let failed = 0;
        let info = 0;
        
        results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : 
                        result.status === 'INFO' ? 'ℹ️' : '❓';
            
            console.log(`${icon} ${result.text}`);
            
            if (result.status === 'PASS') passed++;
            else if (result.status === 'FAIL') failed++;
            else if (result.status === 'INFO') info++;
        });
        
        console.log('=' .repeat(50));
        console.log(`📊 Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ℹ️ Info: ${info}`);
        
        const successRate = results.length > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0;
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Review the results above.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Test execution failed:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if Puppeteer is available
try {
    require.resolve('puppeteer');
    runHTMLTests();
} catch (error) {
    console.log('📦 Puppeteer not found. Install it with:');
    console.log('   npm install puppeteer');
    console.log('\n🔄 Falling back to simple Node.js tests...');
    
    // Fallback to running available Node.js tests
    const { execSync } = require('child_process');
    try {
        execSync('node tests/ci/run-tests.js', { stdio: 'inherit' });
    } catch (err) {
        console.error('❌ Fallback tests also failed');
        process.exit(1);
    }
}