// Content script - runs on all web pages
class Bumbo {
  constructor() {
    this.isEnabled = true;
    this.highlightColor = '#8B5CF6';
    this.highlightEffect = 'underline';
    this.termsData = [];
    this.termsUrl = '';
    this.highlightedElements = [];
    this.currentPopup = null;
    
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Load terms data
    await this.loadTermsData();
    
    // Start processing if enabled
    if (this.isEnabled) {
      this.processPage();
    }
    
    // Listen for page updates
    this.observePageChanges();
    
    // Listen for settings changes
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'settingsChanged') {
        this.handleSettingsChange(message.settings);
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'bumboEnabled',
        'highlightColor',
        'highlightEffect',
        'termsUrl'
      ]);
      
      this.isEnabled = result.bumboEnabled !== false; // default to true
      this.highlightColor = result.highlightColor || '#8B5CF6';
      this.highlightEffect = result.highlightEffect || 'underline';
      this.termsUrl = result.termsUrl || chrome.runtime.getURL('sample-terms.json');
    } catch (error) {
      console.error('Error loading Bumbo settings:', error);
    }
  }

  async loadTermsData() {
    try {
      const response = await fetch(this.termsUrl);
      if (response.ok) {
        this.termsData = await response.json();
      } else {
        console.error('Failed to load terms data from:', this.termsUrl);
        // Fallback to sample data
        const fallbackResponse = await fetch(chrome.runtime.getURL('sample-terms.json'));
        this.termsData = await fallbackResponse.json();
      }
    } catch (error) {
      console.error('Error loading terms data:', error);
      this.termsData = [];
    }
  }

  processPage() {
    if (!this.isEnabled || !this.termsData.length) return;
    
    // Clear existing highlights
    this.clearHighlights();
    
    // Find and highlight terms
    this.highlightTerms();
  }

  highlightTerms() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and already processed elements
          const parent = node.parentElement;
          if (!parent || 
              parent.tagName === 'SCRIPT' || 
              parent.tagName === 'STYLE' ||
              parent.classList.contains('bumbo-highlight') ||
              parent.closest('.bumbo-popup')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      this.processTextNode(textNode);
    });
  }

  processTextNode(textNode) {
    const text = textNode.textContent;
    const matches = [];

    // Find all term matches in this text node
    this.termsData.forEach(termData => {
      const regex = new RegExp(`\\b${this.escapeRegExp(termData.term)}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          term: match[0],
          data: termData
        });
      }
    });

    if (matches.length === 0) return;

    // Sort matches by position (reverse order for replacement)
    matches.sort((a, b) => b.start - a.start);

    // Create document fragment with highlighted terms
    const parent = textNode.parentNode;
    const fragment = document.createDocumentFragment();
    
    let lastEnd = text.length;
    
    matches.forEach(match => {
      // Add text after this match
      if (lastEnd > match.end) {
        fragment.insertBefore(
          document.createTextNode(text.slice(match.end, lastEnd)),
          fragment.firstChild
        );
      }
      
      // Create highlighted element
      const highlight = document.createElement('span');
      highlight.className = 'bumbo-highlight';
      highlight.textContent = match.term;
      highlight.dataset.bumboData = JSON.stringify(match.data);
      
      // Apply styling
      this.applyHighlightStyle(highlight);
      
      // Add click event
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showPopup(e.target, match.data);
      });
      
      fragment.insertBefore(highlight, fragment.firstChild);
      this.highlightedElements.push(highlight);
      
      lastEnd = match.start;
    });
    
    // Add remaining text at the beginning
    if (lastEnd > 0) {
      fragment.insertBefore(
        document.createTextNode(text.slice(0, lastEnd)),
        fragment.firstChild
      );
    }
    
    // Replace the original text node
    parent.replaceChild(fragment, textNode);
  }

  applyHighlightStyle(element) {
    if (this.highlightEffect === 'background') {
      element.style.backgroundColor = this.highlightColor;
      element.style.padding = '1px 2px';
      element.style.borderRadius = '2px';
    } else if (this.highlightEffect === 'underline') {
      element.style.textDecorationLine = 'underline';
      element.style.textDecorationStyle = 'double';
      element.style.textDecorationColor = this.highlightColor;
      element.style.textDecorationThickness = '1.5px';
      element.style.opacity = '0.8';
    } else if (this.highlightEffect === 'border') {
      element.style.border = `1px solid ${this.highlightColor}`;
      element.style.padding = '1px 2px';
      element.style.borderRadius = '2px';
    }
    
    element.style.cursor = 'pointer';
    element.style.transition = 'all 0.2s ease';
  }

  showPopup(element, termData) {
    // Close existing popup
    this.closePopup();
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'bumbo-popup';
    popup.innerHTML = this.createPopupContent(termData);
    
    // Position popup
    const rect = element.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 5}px`;
    popup.style.zIndex = '10000';
    
    // Adjust position if popup goes off screen
    document.body.appendChild(popup);
    const popupRect = popup.getBoundingClientRect();
    
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${rect.right - popupRect.width}px`;
    }
    
    if (popupRect.bottom > window.innerHeight) {
      popup.style.top = `${rect.top - popupRect.height - 5}px`;
    }
    
    this.currentPopup = popup;
    
    // Add click handlers for URLs
    popup.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(link.href, '_blank');
      });
    });
    
    // Add click handler for close button
    const closeButton = popup.querySelector('.bumbo-popup-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closePopup();
      });
    }
    
    // Close popup when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleDocumentClick.bind(this), { once: true });
    }, 100);
  }

  createPopupContent(termData) {
    let content = `
      <div class="bumbo-popup-header">
        ${termData.term}
        <button class="bumbo-popup-close" title="Close">×</button>
      </div>`;
    
    if (termData.description) {
      content += `<div class="bumbo-popup-description">${termData.description}</div>`;
    }
    
    if (termData.url) {
      content += `<div class="bumbo-popup-link"><a href="${termData.url}" target="_blank">Learn more</a></div>`;
    }
    
    // Add any additional attributes
    Object.keys(termData).forEach(key => {
      if (key !== 'term' && key !== 'description' && key !== 'url') {
        content += `<div class="bumbo-popup-attribute"><strong>${key}:</strong> ${termData[key]}</div>`;
      }
    });
    
    // Add footer
    content += `<div class="bumbo-popup-footer">Provided by Bumbo</div>`;
    
    return content;
  }

  handleDocumentClick(e) {
    if (this.currentPopup && !this.currentPopup.contains(e.target)) {
      this.closePopup();
    }
  }

  closePopup() {
    if (this.currentPopup) {
      this.currentPopup.remove();
      this.currentPopup = null;
    }
  }

  clearHighlights() {
    this.highlightedElements.forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent), element);
        parent.normalize();
      }
    });
    this.highlightedElements = [];
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldReprocess = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain text
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE || 
                (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim())) {
              shouldReprocess = true;
            }
          });
        }
      });
      
      if (shouldReprocess && this.isEnabled) {
        // Debounce reprocessing
        clearTimeout(this.reprocessTimeout);
        this.reprocessTimeout = setTimeout(() => {
          this.processPage();
        }, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  handleSettingsChange(settings) {
    this.isEnabled = settings.bumboEnabled;
    this.highlightColor = settings.highlightColor;
    this.highlightEffect = settings.highlightEffect;
    
    if (settings.termsUrl !== this.termsUrl) {
      this.termsUrl = settings.termsUrl;
      this.loadTermsData().then(() => {
        if (this.isEnabled) {
          this.processPage();
        }
      });
    } else if (this.isEnabled) {
      this.processPage();
    } else {
      this.clearHighlights();
    }
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Initialize Bumbo when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Bumbo());
} else {
  new Bumbo();
}
