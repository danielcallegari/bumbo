# Bumbo Browser Extension - Development Guide

## Project Structure

```
bumbo/
├── manifest.json          # Extension manifest file
├── content.js            # Main content script
├── content.css           # Styles for highlights and popups
├── popup.html            # Settings popup UI
├── popup.js              # Settings popup functionality
├── sample-terms.json     # Default terms database
└── README.md             # Project documentation
```

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `bumbo` folder
5. The extension should now appear in your extensions list

## How It Works

1. Visit any webpage with text content
2. The extension automatically highlights configured terms
3. Click highlighted terms to see popup information
4. Access settings through the extension popup

## Features

- **Term Highlighting**: Automatically finds and highlights terms on web pages
- **Interactive Popups**: Click highlighted terms for detailed information
- **Custom Terms**: Load your own terms from JSON files
- **Highlight Styles**: Choose between background, underline, or border styles
- **Color Customization**: Pick any highlight color
- **Toggle On/Off**: Enable/disable the extension easily

## Terms Format

The extension uses JSON arrays with term objects:

```json
[
  {
    "term": "JavaScript",
    "description": "A programming language for web development",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
  }
]
```

**Required**: `term` field
**Optional**: `description`, `url`, and any custom fields

## Troubleshooting

### Extension Not Working
- Verify manifest.json is valid
- Check browser console for errors
- Ensure extension is enabled

### Terms Not Highlighting
- Check extension is enabled in popup
- Verify JSON format is correct
- Test with the included sample terms

### Popup Issues
- Check popup.html loads without errors
- Verify chrome.storage permissions

## Customization

- **New highlight styles**: Edit `applyHighlightStyle()` in `content.js`
- **Popup appearance**: Modify styles in `content.css`
- **New settings**: Update `popup.html` and `popup.js`

## License

(c) Daniel Callegari, July 2025
