// Popup script for Bumbo extension settings
class BumboPopup {
  constructor() {
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();
    
    // Bind event listeners
    this.bindEvents();
    
    // Update UI
    this.updateColorPreview();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'bumboEnabled',
        'highlightColor',
        'highlightEffect',
        'termsUrl'
      ]);
      
      // Set default values and update UI
      const enabled = result.bumboEnabled !== false; // default to true
      const highlightColor = result.highlightColor || '#8B5CF6';
      const highlightEffect = result.highlightEffect || 'underline';
      const termsUrl = result.termsUrl || '';
      
      document.getElementById('enableToggle').classList.toggle('active', enabled);
      document.getElementById('highlightColor').value = highlightColor;
      document.getElementById('highlightEffect').value = highlightEffect;
      document.getElementById('termsUrl').value = termsUrl;
      
      this.updateColorPreview();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  bindEvents() {
    // Enable/disable toggle
    document.getElementById('enableToggle').addEventListener('click', () => {
      const toggle = document.getElementById('enableToggle');
      toggle.classList.toggle('active');
    });
    
    // Color picker
    document.getElementById('highlightColor').addEventListener('input', () => {
      this.updateColorPreview();
    });
    
    // Test URL button
    document.getElementById('testUrl').addEventListener('click', () => {
      this.testTermsUrl();
    });
    
    // Reset to sample button
    document.getElementById('resetToSample').addEventListener('click', () => {
      document.getElementById('termsUrl').value = '';
      this.showStatus('Reset to sample terms', 'success');
    });
    
    // Save settings button
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });
  }

  updateColorPreview() {
    const color = document.getElementById('highlightColor').value;
    document.getElementById('colorPreview').style.backgroundColor = color;
  }

  async testTermsUrl() {
    const url = document.getElementById('termsUrl').value.trim();
    
    if (!url) {
      this.showStatus('Please enter a URL to test', 'error');
      return;
    }
    
    try {
      this.showStatus('Testing URL...', 'info');
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('URL must return a JSON array');
      }
      
      // Validate structure
      const validTerms = data.filter(term => 
        typeof term === 'object' && 
        term !== null && 
        typeof term.term === 'string' && 
        term.term.trim() !== ''
      );
      
      if (validTerms.length === 0) {
        throw new Error('No valid terms found. Each term must have a "term" property.');
      }
      
      this.showStatus(`✓ URL is valid. Found ${validTerms.length} terms.`, 'success');
    } catch (error) {
      this.showStatus(`✗ URL test failed: ${error.message}`, 'error');
    }
  }

  async saveSettings() {
    try {
      const settings = {
        bumboEnabled: document.getElementById('enableToggle').classList.contains('active'),
        highlightColor: document.getElementById('highlightColor').value,
        highlightEffect: document.getElementById('highlightEffect').value,
        termsUrl: document.getElementById('termsUrl').value.trim() || chrome.runtime.getURL('sample-terms.json')
      };
      
      await chrome.storage.sync.set(settings);
      
      // Notify content scripts of the change
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'settingsChanged',
          settings: settings
        }).catch(() => {
          // Ignore errors if content script is not ready
        });
      }
      
      this.showStatus('✓ Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('✗ Error saving settings', 'error');
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BumboPopup();
});
