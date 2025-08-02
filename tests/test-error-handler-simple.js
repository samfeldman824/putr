/**
 * Simple Error Handler Tests
 * Node.js compatible test runner for error handling functionality
 */

// Mock browser environment for Node.js testing
if (typeof window === 'undefined') {
    global.window = {};
    global.File = class File {
        constructor(content, name, options = {}) {
            this.content = content;
            this.name = name;
            this.type = options.type || 'text/plain';
            this.size = Array.isArray(content) ? content.join('').length : content.length;
        }
    };
}

// Load the ErrorHandler module
const fs = require('fs');
const path = require('path');

// Read and evaluate the ErrorHandler source
const errorHandlerSource = fs.readFileSync(path.join(__dirname, '../src/errorHandler.js'), 'utf8');

// Create a modified version for Node.js
const nodeErrorHandlerSource = errorHandlerSource.replace(
    'window.ErrorHandler = ErrorHandler;',
    'if (typeof module !== "undefined" && module.exports) { module.exports = ErrorHandler; } else { window.ErrorHandler = ErrorHandler; }'
);

// Write temporary file and require it
const tempPath = path.join(__dirname, 'temp-error-handler.js');
fs.writeFileSync(tempPath, nodeErrorHandlerSource);

const ErrorHandler = require('./temp-error-handler.js');

// Clean up temp file
fs.unlinkSync(tempPath);

// Test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0
        };
    }

    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async run() {
        console.log('🛡️ Starting Error Handler Tests\n');

        for (const test of this.tests) {
            this.results.total++;
            
            try {
                const result = await test.testFunction();
                
                if (result.success) {
                    this.results.passed++;
                    console.log(`✅ ${test.name}`);
                    if (result.message) {
                        console.log(`   ${result.message}`);
                    }
                } else {
                    this.results.failed++;
                    console.log(`❌ ${test.name}`);
                    console.log(`   ${result.message || 'Test failed'}`);
                    if (result.details) {
                        console.log(`   Details:`, result.details);
                    }
                }
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name} (ERROR)`);
                console.log(`   ${error.message}`);
            }
            
            console.log(''); // Empty line for readability
        }

        this.printSummary();
    }

    printSummary() {
        console.log('📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        
        const successRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;
        console.log(`Success Rate: ${successRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️ ${this.results.failed} test(s) failed`);
        }
    }
}

// Initialize test runner and error handler
const testRunner = new TestRunner();
let errorHandler;

try {
    errorHandler = new ErrorHandler();
    console.log('✅ ErrorHandler initialized successfully\n');
} catch (error) {
    console.error('❌ Failed to initialize ErrorHandler:', error.message);
    process.exit(1);
}

// File Validation Tests
testRunner.test('Valid CSV File', () => {
    const mockFile = new File(['test content'], 'ledger23_10_15.csv', { type: 'text/csv' });
    const result = errorHandler.validateFile(mockFile);
    
    return {
        success: result.isValid === true && result.error === null,
        message: result.isValid ? 'File validation passed' : 'File validation failed',
        details: result
    };
});

testRunner.test('Invalid File Type', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const result = errorHandler.validateFile(mockFile);
    
    return {
        success: result.isValid === false && 
                 result.error.type === errorHandler.errorTypes.FILE_VALIDATION &&
                 result.error.subtype === 'invalid_file_type',
        message: result.isValid ? 'Should have failed validation' : 'Correctly identified invalid file type',
        details: result.error
    };
});

testRunner.test('File Too Large', () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const mockFile = new File([largeContent], 'ledger23_10_15.csv', { type: 'text/csv' });
    const result = errorHandler.validateFile(mockFile);
    
    return {
        success: result.isValid === false && 
                 result.error.type === errorHandler.errorTypes.FILE_VALIDATION &&
                 result.error.subtype === 'file_too_large',
        message: result.isValid ? 'Should have failed for large file' : 'Correctly identified large file',
        details: result.error
    };
});

testRunner.test('Invalid Filename Format', () => {
    const mockFile = new File(['test content'], 'invalid_name.csv', { type: 'text/csv' });
    const result = errorHandler.validateFile(mockFile);
    
    return {
        success: result.isValid === false && 
                 result.error.type === errorHandler.errorTypes.FILE_VALIDATION &&
                 result.error.subtype === 'invalid_filename',
        message: result.isValid ? 'Should have failed for invalid filename' : 'Correctly identified invalid filename',
        details: result.error
    };
});

// CSV Data Validation Tests
testRunner.test('Valid CSV Data', () => {
    const validData = [
        {
            player_nickname: 'Player1',
            player_id: 'p1',
            session_start_at: '2023-10-15 19:00',
            session_end_at: '2023-10-15 23:00',
            buy_in: 100,
            buy_out: 0,
            stack: 150,
            net: 50
        },
        {
            player_nickname: 'Player2',
            player_id: 'p2',
            session_start_at: '2023-10-15 19:00',
            session_end_at: '2023-10-15 23:00',
            buy_in: 100,
            buy_out: 0,
            stack: 75,
            net: -25
        }
    ];

    const requiredColumns = [
        'player_nickname', 'player_id', 'session_start_at', 'session_end_at',
        'buy_in', 'buy_out', 'stack', 'net'
    ];

    const result = errorHandler.validateCSVData(validData, requiredColumns);
    
    return {
        success: result.isValid === true && result.errors.length === 0,
        message: result.isValid ? 'CSV data validation passed' : 'CSV data validation failed',
        details: result.errors
    };
});

testRunner.test('Missing Required Columns', () => {
    const invalidData = [
        {
            player_nickname: 'Player1',
            // missing player_id and other required columns
            buy_in: 100,
            net: 50
        },
        {
            player_nickname: 'Player2',
            // missing player_id and other required columns
            buy_in: 100,
            net: -50
        }
    ];

    const requiredColumns = [
        'player_nickname', 'player_id', 'session_start_at', 'session_end_at',
        'buy_in', 'buy_out', 'stack', 'net'
    ];

    const result = errorHandler.validateCSVData(invalidData, requiredColumns);
    
    return {
        success: result.isValid === false && 
                 result.errors.some(e => e.subtype === 'missing_columns'),
        message: result.isValid ? 'Should have failed for missing columns' : 'Correctly identified missing columns',
        details: result.errors
    };
});

// Error Analysis Tests
testRunner.test('Analyze File Validation Error', () => {
    const error = new Error('Please select a CSV file');
    const analyzed = errorHandler.analyzeError(error);
    
    return {
        success: analyzed.type === errorHandler.errorTypes.FILE_VALIDATION,
        message: analyzed.type === errorHandler.errorTypes.FILE_VALIDATION ? 
            'Correctly categorized as file validation error' : 
            'Failed to categorize file validation error',
        details: analyzed
    };
});

testRunner.test('Analyze Database Error', () => {
    const error = new Error('Firebase connection failed');
    const analyzed = errorHandler.analyzeError(error);
    
    return {
        success: analyzed.type === errorHandler.errorTypes.DATABASE,
        message: analyzed.type === errorHandler.errorTypes.DATABASE ? 
            'Correctly categorized as database error' : 
            'Failed to categorize database error',
        details: analyzed
    };
});

// Error Formatting Tests
testRunner.test('Format Error with Suggestions', () => {
    const error = errorHandler.createError(
        errorHandler.errorTypes.FILE_VALIDATION,
        'invalid_file_type',
        'Test error message'
    );
    
    const formatted = errorHandler.formatErrorMessage(error, true);
    
    return {
        success: formatted.includes('Test error message') && 
                 formatted.includes('Suggestions:') &&
                 formatted.includes('Error ID:'),
        message: 'Error formatting ' + (formatted.includes('Suggestions:') ? 'passed' : 'failed'),
        details: { formatted, original: error }
    };
});

testRunner.test('File Size Formatting', () => {
    const testCases = [
        { bytes: 0, expected: '0 Bytes' },
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1048576, expected: '1 MB' },
        { bytes: 1536, expected: '1.5 KB' }
    ];
    
    const results = testCases.map(test => ({
        input: test.bytes,
        expected: test.expected,
        actual: errorHandler.formatFileSize(test.bytes),
        passed: errorHandler.formatFileSize(test.bytes) === test.expected
    }));
    
    const allPassed = results.every(r => r.passed);
    
    return {
        success: allPassed,
        message: allPassed ? 'All file size formatting tests passed' : 'Some file size formatting tests failed',
        details: results
    };
});

testRunner.test('Error ID Generation', () => {
    const error1 = errorHandler.createError(
        errorHandler.errorTypes.SYSTEM,
        'unknown',
        'Test error 1'
    );
    
    const error2 = errorHandler.createError(
        errorHandler.errorTypes.SYSTEM,
        'unknown',
        'Test error 2'
    );
    
    return {
        success: error1.errorId !== error2.errorId && 
                 error1.errorId.startsWith('ERR_') &&
                 error2.errorId.startsWith('ERR_'),
        message: error1.errorId !== error2.errorId ? 
            'Error IDs are unique' : 
            'Error IDs are not unique',
        details: { error1Id: error1.errorId, error2Id: error2.errorId }
    };
});

// Run all tests
if (require.main === module) {
    testRunner.run().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = testRunner;