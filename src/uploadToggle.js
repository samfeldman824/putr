/**
 * Upload Interface Toggle Module
 * Handles showing/hiding the CSV upload interface with smooth animations
 */

class UploadToggle {
    constructor() {
        this.toggleButton = null;
        this.uploadContainer = null;
        this.isVisible = false;
        this.storageKey = 'uploadInterfaceVisible';

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupToggle());
        } else {
            this.setupToggle();
        }
    }

    setupToggle() {
        this.toggleButton = document.getElementById('toggle-upload-btn');
        this.uploadContainer = document.getElementById('upload-container');

        if (!this.toggleButton || !this.uploadContainer) {
            console.error('Toggle button or upload container not found');
            return;
        }

        // Load saved state from localStorage
        this.loadToggleState();

        // Add click event listener
        this.toggleButton.addEventListener('click', () => this.toggleUploadInterface());

        // Update button appearance based on initial state
        this.updateButtonAppearance();
    }

    toggleUploadInterface() {
        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            this.showUploadInterface();
        } else {
            this.hideUploadInterface();
        }

        // Save state to localStorage
        this.saveToggleState();
        this.updateButtonAppearance();
    }

    showUploadInterface() {
        this.uploadContainer.style.display = 'block';
        this.uploadContainer.classList.remove('hide');
        this.uploadContainer.classList.add('show');

        // Remove animation class after animation completes
        setTimeout(() => {
            this.uploadContainer.classList.remove('show');
        }, 300);
    }

    hideUploadInterface() {
        this.uploadContainer.classList.remove('show');
        this.uploadContainer.classList.add('hide');

        // Hide the container after animation completes
        setTimeout(() => {
            this.uploadContainer.style.display = 'none';
            this.uploadContainer.classList.remove('hide');
        }, 300);
    }

    updateButtonAppearance() {
        const toggleIcon = this.toggleButton.querySelector('.toggle-icon');
        const toggleText = this.toggleButton.querySelector('.toggle-text');

        if (this.isVisible) {
            this.toggleButton.classList.add('active');
            toggleIcon.textContent = '✖️';
            toggleText.textContent = 'Hide Upload';
        } else {
            this.toggleButton.classList.remove('active');
            toggleIcon.textContent = '📁';
            toggleText.textContent = 'Upload Results';
        }
    }

    saveToggleState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.isVisible));
        } catch (error) {
            console.warn('Could not save toggle state to localStorage:', error);
        }
    }

    loadToggleState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState !== null) {
                this.isVisible = JSON.parse(savedState);

                // Apply the saved state
                if (this.isVisible) {
                    this.uploadContainer.style.display = 'block';
                } else {
                    this.uploadContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.warn('Could not load toggle state from localStorage:', error);
            this.isVisible = false; // Default to hidden
        }
    }

    // Public method to programmatically show the upload interface
    show() {
        if (!this.isVisible) {
            this.toggleUploadInterface();
        }
    }

    // Public method to programmatically hide the upload interface
    hide() {
        if (this.isVisible) {
            this.toggleUploadInterface();
        }
    }

    // Public method to check if interface is visible
    getVisibility() {
        return this.isVisible;
    }
}

// Create global instance
window.uploadToggle = new UploadToggle();