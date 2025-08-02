#!/usr/bin/env node

/**
 * CI-optimized test runner for CSV Upload Frontend
 * Generates structured output for CI/CD pipelines
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for CI output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(`🧪 ${title}`, 'bold');
    console.log('='.repeat(60));
}

async function runTestSuite(testFile, suiteName) {
    logSection(`Running ${suiteName}`);
    
    try {
        const startTime = Date.now();
        const output = execSync(`node ${testFile}`, { 
            encoding: 'utf8',
            cwd: path.dirname(__filename)
        });
        const duration = Date.now() - startTime;
        
        // Parse results from output
        const successMatch = output.match(/📊 Total: (\d+) \| ✅ Passed: (\d+) \| ❌ Failed: (\d+)/);
        const successRateMatch = output.match(/🎯 Success Rate: ([\d.]+)%/);
        
        if (successMatch) {
            const [, total, passed, failed] = successMatch;
            const successRate = successRateMatch ? successRateMatch[1] : '0';
            
            if (parseInt(failed) === 0) {
                log(`✅ ${suiteName}: ${passed}/${total} tests passed (${successRate}%) in ${duration}ms`, 'green');
                return { success: true, passed: parseInt(passed), total: parseInt(total), failed: parseInt(failed) };
            } else {
                log(`❌ ${suiteName}: ${passed}/${total} tests passed (${successRate}%) - ${failed} failed`, 'red');
                return { success: false, passed: parseInt(passed), total: parseInt(total), failed: parseInt(failed) };
            }
        } else {
            // Fallback parsing
            if (output.includes('All tests passed') || output.includes('🎉')) {
                log(`✅ ${suiteName}: All tests passed in ${duration}ms`, 'green');
                return { success: true, passed: 1, total: 1, failed: 0 };
            } else {
                log(`❌ ${suiteName}: Tests failed`, 'red');
                return { success: false, passed: 0, total: 1, failed: 1 };
            }
        }
        
    } catch (error) {
        log(`💥 ${suiteName}: Test execution failed`, 'red');
        console.error(error.message);
        return { success: false, passed: 0, total: 1, failed: 1 };
    }
}

async function main() {
    log('🚀 Starting CSV Upload Frontend CI Tests', 'blue');
    log(`📅 Started at: ${new Date().toISOString()}`, 'blue');
    log(`🖥️  Node.js version: ${process.version}`, 'blue');
    log(`📁 Working directory: ${process.cwd()}`, 'blue');
    
    const testSuites = [
        { file: 'run-tests.js', name: 'Complete Test Suite' },
        { file: 'run-extracted-tests.js', name: 'Browser Compatibility Tests' }
    ];
    
    const results = [];
    let totalPassed = 0;
    let totalTests = 0;
    let totalFailed = 0;
    
    // Run each test suite
    for (const suite of testSuites) {
        const testPath = path.join(__dirname, suite.file);
        if (fs.existsSync(testPath)) {
            const result = await runTestSuite(testPath, suite.name);
            results.push({ ...result, name: suite.name });
            totalPassed += result.passed;
            totalTests += result.total;
            totalFailed += result.failed;
        } else {
            log(`⚠️  Test file not found: ${suite.file}`, 'yellow');
        }
    }
    
    // Generate final report
    logSection('Final CI Test Report');
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const percentage = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
        log(`${status} ${result.name}: ${result.passed}/${result.total} (${percentage}%)`);
    });
    
    console.log('-'.repeat(60));
    
    const overallSuccess = totalFailed === 0;
    const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    if (overallSuccess) {
        log(`🎉 OVERALL SUCCESS: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`, 'green');
        log('✨ All CSV upload frontend tests are passing!', 'green');
    } else {
        log(`⚠️  OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%) - ${totalFailed} failed`, 'red');
        log('🔧 Some tests need attention before deployment', 'yellow');
    }
    
    // Generate CI artifacts
    const report = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        overallSuccess,
        totalTests,
        totalPassed,
        totalFailed,
        successRate: overallPercentage,
        suites: results
    };
    
    // Write JSON report for CI systems
    fs.writeFileSync(
        path.join(__dirname, 'ci-test-report.json'),
        JSON.stringify(report, null, 2)
    );
    

    
    log(`📊 Test report saved to: ci-test-report.json`, 'blue');
    
    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    log('💥 Uncaught exception in CI test runner:', 'red');
    console.error(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log('💥 Unhandled rejection in CI test runner:', 'red');
    console.error('At:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
main();