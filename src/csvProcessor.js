/**
 * CSV Processing Module
 * Handles CSV file parsing, validation, and data extraction for poker game ledgers
 */

class CSVProcessor {
    constructor() {
        this.requiredColumns = [
            'player_nickname',
            'player_id',
            'session_start_at',
            'session_end_at',
            'buy_in',
            'buy_out',
            'stack',
            'net'
        ];
        
        // Initialize error handler
        this.errorHandler = new ErrorHandler();
        console.log('📊 CSVProcessor initialized with enhanced error handling');
    }

    /**
     * Main function to parse a CSV file
     * @param {File} file - The CSV file to parse
     * @returns {Promise<Object>} - Parsed and validated data with game date
     */
    async parseCSVFile(file) {
        try {
            console.log(`📊 Starting CSV processing for: ${file?.name || 'unknown file'}`);

            // Comprehensive file validation
            const fileValidation = this.errorHandler.validateFile(file);
            if (!fileValidation.isValid) {
                this.errorHandler.logError(fileValidation.error, { fileName: file?.name });
                throw fileValidation.error;
            }

            // Extract game date from filename (already validated above)
            const gameDate = fileValidation.error?.context?.gameDate || this.extractGameDate(file.name);

            // Read file contents with enhanced error handling
            const fileContent = await this.readFileContentWithValidation(file);

            // Parse CSV content with comprehensive validation
            const parsedData = this.parseCSVContentWithValidation(fileContent);

            // Validate CSV structure and data
            const dataValidation = this.errorHandler.validateCSVData(parsedData, this.requiredColumns);
            if (!dataValidation.isValid) {
                // Log all validation errors
                dataValidation.errors.forEach(error => {
                    this.errorHandler.logError(error, { fileName: file.name });
                });
                
                // Throw the first critical error or the first error if none are critical
                const criticalError = dataValidation.errors.find(e => e.severity === this.errorHandler.severityLevels.CRITICAL);
                throw criticalError || dataValidation.errors[0];
            }

            // Sanitize and validate data with enhanced error reporting
            const sanitizedData = this.sanitizePlayerDataWithValidation(parsedData);

            console.log(`✅ CSV processing completed: ${sanitizedData.length} players processed`);

            return {
                gameDate,
                players: sanitizedData,
                playerCount: sanitizedData.length
            };

        } catch (error) {
            // If it's already a structured error, re-throw it
            if (error.type && error.subtype) {
                throw error;
            }

            // Otherwise, analyze and categorize the error
            const analyzedError = this.errorHandler.analyzeError(error, { 
                fileName: file?.name,
                fileSize: file?.size,
                operation: 'parseCSVFile'
            });
            
            this.errorHandler.logError(analyzedError);
            throw analyzedError;
        }
    }

    /**
     * Validates that the uploaded file is a CSV
     * @param {File} file - File to validate
     * @returns {boolean} - True if valid CSV file
     */
    validateFileType(file) {
        if (!file) {
            return false;
        }

        const validExtensions = ['.csv'];
        const fileName = file.name.toLowerCase();

        return validExtensions.some(ext => fileName.endsWith(ext));
    }

    /**
     * Extracts game date from filename using pattern ledgerYY_MM_DD.csv or ledgerYY_MM_DD(#).csv
     * @param {string} filename - The CSV filename
     * @returns {string} - Formatted date string (YYYY-MM-DD)
     */
    extractGameDate(filename) {
        // Clean filename by removing spaces and normalizing
        const cleanedFilename = filename.trim().replace(/\s+/g, '');
        
        // Pattern: ledgerYY_MM_DD.csv or ledgerYY_MM_DD(#).csv (e.g., ledger23_10_15.csv or ledger23_10_15(1).csv)
        const datePattern = /ledger(\d{2})_(\d{2})_(\d{2})(?:\(\d+\))?\.csv$/i;
        const match = cleanedFilename.match(datePattern);

        if (!match) {
            throw new Error('Filename must follow the pattern "ledgerYY_MM_DD.csv" or "ledgerYY_MM_DD(#).csv" (e.g., ledger23_10_15.csv or ledger23_10_15(1).csv)');
        }

        const [, year, month, day] = match;

        // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
        const fullYear = `20${year}`;

        // Validate date components
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);

        if (monthNum < 1 || monthNum > 12) {
            throw new Error(`Invalid month in filename: ${month}. Month must be between 01 and 12.`);
        }

        if (dayNum < 1 || dayNum > 31) {
            throw new Error(`Invalid day in filename: ${day}. Day must be between 01 and 31.`);
        }

        // Return formatted date string
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * Reads file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} - File content as string
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const content = event.target.result;
                if (!content || content.trim().length === 0) {
                    reject(new Error('CSV file appears to be empty'));
                } else {
                    resolve(content);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Enhanced file content reading with comprehensive error handling
     * @param {File} file - File to read
     * @returns {Promise<string>} - File content as string
     */
    async readFileContentWithValidation(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    
                    if (!content) {
                        const error = this.errorHandler.createError(
                            this.errorHandler.errorTypes.FILE_VALIDATION,
                            'file_empty',
                            'File content is null or undefined',
                            { fileName: file.name, fileSize: file.size }
                        );
                        reject(error);
                        return;
                    }

                    const trimmedContent = content.trim();
                    if (trimmedContent.length === 0) {
                        const error = this.errorHandler.createError(
                            this.errorHandler.errorTypes.FILE_VALIDATION,
                            'file_empty',
                            'CSV file contains only whitespace',
                            { fileName: file.name, fileSize: file.size, contentLength: content.length }
                        );
                        reject(error);
                        return;
                    }

                    // Check for minimum content (at least a header and one data row)
                    const lines = trimmedContent.split('\n').filter(line => line.trim().length > 0);
                    if (lines.length < 2) {
                        const error = this.errorHandler.createError(
                            this.errorHandler.errorTypes.CSV_PARSING,
                            'insufficient_data',
                            `CSV file has only ${lines.length} line(s), but needs at least 2 (header + data)`,
                            { fileName: file.name, lineCount: lines.length }
                        );
                        reject(error);
                        return;
                    }

                    resolve(content);
                } catch (parseError) {
                    const error = this.errorHandler.createError(
                        this.errorHandler.errorTypes.SYSTEM,
                        'memory_error',
                        'Failed to process file content - file may be too large or corrupted',
                        { fileName: file.name, fileSize: file.size, originalError: parseError.message }
                    );
                    reject(error);
                }
            };

            reader.onerror = (event) => {
                const error = this.errorHandler.createError(
                    this.errorHandler.errorTypes.SYSTEM,
                    'initialization_failed',
                    'Failed to read file - file may be corrupted or inaccessible',
                    { 
                        fileName: file.name, 
                        fileSize: file.size,
                        errorCode: event.target?.error?.code,
                        errorName: event.target?.error?.name
                    }
                );
                reject(error);
            };

            reader.onabort = () => {
                const error = this.errorHandler.createError(
                    this.errorHandler.errorTypes.SYSTEM,
                    'initialization_failed',
                    'File reading was aborted',
                    { fileName: file.name }
                );
                reject(error);
            };

            try {
                reader.readAsText(file);
            } catch (readerError) {
                const error = this.errorHandler.createError(
                    this.errorHandler.errorTypes.SYSTEM,
                    'initialization_failed',
                    'Failed to start file reading process',
                    { fileName: file.name, originalError: readerError.message }
                );
                reject(error);
            }
        });
    }

    /**
     * Parses CSV content into array of objects
     * @param {string} csvContent - Raw CSV content
     * @returns {Array<Object>} - Parsed CSV data
     */
    parseCSVContent(csvContent) {
        const lines = csvContent.trim().split('\n');

        if (lines.length < 3) {
            throw new Error('CSV file must contain at least a header row and two player rows (minimum 2 players required for a game)');
        }

        // Parse header row
        const headers = this.parseCSVRow(lines[0]);

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length === 0) continue; // Skip empty lines

            try {
                const values = this.parseCSVRow(line);

                if (values.length !== headers.length) {
                    throw new Error(`Row ${i + 1} has ${values.length} columns but header has ${headers.length} columns`);
                }

                // Create object from headers and values
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header.trim()] = values[index];
                });

                data.push(rowData);
            } catch (error) {
                throw new Error(`Error parsing row ${i + 1}: ${error.message}`);
            }
        }

        return data;
    }

    /**
     * Enhanced CSV content parsing with comprehensive error handling
     * @param {string} csvContent - Raw CSV content
     * @returns {Array<Object>} - Parsed CSV data
     */
    parseCSVContentWithValidation(csvContent) {
        try {
            const lines = csvContent.trim().split('\n');
            const nonEmptyLines = lines.filter(line => line.trim().length > 0);

            // Validate minimum line count
            if (nonEmptyLines.length < 2) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.CSV_PARSING,
                    'insufficient_data',
                    `CSV has only ${nonEmptyLines.length} non-empty lines, but needs at least 2 (header + data)`,
                    { totalLines: lines.length, nonEmptyLines: nonEmptyLines.length }
                );
            }

            // Parse header row with validation
            let headers;
            try {
                headers = this.parseCSVRow(nonEmptyLines[0]);
                if (headers.length === 0) {
                    throw this.errorHandler.createError(
                        this.errorHandler.errorTypes.CSV_PARSING,
                        'parse_error',
                        'Header row is empty or invalid',
                        { headerLine: nonEmptyLines[0] }
                    );
                }
            } catch (error) {
                if (error.type && error.subtype) throw error;
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.CSV_PARSING,
                    'parse_error',
                    `Failed to parse header row: ${error.message}`,
                    { headerLine: nonEmptyLines[0] }
                );
            }

            // Parse data rows with enhanced error reporting
            const data = [];
            const parseErrors = [];

            for (let i = 1; i < nonEmptyLines.length; i++) {
                const line = nonEmptyLines[i].trim();
                const rowNumber = i + 1; // +1 for header row

                try {
                    const values = this.parseCSVRow(line);

                    // Validate column count
                    if (values.length !== headers.length) {
                        const error = this.errorHandler.createError(
                            this.errorHandler.errorTypes.CSV_PARSING,
                            'row_mismatch',
                            `Row ${rowNumber} has ${values.length} columns but header has ${headers.length} columns`,
                            { 
                                rowNumber, 
                                expectedColumns: headers.length, 
                                actualColumns: values.length,
                                rowContent: line.substring(0, 100) + (line.length > 100 ? '...' : '')
                            }
                        );
                        parseErrors.push(error);
                        continue;
                    }

                    // Create object from headers and values
                    const rowData = {};
                    headers.forEach((header, index) => {
                        const cleanHeader = header.trim();
                        const cleanValue = values[index]?.trim() || '';
                        rowData[cleanHeader] = cleanValue;
                    });

                    data.push(rowData);

                } catch (error) {
                    const parseError = this.errorHandler.createError(
                        this.errorHandler.errorTypes.CSV_PARSING,
                        'parse_error',
                        `Error parsing row ${rowNumber}: ${error.message}`,
                        { 
                            rowNumber, 
                            rowContent: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
                            originalError: error.message
                        }
                    );
                    parseErrors.push(parseError);
                }
            }

            // Handle parse errors
            if (parseErrors.length > 0) {
                // If we have some successful rows, log warnings for failed rows
                if (data.length > 0) {
                    parseErrors.forEach(error => {
                        this.errorHandler.logError(error, { operation: 'parseCSVRow' });
                    });
                    console.warn(`⚠️ Parsed ${data.length} rows successfully, ${parseErrors.length} rows failed`);
                } else {
                    // If no rows were parsed successfully, throw the first error
                    throw parseErrors[0];
                }
            }

            // Final validation - ensure we have enough data
            if (data.length < 2) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.CSV_PARSING,
                    'insufficient_data',
                    `Only ${data.length} valid data rows found, but at least 2 players are required for a game`,
                    { validRows: data.length, totalRows: nonEmptyLines.length - 1 }
                );
            }

            console.log(`📊 Successfully parsed ${data.length} rows from CSV`);
            return data;

        } catch (error) {
            // If it's already a structured error, re-throw it
            if (error.type && error.subtype) {
                throw error;
            }

            // Otherwise, wrap it in a parsing error
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.CSV_PARSING,
                'parse_error',
                `CSV parsing failed: ${error.message}`,
                { originalError: error.message }
            );
        }
    }

    /**
     * Parses a single CSV row, handling quoted values and commas
     * @param {string} row - CSV row string
     * @returns {Array<string>} - Array of cell values
     */
    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Add the last field
        result.push(current.trim());

        return result;
    }

    /**
     * Validates that CSV contains all required columns
     * @param {Array<Object>} data - Parsed CSV data
     */
    validateCSVStructure(data) {
        if (!data || data.length === 0) {
            throw new Error('No data found in CSV file');
        }

        const firstRow = data[0];
        const actualColumns = Object.keys(firstRow);
        const missingColumns = [];

        // Check for required columns
        this.requiredColumns.forEach(requiredCol => {
            if (!actualColumns.includes(requiredCol)) {
                missingColumns.push(requiredCol);
            }
        });

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
    }

    /**
     * Sanitizes and validates player data
     * @param {Array<Object>} rawData - Raw parsed data
     * @returns {Array<Object>} - Sanitized and validated data
     */
    sanitizePlayerData(rawData) {
        const sanitizedData = [];

        rawData.forEach((row, index) => {
            try {
                const sanitizedRow = {
                    player_nickname: this.sanitizeString(row.player_nickname, `Row ${index + 2}`, 'player_nickname'),
                    player_id: this.sanitizeString(row.player_id, `Row ${index + 2}`, 'player_id'),
                    session_start_at: this.sanitizeOptionalString(row.session_start_at, `Row ${index + 2}`, 'session_start_at'),
                    session_end_at: this.sanitizeOptionalString(row.session_end_at, `Row ${index + 2}`, 'session_end_at'),
                    buy_in: this.sanitizeNumber(row.buy_in, `Row ${index + 2}`, 'buy_in'),
                    buy_out: this.sanitizeOptionalNumber(row.buy_out, `Row ${index + 2}`, 'buy_out'),
                    stack: this.sanitizeNumber(row.stack, `Row ${index + 2}`, 'stack'),
                    net: this.sanitizeNumber(row.net, `Row ${index + 2}`, 'net')
                };

                sanitizedData.push(sanitizedRow);
            } catch (error) {
                throw new Error(`Data validation error in row ${index + 2}: ${error.message}`);
            }
        });

        return sanitizedData;
    }

    /**
     * Enhanced data sanitization with comprehensive validation and error reporting
     * @param {Array<Object>} rawData - Raw parsed data
     * @returns {Array<Object>} - Sanitized and validated data
     */
    sanitizePlayerDataWithValidation(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DATA_VALIDATION,
                'missing_required_data',
                'Raw data is not a valid array',
                { dataType: typeof rawData, isArray: Array.isArray(rawData) }
            );
        }

        const sanitizedData = [];
        const validationErrors = [];

        rawData.forEach((row, index) => {
            const rowNumber = index + 2; // +2 for header row and 0-based index
            
            try {
                // Validate row structure
                if (!row || typeof row !== 'object') {
                    const error = this.errorHandler.createError(
                        this.errorHandler.errorTypes.DATA_VALIDATION,
                        'missing_required_data',
                        `Row ${rowNumber} is not a valid object`,
                        { rowNumber, rowType: typeof row, rowData: row }
                    );
                    validationErrors.push(error);
                    return;
                }

                // Sanitize each field with enhanced error handling
                const sanitizedRow = {};

                // Required string fields
                try {
                    sanitizedRow.player_nickname = this.sanitizeStringWithValidation(
                        row.player_nickname, rowNumber, 'player_nickname', true
                    );
                } catch (error) {
                    validationErrors.push(error);
                    return;
                }

                try {
                    sanitizedRow.player_id = this.sanitizeStringWithValidation(
                        row.player_id, rowNumber, 'player_id', true
                    );
                } catch (error) {
                    validationErrors.push(error);
                    return;
                }

                // Optional string fields
                sanitizedRow.session_start_at = this.sanitizeStringWithValidation(
                    row.session_start_at, rowNumber, 'session_start_at', false
                );
                sanitizedRow.session_end_at = this.sanitizeStringWithValidation(
                    row.session_end_at, rowNumber, 'session_end_at', false
                );

                // Required numeric fields
                try {
                    sanitizedRow.buy_in = this.sanitizeNumberWithValidation(
                        row.buy_in, rowNumber, 'buy_in', true
                    );
                } catch (error) {
                    validationErrors.push(error);
                    return;
                }

                try {
                    sanitizedRow.stack = this.sanitizeNumberWithValidation(
                        row.stack, rowNumber, 'stack', true
                    );
                } catch (error) {
                    validationErrors.push(error);
                    return;
                }

                try {
                    sanitizedRow.net = this.sanitizeNumberWithValidation(
                        row.net, rowNumber, 'net', true
                    );
                } catch (error) {
                    validationErrors.push(error);
                    return;
                }

                // Optional numeric field
                sanitizedRow.buy_out = this.sanitizeNumberWithValidation(
                    row.buy_out, rowNumber, 'buy_out', false
                );

                // Additional business logic validation
                this.validateBusinessRules(sanitizedRow, rowNumber, validationErrors);

                sanitizedData.push(sanitizedRow);

            } catch (error) {
                const validationError = error.type && error.subtype ? error : 
                    this.errorHandler.createError(
                        this.errorHandler.errorTypes.DATA_VALIDATION,
                        'missing_required_data',
                        `Data validation error in row ${rowNumber}: ${error.message}`,
                        { rowNumber, originalError: error.message, rowData: row }
                    );
                validationErrors.push(validationError);
            }
        });

        // Handle validation errors
        if (validationErrors.length > 0) {
            // Log all validation errors
            validationErrors.forEach(error => {
                this.errorHandler.logError(error, { operation: 'sanitizePlayerData' });
            });

            // If we have some valid data, decide whether to continue or fail
            const criticalErrors = validationErrors.filter(e => 
                e.severity === this.errorHandler.severityLevels.CRITICAL
            );

            if (criticalErrors.length > 0 || sanitizedData.length === 0) {
                // Throw the first critical error or first error if no data was processed
                throw criticalErrors[0] || validationErrors[0];
            } else {
                // Log warning about partial success
                console.warn(`⚠️ Data sanitization completed with warnings: ${sanitizedData.length} valid rows, ${validationErrors.length} errors`);
            }
        }

        console.log(`✅ Data sanitization completed: ${sanitizedData.length} valid players`);
        return sanitizedData;
    }

    /**
     * Enhanced string sanitization with validation
     * @param {any} value - Value to sanitize
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} fieldName - Field name for error reporting
     * @param {boolean} required - Whether the field is required
     * @returns {string|null} Sanitized string or null if optional and empty
     */
    sanitizeStringWithValidation(value, rowNumber, fieldName, required = true) {
        if (value === null || value === undefined) {
            if (required) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${fieldName} is required and cannot be null in row ${rowNumber}`,
                    { rowNumber, fieldName, value }
                );
            }
            return null;
        }

        const stringValue = String(value).trim();

        if (stringValue.length === 0) {
            if (required) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${fieldName} is required and cannot be empty in row ${rowNumber}`,
                    { rowNumber, fieldName, value }
                );
            }
            return null;
        }

        // Additional validation for specific fields
        if (fieldName === 'player_nickname' && stringValue.length > 50) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DATA_VALIDATION,
                'invalid_numeric_data',
                `${fieldName} is too long (${stringValue.length} characters, max 50) in row ${rowNumber}`,
                { rowNumber, fieldName, value: stringValue, maxLength: 50 }
            );
        }

        return stringValue;
    }

    /**
     * Enhanced numeric sanitization with validation
     * @param {any} value - Value to sanitize
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} fieldName - Field name for error reporting
     * @param {boolean} required - Whether the field is required
     * @returns {number|null} Sanitized number or null if optional and empty
     */
    sanitizeNumberWithValidation(value, rowNumber, fieldName, required = true) {
        if (value === null || value === undefined || value === '') {
            if (required) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${fieldName} is required and cannot be empty in row ${rowNumber}`,
                    { rowNumber, fieldName, value }
                );
            }
            return null;
        }

        // Convert to string and clean up
        const stringValue = String(value).trim();

        if (stringValue.length === 0) {
            if (required) {
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'missing_required_data',
                    `${fieldName} is required and cannot be empty in row ${rowNumber}`,
                    { rowNumber, fieldName, value }
                );
            }
            return null;
        }

        // Remove any non-numeric characters except decimal point and negative sign
        const cleanedValue = stringValue.replace(/[^\d.-]/g, '');

        if (cleanedValue.length === 0) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DATA_VALIDATION,
                'invalid_numeric_data',
                `${fieldName} contains no numeric characters in row ${rowNumber}. Found: "${stringValue}"`,
                { rowNumber, fieldName, originalValue: stringValue, cleanedValue }
            );
        }

        const numericValue = parseFloat(cleanedValue);

        if (isNaN(numericValue)) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DATA_VALIDATION,
                'invalid_numeric_data',
                `${fieldName} is not a valid number in row ${rowNumber}. Found: "${stringValue}"`,
                { rowNumber, fieldName, originalValue: stringValue, cleanedValue }
            );
        }

        // Additional validation for specific fields
        if (fieldName === 'buy_in' && numericValue < 0) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DATA_VALIDATION,
                'invalid_numeric_data',
                `${fieldName} cannot be negative in row ${rowNumber}. Found: ${numericValue}`,
                { rowNumber, fieldName, value: numericValue }
            );
        }

        return numericValue;
    }

    /**
     * Validate business rules for player data
     * @param {Object} playerData - Sanitized player data
     * @param {number} rowNumber - Row number for error reporting
     * @param {Array} validationErrors - Array to collect validation errors
     */
    validateBusinessRules(playerData, rowNumber, validationErrors) {
        try {
            // Validate that net calculation makes sense
            const expectedNet = playerData.buy_out ? 
                (playerData.buy_out + playerData.stack - playerData.buy_in) :
                (playerData.stack - playerData.buy_in);

            // Allow for small rounding differences (within 1 cent)
            if (Math.abs(playerData.net - expectedNet) > 1) {
                const warning = this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'invalid_numeric_data',
                    `Net calculation may be incorrect in row ${rowNumber}. Expected: ${expectedNet}, Found: ${playerData.net}`,
                    { 
                        rowNumber, 
                        expectedNet, 
                        actualNet: playerData.net,
                        buyIn: playerData.buy_in,
                        buyOut: playerData.buy_out,
                        stack: playerData.stack
                    }
                );
                warning.severity = this.errorHandler.severityLevels.LOW; // Make it a warning, not an error
                validationErrors.push(warning);
            }

            // Validate reasonable value ranges
            if (Math.abs(playerData.net) > 100000) { // $1000 in cents
                const warning = this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATA_VALIDATION,
                    'invalid_numeric_data',
                    `Net value seems unusually large in row ${rowNumber}: ${playerData.net / 100} dollars`,
                    { rowNumber, netInDollars: playerData.net / 100 }
                );
                warning.severity = this.errorHandler.severityLevels.LOW;
                validationErrors.push(warning);
            }

        } catch (error) {
            // Don't fail validation for business rule checks
            console.warn(`⚠️ Business rule validation failed for row ${rowNumber}:`, error.message);
        }
    }

    /**
     * Sanitizes string values
     * @param {any} value - Value to sanitize
     * @param {string} rowInfo - Row information for error messages
     * @param {string} columnName - Column name for error messages
     * @returns {string} - Sanitized string
     */
    sanitizeString(value, rowInfo, columnName) {
        if (value === null || value === undefined) {
            throw new Error(`${columnName} cannot be empty in ${rowInfo}`);
        }

        const stringValue = String(value).trim();

        if (stringValue.length === 0) {
            throw new Error(`${columnName} cannot be empty in ${rowInfo}`);
        }

        return stringValue;
    }

    /**
     * Sanitizes optional string values (can be empty)
     * @param {any} value - Value to sanitize
     * @param {string} rowInfo - Row information for error messages
     * @param {string} columnName - Column name for error messages
     * @returns {string|null} - Sanitized string or null if empty
     */
    sanitizeOptionalString(value, rowInfo, columnName) {
        if (value === null || value === undefined) {
            return null;
        }

        const stringValue = String(value).trim();

        if (stringValue.length === 0) {
            return null;
        }

        return stringValue;
    }

    /**
     * Sanitizes and validates numeric values
     * @param {any} value - Value to sanitize
     * @param {string} rowInfo - Row information for error messages
     * @param {string} columnName - Column name for error messages
     * @returns {number} - Sanitized number
     */
    sanitizeNumber(value, rowInfo, columnName) {
        if (value === null || value === undefined || value === '') {
            throw new Error(`${columnName} cannot be empty in ${rowInfo}`);
        }

        // Convert to string and clean up
        const stringValue = String(value).trim();

        // Remove any non-numeric characters except decimal point and negative sign
        const cleanedValue = stringValue.replace(/[^\d.-]/g, '');

        const numericValue = parseFloat(cleanedValue);

        if (isNaN(numericValue)) {
            throw new Error(`${columnName} must be a valid number in ${rowInfo}. Found: "${stringValue}"`);
        }

        return numericValue;
    }

    /**
     * Sanitizes and validates optional numeric values (can be empty)
     * @param {any} value - Value to sanitize
     * @param {string} rowInfo - Row information for error messages
     * @param {string} columnName - Column name for error messages
     * @returns {number|null} - Sanitized number or null if empty
     */
    sanitizeOptionalNumber(value, rowInfo, columnName) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        // Convert to string and clean up
        const stringValue = String(value).trim();

        if (stringValue.length === 0) {
            return null;
        }

        // Remove any non-numeric characters except decimal point and negative sign
        const cleanedValue = stringValue.replace(/[^\d.-]/g, '');

        const numericValue = parseFloat(cleanedValue);

        if (isNaN(numericValue)) {
            throw new Error(`${columnName} must be a valid number in ${rowInfo}. Found: "${stringValue}"`);
        }

        return numericValue;
    }
}

// Export for use in other modules
window.CSVProcessor = CSVProcessor;