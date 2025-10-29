// theme.js - Theme management for dark mode support
class ThemeManager {
  constructor() {
    this.theme = this.getPreferredTheme();
    this.init();
  }

  init() {
    // Apply theme immediately (before page renders)
    this.applyTheme(this.theme);
    
    // Set up toggle button when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      this.setupToggle();
      this.updateToggleIcon();
    });
  }

  getPreferredTheme() {
    // 1. Check localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved;
    }
    
    // 2. Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. Default to light
    return 'light';
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.theme = theme;
  }

  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.updateToggleIcon();
    this.updateChartTheme();  // Update Chart.js if present
  }

  setupToggle() {
    const toggleElement = document.getElementById('theme-toggle');
    if (!toggleElement) return;
    
    const isButton = toggleElement.tagName === 'BUTTON';
    
    if (isButton) {
      // Button-based toggle (profile.html)
      toggleElement.setAttribute('aria-pressed', this.theme === 'dark');
      
      toggleElement.addEventListener('click', () => {
        this.toggleTheme();
        toggleElement.setAttribute('aria-pressed', this.theme === 'dark');
      });
    } else {
      // Checkbox-based toggle (index.html)
      toggleElement.setAttribute('aria-checked', this.theme === 'dark');
      toggleElement.checked = this.theme === 'dark';
      
      toggleElement.addEventListener('change', () => {
        this.toggleTheme();
        toggleElement.setAttribute('aria-checked', this.theme === 'dark');
      });
    }
  }

  updateToggleIcon() {
    const toggleElement = document.getElementById('theme-toggle');
    if (!toggleElement) return;
    
    const isButton = toggleElement.tagName === 'BUTTON';
    
    if (isButton) {
      // Update button aria-pressed state
      toggleElement.setAttribute('aria-pressed', this.theme === 'dark');
    } else {
      // Update checkbox state
      toggleElement.setAttribute('aria-checked', this.theme === 'dark');
      toggleElement.checked = this.theme === 'dark';
    }
  }


  updateChartTheme() {
    // Update Chart.js colors if chart exists
    if (window.playerChart) {
      const isDark = this.theme === 'dark';
      const chart = window.playerChart;
      
      // Update grid colors
      if (chart.options.scales.x && chart.options.scales.x.grid) {
        chart.options.scales.x.grid.color = isDark ? '#444' : '#ddd';
      }
      if (chart.options.scales.y && chart.options.scales.y.grid) {
        chart.options.scales.y.grid.color = isDark ? '#444' : '#ddd';
      }
      
      // Update text colors
      if (chart.options.scales.x && chart.options.scales.x.ticks) {
        chart.options.scales.x.ticks.color = isDark ? '#e0e0e0' : '#333';
      }
      if (chart.options.scales.y && chart.options.scales.y.ticks) {
        chart.options.scales.y.ticks.color = isDark ? '#e0e0e0' : '#333';
      }
      
      // Update legend colors
      if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = isDark ? '#e0e0e0' : '#333';
      }
      
      // Update chart with animation matching theme transition duration (350ms)
      chart.update({
        duration: 350,
        easing: 'easeInOutQuart'
      });
    }
  }

  // Listen for system theme changes
  watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          // Only auto-switch if user hasn't set preference
          this.applyTheme(e.matches ? 'dark' : 'light');
          this.updateToggleIcon();
        }
      });
  }
}

// Initialize theme manager immediately
const themeManager = new ThemeManager();
themeManager.watchSystemTheme();
