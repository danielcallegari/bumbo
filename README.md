# Bumbo

A browser extension for Chrome Browser
Enhances a web page by providing additional information on a list of terms.

## Features
- **Automatic Detection**: Invoked when a web page finishes loading or when it is updated
- **Term Highlighting**: Searches for occurrences of specific terms in a list (e.g. "JavaScript", "Python", "API", "database")
- **Rich Information**: Each term can have multiple attributes such as description, URL, category, etc.
- **Case Insensitive**: Search is not case-sensitive
- **Visual Highlighting**: All found occurrences are highlighted with customizable colors and effects
- **Interactive Popups**: Click highlighted terms to see a popup with additional information
  - URLs in popups open in new browser tabs
- **User Configuration**:
  - On/off switch
  - Highlight color and effect customization
  - Configurable source for terms list
  - Support for custom JSON files with terms and attributes
  - Includes sample JSON file with programming-related terms

## Installation

1. **Load in Chrome**: 
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the bumbo folder
2. **Test**: Open `test-page.html` in Chrome to verify the extension works

## Usage

1. **Enable Extension**: Click the Bumbo icon in your browser toolbar to access settings
2. **Configure Terms**: Use the default sample terms or provide a URL to your custom JSON file
3. **Customize Appearance**: Choose highlight colors and effects in the settings popup
4. **Browse**: Visit any webpage - terms will be automatically highlighted
5. **Learn**: Click highlighted terms to see detailed information in popups

## JSON Terms Format

Create a JSON array with term objects:

```json
[
  {
    "term": "JavaScript",
    "description": "A programming language for web development",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "category": "Programming Language"
  }
]
```

## Development

See `DEVELOPMENT.md` for detailed development instructions, API documentation, and contribution guidelines.

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main functionality (term detection and highlighting)
- `content.css` - Styling for highlights and popups
- `popup.html/js` - Settings interface
- `sample-terms.json` - Default terms database
- `test-page.html` - Test page for development

(c) Daniel Callegari, July 2025
