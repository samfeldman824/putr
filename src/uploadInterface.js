/**
 * Upload Interface Module
 * Handles the file upload UI interactions and basic file validation
 */

class UploadInterface {
    constructor() {
        this.uploadArea = null;
        this.fileInput = null;
        this.uploadButton = null;
        this.statusContainer = null;
        this.statusMessage = null;
        this.progressBar = null;
        this.progressFill = null;
        this.undoContainer = null;
        this.undoButton = null;
        
        this.isProcessing = false;
        this.onFileSelected = null; // Callback for when file is selected
        
        // Initialize error handler
        this.errorHandler = new ErrorHandler();
        console.log('🎨 UploadInterface initialized with enhanced error handling');
    }

    /**
     * Initialize the upload interface
     */
    initialize() {
        this.setupElements();
        this.setupEventListeners();
        this.resetInterface();
    }

    /**
     * Set up DOM element references
     */
    setupElements() {
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadButton = document.getElementById('upload-button');
        this.statusContainer = document.getElementById('upload-status');
        this.statusMessage = document.getElementById('status-message');
        this.progressBar = document.getElementById('progress-bar');
        this.progressFill = document.getElementById('progress-fill');
        this.undoContainer = document.getElementById('undo-container');
        this.undoButton = document.getElementById('undo-button');

        if (!this.uploadArea || !this.fileInput || !this.uploadButton) {
            throw new Error('Required upload interface elements not found');
        }
    }

    /**
     * Set up event listeners for file selection and drag-and-drop
     */
    setupEventListeners() {
        // Click to select file
        this.uploadArea.addEventListener('click', () => {
            if (!this.isProcessing) {
                this.fileInput.click();
            }
        });

        this.uploadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isProcessing) {
                this.fileInput.click();
            }
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Drag and drop event listeners
        this.setupDragAndDropListeners();
    }

    /**
     * Set up drag and drop event listeners with visual feedback
     */
    setupDragAndDropListeners() {
        // Prevent default drag behaviors on document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                if (!this.isProcessing) {
                    this.highlightDropArea();
                }
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.unhighlightDropArea();
            }, false);
        });

        // Handle dropped files
        this.uploadArea.addEventListener('drop', (e) => {
            if (!this.isProcessing) {
                this.handleDrop(e);
            }
        }, false);

        // Handle drag over document (for better UX)
        document.addEventListener('dragover', (e) => {
            if (!this.isProcessing) {
                // Show upload area is available for drop
                this.uploadArea.style.opacity = '1';
            }
        });

        document.addEventListener('dragleave', (e) => {
            // Only hide if leaving the document entirely
            if (e.clientX === 0 && e.clientY === 0) {
                this.uploadArea.style.opacity = '';
            }
        });
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Highlight drop area with visual feedback
     */
    highlightDropArea() {
        this.uploadArea.classList.add('drag-over');
    }

    /**
     * Remove highlight from drop area
     */
    unhighlightDropArea() {
        this.uploadArea.classList.remove('drag-over');
    }

    /**
     * Handle file drop with validation
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length === 0) {
            this.showError('No files were dropped');
            return;
        }

        if (files.length > 1) {
            this.showError('Please drop only one CSV file at a time');
            return;
        }

        const file = files[0];
        
        // Immediate file type validation with visual feedback
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please drop a CSV file');
            this.uploadArea.classList.add('error');
            setTimeout(() => {
                this.uploadArea.classList.remove('error');
            }, 2000);
            return;
        }

        // Handle the file selection
        this.handleFileSelection(file);
    }

    /**
     * Handle file selection and basic validation
     */
    handleFileSelection(file) {
        try {
            // Comprehensive file validation using ErrorHandler
            const validation = this.errorHandler.validateFile(file);
            
            if (!validation.isValid) {
                this.showStructuredError(validation.error);
                return;
            }

            // Clear any previous errors
            this.hideStatus();

            // Call the callback if provided
            if (this.onFileSelected && typeof this.onFileSelected === 'function') {
                this.onFileSelected(file);
            }

        } catch (error) {
            // Handle unexpected errors during validation
            const analyzedError = this.errorHandler.analyzeError(error, {
                fileName: file?.name,
                fileSize: file?.size,
                operation: 'handleFileSelection'
            });
            
            this.errorHandler.logError(analyzedError);
            this.showStructuredError(analyzedError);
        }
    }

    /**
     * Set callback for file selection
     */
    setFileSelectedCallback(callback) {
        this.onFileSelected = callback;
    }

    /**
     * Show processing state with detailed progress tracking
     */
    showProcessing(message = 'Processing file...', showProgress = true) {
        this.isProcessing = true;
        this.uploadArea.className = 'upload-area processing';
        this.uploadButton.disabled = true;
        this.uploadButton.textContent = 'Processing...';
        
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = 'upload-status processing';
        this.statusMessage.textContent = message;
        
        if (showProgress) {
            this.progressBar.style.display = 'block';
            this.updateProgress(0);
        } else {
            this.progressBar.style.display = 'none';
        }
        
        this.hideUndo();
    }

    /**
     * Update progress bar with smooth animation
     */
    updateProgress(percentage, message = null) {
        if (this.progressFill) {
            const clampedPercentage = Math.min(100, Math.max(0, percentage));
            this.progressFill.style.width = `${clampedPercentage}%`;
            
            // Update message if provided
            if (message && this.statusMessage) {
                this.statusMessage.textContent = message;
            }
            
            // Add completion animation
            if (clampedPercentage >= 100) {
                setTimeout(() => {
                    this.progressFill.style.backgroundColor = '#28a745';
                }, 300);
            }
        }
    }

    /**
     * Show processing steps with progress updates
     */
    showProcessingStep(step, totalSteps, stepMessage) {
        const percentage = (step / totalSteps) * 100;
        this.updateProgress(percentage, `Step ${step}/${totalSteps}: ${stepMessage}`);
    }

    /**
     * Show indeterminate progress (for unknown duration tasks)
     */
    showIndeterminateProgress(message) {
        this.showProcessing(message, true);
        
        // Add pulsing animation to progress bar
        if (this.progressFill) {
            this.progressFill.style.width = '100%';
            this.progressFill.style.animation = 'pulse 1.5s ease-in-out infinite';
        }
    }

    /**
     * Show success message with optional undo callback
     */
    showSuccess(message, undoCallback = null) {
        this.isProcessing = false;
        this.uploadArea.className = 'upload-area success';
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Select CSV File';
        
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = 'upload-status success';
        this.statusMessage.textContent = message;
        this.progressBar.style.display = 'none';
        
        // Show undo button if callback provided
        if (undoCallback && typeof undoCallback === 'function') {
            this.showUndo(undoCallback);
        }
        
        // Clear file input
        this.fileInput.value = '';
    }

    /**
     * Show error message
     */
    showError(message) {
        this.isProcessing = false;
        this.uploadArea.className = 'upload-area error';
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Select CSV File';
        
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = 'upload-status error';
        this.statusMessage.textContent = message;
        this.progressBar.style.display = 'none';
        this.hideUndo();
        
        // Clear file input
        this.fileInput.value = '';
    }

    /**
     * Show structured error with enhanced messaging and recovery options
     * @param {Object} error - Structured error object from ErrorHandler
     */
    showStructuredError(error) {
        if (!error) {
            this.showError('An unknown error occurred');
            return;
        }

        this.isProcessing = false;
        this.uploadArea.className = `upload-area error ${error.severity || 'medium'}`;
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Select CSV File';
        
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = `upload-status error ${error.severity || 'medium'}`;
        
        // Create enhanced error message
        const formattedMessage = this.errorHandler.formatErrorMessage(error, true);
        this.statusMessage.textContent = formattedMessage;
        
        this.progressBar.style.display = 'none';
        this.hideUndo();
        
        // Add recovery suggestions as interactive elements if error is recoverable
        if (error.recoverable && error.suggestions && error.suggestions.length > 0) {
            this.addRecoverySuggestions(error.suggestions);
        }
        
        // Auto-hide non-critical errors after delay
        if (error.severity === this.errorHandler.severityLevels.LOW || 
            error.severity === this.errorHandler.severityLevels.MEDIUM) {
            this.autoHideStatus(8000); // 8 seconds for less critical errors
        }
        
        // Clear file input
        this.fileInput.value = '';
    }

    /**
     * Add interactive recovery suggestions to the error display
     * @param {Array<string>} suggestions - Array of suggestion strings
     */
    addRecoverySuggestions(suggestions) {
        // Create suggestions container if it doesn't exist
        let suggestionsContainer = document.getElementById('error-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'error-suggestions';
            suggestionsContainer.className = 'error-suggestions';
            this.statusContainer.appendChild(suggestionsContainer);
        }

        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';

        // Add suggestions as interactive elements
        const suggestionsTitle = document.createElement('div');
        suggestionsTitle.className = 'suggestions-title';
        suggestionsTitle.textContent = 'How to fix this:';
        suggestionsContainer.appendChild(suggestionsTitle);

        const suggestionsList = document.createElement('ul');
        suggestionsList.className = 'suggestions-list';

        suggestions.forEach((suggestion, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'suggestion-item';
            listItem.textContent = suggestion;
            
            // Add click handler for interactive suggestions
            if (suggestion.includes('refresh')) {
                listItem.classList.add('clickable');
                listItem.addEventListener('click', () => {
                    if (confirm('This will refresh the page and clear any unsaved work. Continue?')) {
                        window.location.reload();
                    }
                });
            }
            
            suggestionsList.appendChild(listItem);
        });

        suggestionsContainer.appendChild(suggestionsList);
    }

    /**
     * Hide status messages
     */
    hideStatus() {
        this.statusContainer.style.display = 'none';
        this.progressBar.style.display = 'none';
    }

    /**
     * Show undo button with callback and enhanced messaging
     */
    showUndo(undoCallback, gameDate = null, playerCount = null) {
        this.undoContainer.style.display = 'block';
        
        // Update button text with context if provided
        if (gameDate && playerCount) {
            this.undoButton.textContent = `Undo Upload (${gameDate}, ${playerCount} players)`;
        } else {
            this.undoButton.textContent = 'Undo Last Upload';
        }
        
        // Remove existing listeners
        const newUndoButton = this.undoButton.cloneNode(true);
        this.undoButton.parentNode.replaceChild(newUndoButton, this.undoButton);
        this.undoButton = newUndoButton;
        
        // Add new listener with enhanced confirmation
        this.undoButton.addEventListener('click', () => {
            const confirmMessage = gameDate && playerCount 
                ? `Are you sure you want to undo the upload for ${gameDate}?\n\nThis will revert statistics for ${playerCount} players to their previous state.`
                : 'Are you sure you want to undo the last upload? This will revert all player statistics to their previous state.';
                
            if (confirm(confirmMessage)) {
                this.showUndoProcessing();
                undoCallback();
            }
        });
    }

    /**
     * Show undo processing state
     */
    showUndoProcessing() {
        this.undoButton.disabled = true;
        this.undoButton.textContent = 'Undoing...';
        this.showIndeterminateProgress('Reverting player statistics...');
    }

    /**
     * Show undo success
     */
    showUndoSuccess(message = 'Upload successfully undone') {
        this.showSuccess(message);
        this.hideUndo();
    }

    /**
     * Show undo error
     */
    showUndoError(message = 'Failed to undo upload') {
        this.showError(message);
        this.undoButton.disabled = false;
        this.undoButton.textContent = 'Undo Last Upload';
    }

    /**
     * Hide undo button
     */
    hideUndo() {
        this.undoContainer.style.display = 'none';
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = 'upload-status warning';
        this.statusMessage.textContent = message;
        this.progressBar.style.display = 'none';
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.statusContainer.style.display = 'block';
        this.statusContainer.className = 'upload-status info';
        this.statusMessage.textContent = message;
        this.progressBar.style.display = 'none';
    }

    /**
     * Auto-hide status message after delay
     */
    autoHideStatus(delay = 5000) {
        setTimeout(() => {
            if (!this.isProcessing) {
                this.hideStatus();
            }
        }, delay);
    }

    /**
     * Show detailed error with suggestions
     */
    showDetailedError(message, suggestions = []) {
        let fullMessage = message;
        if (suggestions.length > 0) {
            fullMessage += '\n\nSuggestions:\n' + suggestions.map(s => `• ${s}`).join('\n');
        }
        
        this.showError(fullMessage);
    }

    /**
     * Show success with detailed statistics
     */
    showDetailedSuccess(gameDate, playerCount, undoCallback = null) {
        const message = `Successfully uploaded game for ${gameDate}. Updated statistics for ${playerCount} players.`;
        this.showSuccess(message, undoCallback);
        
        if (undoCallback) {
            this.showUndo(undoCallback, gameDate, playerCount);
        }
    }

    /**
     * Reset interface to initial state
     */
    resetInterface() {
        this.isProcessing = false;
        this.uploadArea.className = 'upload-area';
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Select CSV File';
        this.hideStatus();
        this.hideUndo();
        this.fileInput.value = '';
        
        // Reset progress bar animation
        if (this.progressFill) {
            this.progressFill.style.animation = '';
            this.progressFill.style.backgroundColor = '#007BFF';
        }
    }

    /**
     * Get current processing state
     */
    getProcessingState() {
        return this.isProcessing;
    }
}

// Export for use in other modules
window.UploadInterface = UploadInterface;