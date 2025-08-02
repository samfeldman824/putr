/**
 * Error Handler Module
 * Provides comprehensive error handling, validation, and user-friendly messaging
 * for the CSV upload system
 */

class ErrorHandler {
    constructor() {
        this.errorTypes = {
            FILE_VALIDATION: 'file_validation',
            CSV_PARSING: 'csv_parsing',
            DATA_VALIDATION: 'data_validation',
            PLAYER_MATCHING: 'player_matching',
            DATABASE: 'database',
            DUPLICATE: 'duplicate',
            SYSTEM: 'system',
            NETWORK: 'network',
            PERMISSION: 'permission'
        };

        this.severityLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };

        // Error message templates with recovery suggestions
        this.errorTemplates = this.initializeErrorTemplates();
        
        console.log('🛡️ ErrorHandler initialized');
    }

    /**
     * Initialize error message templates with recovery suggestions
     * @returns {Object} Error templates organized by type
     */
    initializeErrorTemplates() {
        return {
            [this.errorTypes.FILE_VALIDATION]: {
                invalid_file_type: {
                    message: 'Invalid file type selected',
                    details: 'Only CSV files are supported for upload',
                    suggestions: [
                        'Select a file with .csv extension',
                        'Convert your data to CSV format using Excel or Google Sheets',
                        'Ensure the file is not corrupted'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                },
                file_too_large: {
                    message: 'File size exceeds maximum limit',
                    details: 'The selected file is larger than 10MB',
                    suggestions: [
                        'Split large files into smaller chunks',
                        'Remove unnecessary columns or rows',
                        'Compress the file if possible'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                },
                file_empty: {
                    message: 'File appears to be empty',
                    details: 'The CSV file contains no data or only whitespace',
                    suggestions: [
                        'Verify the file contains game data',
                        'Check if the file was saved correctly',
                        'Try exporting the data again from the source'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                invalid_filename: {
                    message: 'Invalid filename format',
                    details: 'Filename must follow the pattern ledgerYY_MM_DD.csv',
                    suggestions: [
                        'Rename file to match pattern: ledger23_10_15.csv',
                        'Use two-digit year, month, and day',
                        'Optional parentheses for multiple games: ledger23_10_15(1).csv'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                }
            },

            [this.errorTypes.CSV_PARSING]: {
                parse_error: {
                    message: 'Failed to parse CSV file',
                    details: 'The CSV file structure is invalid or corrupted',
                    suggestions: [
                        'Open file in Excel/Google Sheets and re-save as CSV',
                        'Check for special characters or encoding issues',
                        'Ensure proper comma separation and quote handling'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                insufficient_data: {
                    message: 'Insufficient game data',
                    details: 'CSV must contain at least 2 players for a valid game',
                    suggestions: [
                        'Ensure the CSV has at least 2 data rows plus header',
                        'Verify all player data is included',
                        'Check for empty rows that should contain data'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                row_mismatch: {
                    message: 'Row column count mismatch',
                    details: 'Some rows have different number of columns than the header',
                    suggestions: [
                        'Check for missing commas in CSV rows',
                        'Verify all rows have the same number of columns',
                        'Look for unescaped commas in text fields'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                }
            },

            [this.errorTypes.DATA_VALIDATION]: {
                missing_columns: {
                    message: 'Required columns are missing',
                    details: 'CSV must contain all required columns for processing',
                    suggestions: [
                        'Ensure CSV has: player_nickname, player_id, session_start_at, session_end_at, buy_in, buy_out, stack, net',
                        'Check column header spelling and capitalization',
                        'Verify no columns were accidentally deleted'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: true
                },
                invalid_numeric_data: {
                    message: 'Invalid numeric data found',
                    details: 'Numeric columns contain non-numeric values',
                    suggestions: [
                        'Check buy_in, buy_out, stack, and net columns for text values',
                        'Remove currency symbols and formatting',
                        'Ensure negative numbers use minus sign (-)'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                missing_required_data: {
                    message: 'Required data is missing',
                    details: 'Essential fields are empty or missing',
                    suggestions: [
                        'Fill in all required fields: player_nickname, player_id, buy_in, stack, net',
                        'Check for empty cells in required columns',
                        'Verify data export included all necessary information'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                invalid_date_format: {
                    message: 'Invalid date in filename',
                    details: 'Date components in filename are not valid',
                    suggestions: [
                        'Use valid month (01-12) and day (01-31)',
                        'Check filename format: ledgerYY_MM_DD.csv',
                        'Verify the date represents an actual calendar date'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                }
            },

            [this.errorTypes.PLAYER_MATCHING]: {
                unmatched_players: {
                    message: 'Some players could not be matched',
                    details: 'Player nicknames in CSV do not match database records',
                    suggestions: [
                        'Check spelling and capitalization of player nicknames',
                        'Verify players exist in the database',
                        'Add missing nicknames to player_nicknames arrays',
                        'Contact administrator to add new players'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: true
                },
                no_players_matched: {
                    message: 'No players could be matched',
                    details: 'None of the player nicknames match database records',
                    suggestions: [
                        'Verify you are using the correct database',
                        'Check if player nicknames have changed',
                        'Ensure the CSV is from the correct poker group',
                        'Contact administrator for player database verification'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: false
                }
            },

            [this.errorTypes.DATABASE]: {
                connection_failed: {
                    message: 'Database connection failed',
                    details: 'Unable to connect to Firebase database',
                    suggestions: [
                        'Check your internet connection',
                        'Verify Firebase configuration is correct',
                        'Try refreshing the page',
                        'Contact administrator if problem persists'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: true
                },
                permission_denied: {
                    message: 'Database access denied',
                    details: 'You do not have permission to update player data',
                    suggestions: [
                        'Verify you are logged in with correct account',
                        'Contact administrator for database permissions',
                        'Check if your session has expired'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: false
                },
                transaction_failed: {
                    message: 'Database update failed',
                    details: 'Failed to update player statistics in database',
                    suggestions: [
                        'Try uploading again',
                        'Check internet connection stability',
                        'Verify database is not under maintenance',
                        'Contact administrator if problem persists'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                },
                data_not_found: {
                    message: 'Player data not found',
                    details: 'Expected player records are missing from database',
                    suggestions: [
                        'Verify player exists in the database',
                        'Check if player was recently deleted',
                        'Contact administrator to restore missing players'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: false
                }
            },

            [this.errorTypes.DUPLICATE]: {
                duplicate_game: {
                    message: 'Duplicate game detected',
                    details: 'This game appears to have been uploaded already',
                    suggestions: [
                        'Check if the game was uploaded in a previous session',
                        'Verify the game date and players',
                        'Refresh the page to clear duplicate detection if needed',
                        'Use undo feature if you need to re-upload'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                },
                duplicate_file: {
                    message: 'File already processed',
                    details: 'This exact file has been uploaded in this session',
                    suggestions: [
                        'Check if upload was already successful',
                        'Refresh page to reset session if needed',
                        'Verify you are uploading the correct file'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                }
            },

            [this.errorTypes.NETWORK]: {
                timeout: {
                    message: 'Request timed out',
                    details: 'The operation took too long to complete',
                    suggestions: [
                        'Check your internet connection',
                        'Try uploading again',
                        'Use a smaller file if possible',
                        'Try again during off-peak hours'
                    ],
                    severity: this.severityLevels.MEDIUM,
                    recoverable: true
                },
                offline: {
                    message: 'No internet connection',
                    details: 'Unable to connect to the internet',
                    suggestions: [
                        'Check your internet connection',
                        'Try again when connection is restored',
                        'Verify network settings'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                }
            },

            [this.errorTypes.SYSTEM]: {
                initialization_failed: {
                    message: 'System initialization failed',
                    details: 'Required components could not be loaded',
                    suggestions: [
                        'Refresh the page',
                        'Clear browser cache',
                        'Try using a different browser',
                        'Contact administrator if problem persists'
                    ],
                    severity: this.severityLevels.CRITICAL,
                    recoverable: true
                },
                memory_error: {
                    message: 'Insufficient memory',
                    details: 'Not enough memory to process the file',
                    suggestions: [
                        'Close other browser tabs',
                        'Use a smaller file',
                        'Restart your browser',
                        'Try on a device with more memory'
                    ],
                    severity: this.severityLevels.HIGH,
                    recoverable: true
                }
            }
        };
    }

    /**
     * Create a standardized error object with enhanced information
     * @param {string} type - Error type from this.errorTypes
     * @param {string} subtype - Specific error subtype
     * @param {string} customMessage - Custom error message (optional)
     * @param {Object} context - Additional context information
     * @returns {Object} Standardized error object
     */
    createError(type, subtype, customMessage = null, context = {}) {
        const template = this.errorTemplates[type]?.[subtype];
        
        if (!template) {
            return this.createGenericError(customMessage || 'Unknown error occurred', context);
        }

        return {
            type,
            subtype,
            message: customMessage || template.message,
            details: template.details,
            suggestions: template.suggestions,
            severity: template.severity,
            recoverable: template.recoverable,
            context,
            timestamp: new Date().toISOString(),
            errorId: this.generateErrorId()
        };
    }

    /**
     * Create a generic error object for unknown errors
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} Generic error object
     */
    createGenericError(message, context = {}) {
        return {
            type: this.errorTypes.SYSTEM,
            subtype: 'unknown',
            message,
            details: 'An unexpected error occurred',
            suggestions: [
                'Try the operation again',
                'Refresh the page if problem persists',
                'Contact administrator with error details'
            ],
            severity: this.severityLevels.MEDIUM,
            recoverable: true,
            context,
            timestamp: new Date().toISOString(),
            errorId: this.generateErrorId()
        };
    }

    /**
     * Generate a unique error ID for tracking
     * @returns {string} Unique error identifier
     */
    generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate file before processing
     * @param {File} file - File to validate
     * @returns {Object} Validation result with error details if invalid
     */
    validateFile(file) {
        const result = { isValid: true, error: null };

        // Check if file exists
        if (!file) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.FILE_VALIDATION,
                'invalid_file_type',
                'No file selected'
            );
            return result;
        }

        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.FILE_VALIDATION,
                'invalid_file_type',
                null,
                { fileName: file.name, fileType: file.type }
            );
            return result;
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.FILE_VALIDATION,
                'file_too_large',
                `File size (${this.formatFileSize(file.size)}) exceeds maximum limit (${this.formatFileSize(maxSize)})`,
                { fileSize: file.size, maxSize, fileName: file.name }
            );
            return result;
        }

        // Check filename format
        const filenameValidation = this.validateFilename(file.name);
        if (!filenameValidation.isValid) {
            result.isValid = false;
            result.error = filenameValidation.error;
            return result;
        }

        return result;
    }

    /**
     * Validate filename format and extract date
     * @param {string} filename - Filename to validate
     * @returns {Object} Validation result with extracted date if valid
     */
    validateFilename(filename) {
        const result = { isValid: true, error: null, gameDate: null };

        if (!filename || typeof filename !== 'string') {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.FILE_VALIDATION,
                'invalid_filename',
                'Filename is required'
            );
            return result;
        }

        // Clean filename
        const cleanedFilename = filename.trim().replace(/\s+/g, '');
        
        // Pattern: ledgerYY_MM_DD.csv or ledgerYY_MM_DD(#).csv
        const datePattern = /^ledger(\d{2})_(\d{2})_(\d{2})(?:\(\d+\))?\.csv$/i;
        const match = cleanedFilename.match(datePattern);

        if (!match) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.FILE_VALIDATION,
                'invalid_filename',
                null,
                { fileName: filename, expectedPattern: 'ledgerYY_MM_DD.csv' }
            );
            return result;
        }

        const [, year, month, day] = match;

        // Validate date components
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);

        if (monthNum < 1 || monthNum > 12) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.DATA_VALIDATION,
                'invalid_date_format',
                `Invalid month: ${month}. Month must be between 01 and 12`,
                { fileName: filename, month, day, year }
            );
            return result;
        }

        if (dayNum < 1 || dayNum > 31) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.DATA_VALIDATION,
                'invalid_date_format',
                `Invalid day: ${day}. Day must be between 01 and 31`,
                { fileName: filename, month, day, year }
            );
            return result;
        }

        // Create full date and validate it's a real date
        const fullYear = `20${year}`;
        const dateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const dateObj = new Date(dateString + 'T00:00:00'); // Use ISO format to avoid timezone issues
        
        if (dateObj.getFullYear() !== parseInt(fullYear) || 
            dateObj.getMonth() !== monthNum - 1 || 
            dateObj.getDate() !== dayNum) {
            result.isValid = false;
            result.error = this.createError(
                this.errorTypes.DATA_VALIDATION,
                'invalid_date_format',
                `Invalid date: ${dateString} is not a valid calendar date`,
                { fileName: filename, extractedDate: dateString }
            );
            return result;
        }

        result.gameDate = dateString;
        return result;
    }

    /**
     * Validate CSV structure and data
     * @param {Array<Object>} csvData - Parsed CSV data
     * @param {Array<string>} requiredColumns - Required column names
     * @returns {Object} Validation result
     */
    validateCSVData(csvData, requiredColumns) {
        const result = { isValid: true, errors: [] };

        // Check if data exists
        if (!csvData || !Array.isArray(csvData)) {
            result.isValid = false;
            result.errors.push(this.createError(
                this.errorTypes.CSV_PARSING,
                'parse_error',
                'CSV data is not in expected format'
            ));
            return result;
        }

        // Check minimum data requirement
        if (csvData.length < 2) {
            result.isValid = false;
            result.errors.push(this.createError(
                this.errorTypes.CSV_PARSING,
                'insufficient_data',
                `CSV contains ${csvData.length} players, but at least 2 are required`
            ));
            return result;
        }

        // Check required columns
        if (csvData.length > 0) {
            const actualColumns = Object.keys(csvData[0]);
            const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));

            if (missingColumns.length > 0) {
                result.isValid = false;
                result.errors.push(this.createError(
                    this.errorTypes.DATA_VALIDATION,
                    'missing_columns',
                    `Missing required columns: ${missingColumns.join(', ')}`,
                    { missingColumns, actualColumns, requiredColumns }
                ));
            }
        }

        // Validate each row
        csvData.forEach((row, index) => {
            const rowValidation = this.validateCSVRow(row, index + 2, requiredColumns); // +2 for header and 0-based index
            if (!rowValidation.isValid) {
                result.isValid = false;
                result.errors.push(...rowValidation.errors);
            }
        });

        return result;
    }

    /**
     * Validate individual CSV row
     * @param {Object} row - CSV row data
     * @param {number} rowNumber - Row number for error reporting
     * @param {Array<string>} requiredColumns - Required column names
     * @returns {Object} Validation result
     */
    validateCSVRow(row, rowNumber, requiredColumns) {
        const result = { isValid: true, errors: [] };

        // Check required string fields
        const requiredStringFields = ['player_nickname', 'player_id'];
        requiredStringFields.forEach(field => {
            if (!row[field] || typeof row[field] !== 'string' || row[field].trim().length === 0) {
                result.isValid = false;
                result.errors.push(this.createError(
                    this.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${field} is required and cannot be empty in row ${rowNumber}`,
                    { rowNumber, field, value: row[field] }
                ));
            }
        });

        // Check required numeric fields
        const requiredNumericFields = ['buy_in', 'stack', 'net'];
        requiredNumericFields.forEach(field => {
            if (row[field] === null || row[field] === undefined || row[field] === '') {
                result.isValid = false;
                result.errors.push(this.createError(
                    this.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${field} is required and cannot be empty in row ${rowNumber}`,
                    { rowNumber, field, value: row[field] }
                ));
            } else {
                const numValue = parseFloat(String(row[field]).replace(/[^\d.-]/g, ''));
                if (isNaN(numValue)) {
                    result.isValid = false;
                    result.errors.push(this.createError(
                        this.errorTypes.DATA_VALIDATION,
                        'invalid_numeric_data',
                        `${field} must be a valid number in row ${rowNumber}. Found: "${row[field]}"`,
                        { rowNumber, field, value: row[field] }
                    ));
                }
            }
        });

        return result;
    }

    /**
     * Analyze and categorize an error from any source
     * @param {Error|string} error - Error to analyze
     * @param {Object} context - Additional context
     * @returns {Object} Categorized error object
     */
    analyzeError(error, context = {}) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : null;

        // Try to categorize based on error message patterns
        if (this.isFileValidationError(errorMessage)) {
            return this.categorizeFileError(errorMessage, context);
        }

        if (this.isCSVParsingError(errorMessage)) {
            return this.categorizeCSVError(errorMessage, context);
        }

        if (this.isDataValidationError(errorMessage)) {
            return this.categorizeDataError(errorMessage, context);
        }

        if (this.isPlayerMatchingError(errorMessage)) {
            return this.categorizePlayerError(errorMessage, context);
        }

        if (this.isDatabaseError(errorMessage)) {
            return this.categorizeDatabaseError(errorMessage, context);
        }

        if (this.isNetworkError(errorMessage)) {
            return this.categorizeNetworkError(errorMessage, context);
        }

        // Default to generic error
        return this.createGenericError(errorMessage, { ...context, stack: errorStack });
    }

    /**
     * Check if error is related to file validation
     * @param {string} message - Error message
     * @returns {boolean} True if file validation error
     */
    isFileValidationError(message) {
        const patterns = [
            /file.*type/i,
            /csv.*file/i,
            /invalid.*file/i,
            /file.*size/i,
            /filename/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is related to CSV parsing
     * @param {string} message - Error message
     * @returns {boolean} True if CSV parsing error
     */
    isCSVParsingError(message) {
        const patterns = [
            /csv.*parsing/i,
            /parse.*csv/i,
            /row.*column/i,
            /insufficient.*data/i,
            /empty.*file/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is related to data validation
     * @param {string} message - Error message
     * @returns {boolean} True if data validation error
     */
    isDataValidationError(message) {
        const patterns = [
            /missing.*column/i,
            /required.*column/i,
            /invalid.*data/i,
            /numeric.*data/i,
            /validation.*error/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is related to player matching
     * @param {string} message - Error message
     * @returns {boolean} True if player matching error
     */
    isPlayerMatchingError(message) {
        const patterns = [
            /match.*player/i,
            /unmatched.*player/i,
            /player.*not.*found/i,
            /nickname/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is related to database operations
     * @param {string} message - Error message
     * @returns {boolean} True if database error
     */
    isDatabaseError(message) {
        const patterns = [
            /firebase/i,
            /firestore/i,
            /database/i,
            /transaction/i,
            /permission.*denied/i,
            /connection.*failed/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is related to network issues
     * @param {string} message - Error message
     * @returns {boolean} True if network error
     */
    isNetworkError(message) {
        const patterns = [
            /network/i,
            /timeout/i,
            /offline/i,
            /connection/i,
            /internet/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Categorize file validation errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizeFileError(message, context) {
        if (/file.*type|csv.*file/i.test(message)) {
            return this.createError(this.errorTypes.FILE_VALIDATION, 'invalid_file_type', message, context);
        }
        if (/file.*size/i.test(message)) {
            return this.createError(this.errorTypes.FILE_VALIDATION, 'file_too_large', message, context);
        }
        if (/filename/i.test(message)) {
            return this.createError(this.errorTypes.FILE_VALIDATION, 'invalid_filename', message, context);
        }
        if (/empty/i.test(message)) {
            return this.createError(this.errorTypes.FILE_VALIDATION, 'file_empty', message, context);
        }
        return this.createError(this.errorTypes.FILE_VALIDATION, 'invalid_file_type', message, context);
    }

    /**
     * Categorize CSV parsing errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizeCSVError(message, context) {
        if (/insufficient.*data/i.test(message)) {
            return this.createError(this.errorTypes.CSV_PARSING, 'insufficient_data', message, context);
        }
        if (/row.*column/i.test(message)) {
            return this.createError(this.errorTypes.CSV_PARSING, 'row_mismatch', message, context);
        }
        return this.createError(this.errorTypes.CSV_PARSING, 'parse_error', message, context);
    }

    /**
     * Categorize data validation errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizeDataError(message, context) {
        if (/missing.*column|required.*column/i.test(message)) {
            return this.createError(this.errorTypes.DATA_VALIDATION, 'missing_columns', message, context);
        }
        if (/numeric.*data|invalid.*number/i.test(message)) {
            return this.createError(this.errorTypes.DATA_VALIDATION, 'invalid_numeric_data', message, context);
        }
        if (/required.*data|cannot.*be.*empty/i.test(message)) {
            return this.createError(this.errorTypes.DATA_VALIDATION, 'missing_required_data', message, context);
        }
        return this.createError(this.errorTypes.DATA_VALIDATION, 'invalid_numeric_data', message, context);
    }

    /**
     * Categorize player matching errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizePlayerError(message, context) {
        if (/unable.*match|unmatched.*player/i.test(message)) {
            return this.createError(this.errorTypes.PLAYER_MATCHING, 'unmatched_players', message, context);
        }
        return this.createError(this.errorTypes.PLAYER_MATCHING, 'unmatched_players', message, context);
    }

    /**
     * Categorize database errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizeDatabaseError(message, context) {
        if (/permission.*denied/i.test(message)) {
            return this.createError(this.errorTypes.DATABASE, 'permission_denied', message, context);
        }
        if (/connection.*failed|firebase.*error/i.test(message)) {
            return this.createError(this.errorTypes.DATABASE, 'connection_failed', message, context);
        }
        if (/transaction.*failed/i.test(message)) {
            return this.createError(this.errorTypes.DATABASE, 'transaction_failed', message, context);
        }
        if (/not.*found/i.test(message)) {
            return this.createError(this.errorTypes.DATABASE, 'data_not_found', message, context);
        }
        return this.createError(this.errorTypes.DATABASE, 'connection_failed', message, context);
    }

    /**
     * Categorize network errors
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @returns {Object} Categorized error
     */
    categorizeNetworkError(message, context) {
        if (/timeout/i.test(message)) {
            return this.createError(this.errorTypes.NETWORK, 'timeout', message, context);
        }
        if (/offline|connection/i.test(message)) {
            return this.createError(this.errorTypes.NETWORK, 'offline', message, context);
        }
        return this.createError(this.errorTypes.NETWORK, 'timeout', message, context);
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create user-friendly error message for display
     * @param {Object} error - Error object
     * @param {boolean} includeDetails - Whether to include detailed information
     * @returns {string} Formatted error message
     */
    formatErrorMessage(error, includeDetails = true) {
        if (!error) return 'Unknown error occurred';

        let message = error.message || 'Unknown error occurred';

        if (includeDetails && error.details) {
            message += `\n\n${error.details}`;
        }

        if (error.suggestions && error.suggestions.length > 0) {
            message += '\n\nSuggestions:';
            error.suggestions.forEach(suggestion => {
                message += `\n• ${suggestion}`;
            });
        }

        if (error.errorId) {
            message += `\n\nError ID: ${error.errorId}`;
        }

        return message;
    }

    /**
     * Log error with appropriate level based on severity
     * @param {Object} error - Error object
     * @param {Object} additionalContext - Additional context for logging
     */
    logError(error, additionalContext = {}) {
        const logData = {
            ...error,
            additionalContext,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        switch (error.severity) {
            case this.severityLevels.CRITICAL:
                console.error('🚨 CRITICAL ERROR:', logData);
                break;
            case this.severityLevels.HIGH:
                console.error('❌ HIGH SEVERITY ERROR:', logData);
                break;
            case this.severityLevels.MEDIUM:
                console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
                break;
            case this.severityLevels.LOW:
                console.info('ℹ️ LOW SEVERITY ERROR:', logData);
                break;
            default:
                console.log('📝 ERROR:', logData);
        }
    }

    /**
     * Get error statistics for monitoring
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        // This could be enhanced to track errors over time
        return {
            errorTypes: Object.keys(this.errorTypes),
            severityLevels: Object.keys(this.severityLevels),
            templateCount: Object.keys(this.errorTemplates).reduce((total, type) => {
                return total + Object.keys(this.errorTemplates[type]).length;
            }, 0)
        };
    }
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;