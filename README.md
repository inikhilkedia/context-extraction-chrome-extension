# Context Extraction Chrome Extension

A Chrome extension that intelligently extracts and formats text content from web pages, with special handling for Gmail and various content types.

## Architecture

```
+-------------+     +-------------+     +----------------------+
| Popup UI    | --> | Popup Logic | --> | Chrome Scripting API |
+-------------+     +-------------+     +----------------------+
      ^                                           |
      | (Display Text)                            | (Injects Script)
      |                                           v
      |                                        +----------------------+
      | (Message:                              | Target Web Page      |
      |  Extracted Text)                       |                      |
      |                                        |  +-----------------+ |
      +---------- chrome.runtime.onMessage <---|  | Content Script  | |
                                             |  +-----------------+ |
                  Runtime Messaging          |          |           |
                  (sendMessage)              |          v           |
                                             |    Extract Text      |
                                             +----------------------+
```

## Text Extraction Process

```
+------------------+     +------------------+     +------------------+
| DOM Traversal    | --> | Content Filtering| --> | Text Formatting  |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
| Skip Hidden      |     | Remove UI        |     | Apply Markdown   |
| Elements         |     | Elements         |     | Formatting       |
+------------------+     +------------------+     +------------------+
```

## Build Process

```
popup.ts -----------------------> esbuild ----> dist/popup.js

content_script_main.ts --\
                          +-----> esbuild ----> dist/content_script.js
text_extraction.ts ------/
```

## Features

- Extracts visible text content while ignoring non-visible elements
- Special handling for Gmail interface and email content
- Preserves text formatting (bold, italic, headings, etc.)
- Handles links, lists, blockquotes, and code blocks
- Processes iframe content when accessible
- Traverses shadow DOM elements
- Groups content by dates when available
- Removes common UI elements and advertisements
- Maintains proper spacing and formatting

## Technical Details

The extension uses advanced DOM traversal techniques to:

- Skip non-visible elements and script-related tags
- Handle semantic HTML elements appropriately
- Process ARIA roles for accessibility
- Format text with Markdown-style syntax
- Clean up and deduplicate content
- Group content chronologically

## Project Structure

```
├── manifest.json           # Extension manifest (V3)
├── popup.html             # Extension popup UI
├── popup.ts              # Popup logic and messaging
├── content_script_main.ts # Content script entry point
├── text_extraction.ts    # Core text extraction logic
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project metadata and scripts
├── dist/                 # Compiled JavaScript files
└── images/              # Extension icons
```

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Development Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Build the Extension:**

   ```bash
   npm run build
   ```

   For development with auto-rebuild:

   ```bash
   npm run watch
   ```

## Usage

1. Navigate to any webpage
2. Click the extension icon
3. The extracted text will be formatted and displayed

## Special Features

### Gmail Support

- Intelligently handles Gmail's interface
- Extracts email content while ignoring UI elements
- Preserves email formatting and structure

### Content Filtering

- Removes common UI elements like:
  - Navigation menus
  - Advertisements
  - Cookie notices
  - Sign-in prompts
  - Footer content

### Text Formatting

- Preserves:
  - Bold text (`**text**`)
  - Italic text (`*text*`)
  - Headings (`# Heading`)
  - Links (`[text](url)`)
  - Lists (`• item`)
  - Blockquotes (`> quote`)
  - Code blocks (`code`)

## Development

The extension is written in TypeScript and uses modern DOM APIs for content extraction.

## License

[Add your license information here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
