// Loading State Manager
// Manages different loading states throughout the application

class LoadingStateManager {
  constructor() {
    this.states = {
      IDLE: 'idle',
      LOADING: 'loading',
      SUCCESS: 'success',
      ERROR: 'error'
    };
    this.currentState = this.states.IDLE;
  }

  showLoading(message = 'Loading...') {
    this.currentState = this.states.LOADING;
    const spinner = document.getElementById('loading-spinner');
    if (!spinner) return;
    
    const spinnerText = spinner.querySelector('p');
    if (spinnerText) spinnerText.textContent = message;
    spinner.style.display = 'flex';
    spinner.setAttribute('aria-busy', 'true');
    spinner.setAttribute('role', 'status');
  }

  showError(message, retryFn) {
    this.currentState = this.states.ERROR;
    const container = document.querySelector('.leaderboard-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-state" role="alert">
        <span class="error-icon">⚠️</span>
        <h2>Oops! Something went wrong</h2>
        <p>${message}</p>
        ${retryFn ? '<button onclick="window.loadingManager.retry()" class="retry-btn">Try Again</button>' : ''}
      </div>
    `;
    this.retryFn = retryFn;
  }

  showEmpty(message = 'No data available') {
    const container = document.querySelector('.leaderboard-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <h2>${message}</h2>
      </div>
    `;
  }

  hide() {
    this.currentState = this.states.SUCCESS;
    const spinner = document.getElementById('loading-spinner');
    if (!spinner) return;
    
    spinner.style.display = 'none';
    spinner.setAttribute('aria-busy', 'false');
  }

  retry() {
    if (this.retryFn && typeof this.retryFn === 'function') {
      this.retryFn();
    }
  }

  showSkeleton() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) {
      skeleton.style.display = 'block';
      skeleton.setAttribute('aria-busy', 'true');
      skeleton.setAttribute('role', 'status');
      skeleton.setAttribute('aria-label', 'Loading player data');
    }
  }

  hideSkeleton() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) {
      skeleton.style.display = 'none';
      skeleton.setAttribute('aria-busy', 'false');
    }
  }
}

// Create global instance
const loadingManager = new LoadingStateManager();
