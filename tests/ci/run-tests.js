#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CSV Upload Frontend
 * Runs all test suites and provides a unified summary
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Set NODE_ENV to development for testing
process.env.NODE_ENV = 'development';

// Resolve paths relative to project root
const projectRoot = path.join(__dirname, '../..');
const srcPath = path.join(projectRoot, 'src');
const testsPath = path.join(projectRoot, 'tests');

console.log('🚀 CSV Upload Frontend Test Runner');
console.log(`📁 Project Root: ${projectRoot}`);
console.log(`📁 Source Path: ${srcPath}`);
console.log(`📁 Tests Path: ${testsPath}`);

// Global test results tracking
let totalTestResults = {
    suites: [],
    totalPassed: 0,
    totalFailed: 0,
    totalTests: 0
};

/**
 * Runs a test file and captures its results
 */
async function runTestFile(testFilePath, suiteName) {
    return new Promise((resolve, reject) => {
        console.log(`\n🧪 Running ${suiteName}...`);
        console.log('='.repeat(50));
        
        const child = spawn('node', [testFilePath], {
            stdio: 'pipe',
            cwd: projectRoot
        });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });
        
        child.on('close', (code) => {
            // Parse test results from output
            const results = parseTestResults(output, suiteName);
            totalTestResults.suites.push(results);
            totalTestResults.totalPassed += results.passed;
            totalTestResults.totalFailed += results.failed;
            totalTestResults.totalTests += results.total;
            
            if (code === 0) {
                resolve(results);
            } else {
                // Don't reject on test failures, just track them
                resolve(results);
            }
        });
        
        child.on('error', (error) => {
            console.error(`❌ Failed to run ${suiteName}:`, error.message);
            const results = {
                name: suiteName,
                passed: 0,
                failed: 1,
                total: 1,
                error: error.message
            };
            totalTestResults.suites.push(results);
            totalTestResults.totalFailed += 1;
            totalTestResults.totalTests += 1;
            resolve(results);
        });
    });
}

/**
 * Parses test results from output text
 */
function parseTestResults(output, suiteName) {
    const results = {
        name: suiteName,
        passed: 0,
        failed: 0,
        total: 0,
        error: null
    };
    
    // Look for test summary patterns
    const summaryPatterns = [
        /Test Summary: (\d+)\/(\d+) passed/,
        /📊 Test Summary: (\d+)\/(\d+) tests? passed/,
        /📊 Total: (\d+) \| ✅ Passed: (\d+) \| ❌ Failed: (\d+)/,
        /(\d+)\/(\d+) passed/
    ];
    
    for (const pattern of summaryPatterns) {
        const match = output.match(pattern);
        if (match) {
            if (pattern.source.includes('Total:')) {
                // Special handling for "📊 Total: X | ✅ Passed: Y | ❌ Failed: Z" format
                results.total = parseInt(match[1]);
                results.passed = parseInt(match[2]);
                results.failed = parseInt(match[3]);
            } else {
                results.passed = parseInt(match[1]);
                results.total = parseInt(match[2]);
                results.failed = results.total - results.passed;
            }
            return results;
        }
    }
    
    // Fallback: count individual test results
    const passedMatches = output.match(/✅|✓/g);
    const failedMatches = output.match(/❌|✗/g);
    
    if (passedMatches || failedMatches) {
        results.passed = passedMatches ? passedMatches.length : 0;
        results.failed = failedMatches ? failedMatches.length : 0;
        results.total = results.passed + results.failed;
    } else if (output.includes('All tests passed')) {
        // Assume at least one test passed if we see this message
        results.passed = 1;
        results.total = 1;
    } else if (output.includes('failed') || output.includes('error')) {
        results.failed = 1;
        results.total = 1;
    }
    
    return results;
}

/**
 * Runs Database Manager tests using the existing test infrastructure
 */
async function runDatabaseManagerTests() {
    try {
        // Load source files
        const constantsCode = fs.readFileSync(path.join(srcPath, 'constants.js'), 'utf8');
        const dbManagerCode = fs.readFileSync(path.join(srcPath, 'databaseManager.js'), 'utf8');
        const testCode = fs.readFileSync(path.join(testsPath, 'backend', 'test-databaseManager.js'), 'utf8');

        // Create a global context
        global.window = {};
        global.firebase = null;

        // Execute the constants code
        eval(constantsCode);

        // Execute the database manager code
        eval(dbManagerCode.replace('window.DatabaseManager = DatabaseManager;', 'global.DatabaseManager = DatabaseManager;'));

        // Execute the test code (skip the require section and auto-run since we're loading directly)
        const testCodeWithoutRequire = testCode
            .replace(/\/\/ Load constants for Node\.js environment[\s\S]*?}\s*\n/, '// Constants loaded by test runner\n')
            .replace(/\/\/ Auto-run tests in Node\.js environment[\s\S]*?}\s*\n/, '// Auto-run disabled by test runner\n');
        eval(testCodeWithoutRequire);

        console.log('\n🧪 Running Database Manager Tests...');
        console.log('='.repeat(50));
        
        // Capture console output to parse results
        const originalLog = console.log;
        let output = '';
        console.log = (...args) => {
            const text = args.join(' ') + '\n';
            output += text;
            originalLog(...args);
        };

        // Run the tests
        await runAllTests();
        
        // Restore console.log
        console.log = originalLog;
        
        // Parse results
        const results = parseTestResults(output, 'Database Manager');
        totalTestResults.suites.push(results);
        totalTestResults.totalPassed += results.passed;
        totalTestResults.totalFailed += results.failed;
        totalTestResults.totalTests += results.total;
        
        return results;
    } catch (error) {
        console.error('❌ Database Manager tests failed:', error.message);
        const results = {
            name: 'Database Manager',
            passed: 0,
            failed: 1,
            total: 1,
            error: error.message
        };
        totalTestResults.suites.push(results);
        totalTestResults.totalFailed += 1;
        totalTestResults.totalTests += 1;
        return results;
    }
}

/**
 * Prints the final test summary
 */
function printFinalSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    // Print individual suite results
    totalTestResults.suites.forEach(suite => {
        const status = suite.failed === 0 ? '✅' : '❌';
        const percentage = suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0;
        console.log(`${status} ${suite.name}: ${suite.passed}/${suite.total} (${percentage}%)`);
        
        if (suite.error) {
            console.log(`   Error: ${suite.error}`);
        }
    });
    
    console.log('-'.repeat(60));
    
    // Print overall summary
    const overallPercentage = totalTestResults.totalTests > 0 
        ? Math.round((totalTestResults.totalPassed / totalTestResults.totalTests) * 100) 
        : 0;
    
    const overallStatus = totalTestResults.totalFailed === 0 ? '🎉' : '⚠️';
    
    console.log(`${overallStatus} OVERALL: ${totalTestResults.totalPassed}/${totalTestResults.totalTests} tests passed (${overallPercentage}%)`);
    
    if (totalTestResults.totalFailed === 0) {
        console.log('🎉 All tests passed successfully!');
    } else {
        console.log(`❌ ${totalTestResults.totalFailed} test(s) failed`);
    }
    
    console.log('='.repeat(60));
}

/**
 * Attempts to run HTML-based tests using various methods
 */
async function runHTMLBasedTests() {
    try {
        // Method 1: Try Puppeteer
        console.log('🔍 Checking for Puppeteer...');
        require.resolve('puppeteer');
        console.log('✅ Puppeteer found! Running headless browser tests...');
        
        const htmlTestPath = path.join(testsPath, 'frontend', 'run-html-tests.js');
        if (fs.existsSync(htmlTestPath)) {
            await runTestFile(htmlTestPath, 'HTML Integration Tests (Puppeteer)');
        }
        
    } catch (puppeteerError) {
        console.log('⚠️  Puppeteer not available.');
        
        try {
            // Method 2: Try extracted tests
            console.log('🔄 Trying extracted HTML test logic...');
            const extractedTestPath = path.join(testsPath, 'frontend', 'run-extracted-tests.js');
            if (fs.existsSync(extractedTestPath)) {
                await runTestFile(extractedTestPath, 'HTML Tests (Extracted)');
            }
            
        } catch (extractedError) {
            console.log('⚠️  Extracted tests not available.');
            console.log('\n💡 To run HTML tests manually:');
            console.log('   Option 1: Install Puppeteer: npm install puppeteer');
            console.log('   Option 2: Open tests/frontend/test-integration-upload.html in browser');
            console.log('   Option 3: Run: python3 -m http.server 8000');
            console.log('             Then visit: http://localhost:8000/tests/frontend/test-integration-upload.html');
            
            // Add a placeholder result
            const results = {
                name: 'HTML Integration Tests',
                passed: 0,
                failed: 0,
                total: 0,
                error: 'Manual browser testing required'
            };
            totalTestResults.suites.push(results);
        }
    }
}

/**
 * Main test runner function
 */
async function runAllTestSuites() {
    try {
        // Run Database Manager tests (embedded)
        await runDatabaseManagerTests();
        
        // Run Player Stats Calculator tests (separate file)
        const calculatorTestPath = path.join(testsPath, 'backend', 'test-calculator-node.js');
        if (fs.existsSync(calculatorTestPath)) {
            await runTestFile(calculatorTestPath, 'Player Stats Calculator');
        }
        
        // Run Error Handler tests (separate file)
        const errorHandlerTestPath = path.join(testsPath, 'frontend', 'test-error-handler-simple.js');
        if (fs.existsSync(errorHandlerTestPath)) {
            await runTestFile(errorHandlerTestPath, 'Error Handler');
        }
        
        // Skip HTML-based tests in CI environment
        if (process.env.NODE_ENV !== 'test') {
            console.log('\n🌐 Attempting HTML-based tests...');
            await runHTMLBasedTests();
        } else {
            console.log('\n🌐 Skipping HTML-based tests in CI environment...');
        }
        
        // Print final summary
        printFinalSummary();
        
        // Exit with appropriate code
        process.exit(totalTestResults.totalFailed === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
}

// Run all test suites
runAllTestSuites();