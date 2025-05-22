# Text Extractor Chrome Extension

This is a simple Chrome extension that automatically extracts visible text from the current web page and displays it in a popup when the popup is opened.

## Features

-   Automatically extracts text content from the current page when the popup is opened.
-   Displays extracted text in the extension popup.
-   Provides a "Copy Text" button to easily copy the extracted content.

## Architecture Diagram

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

Build Process:
  popup.ts -----------------------> esbuild ----> dist/popup.js

  content_script_main.ts --\
                            +-----> esbuild ----> dist/content_script.js
  text_extraction.ts ------/
```

## Project Structure

-   `manifest.json`: The extension manifest file (V3).
-   `popup.html`: The HTML for the extension's popup.
-   `popup.ts`: The TypeScript logic for the popup (handles automatic extraction, messaging, and copy functionality).
-   `content_script_main.ts`: Entry point for the content script; imports extraction logic and sends result to popup.
-   `text_extraction.ts`: Core TypeScript module for extracting text from a DOM element.
-   `tsconfig.json`: TypeScript compiler configuration.
-   `package.json`: Project metadata and scripts (e.g., for building TypeScript with esbuild).
-   `dist/`: (Generated directory) Contains the compiled JavaScript files (`popup.js`, `content_script.js`).
-   `images/`: Contains placeholder icons for the extension.

## Setup and Building

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

    This will install `typescript`, `esbuild`, and `@types/chrome`.

2.  **Build the Extension:**
    To compile and bundle the TypeScript files into the `dist` directory using `esbuild`:
    ```bash
    npm run build
    ```
    Or, to watch for changes and rebuild automatically:
    ```bash
    npm run watch
    ```

## Loading the Extension in Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" using the toggle switch in the top right corner.
3.  Click the "Load unpacked" button.
4.  Select the root directory of this project (the one containing `manifest.json`).

The extension icon should appear in your Chrome toolbar.

## How it Works

-   The `manifest.json` defines the popup (`popup.html`) and requests `activeTab`, `scripting`, and `clipboardWrite` permissions.
-   When the popup (`popup.html`) is opened, `popup.ts` (compiled to `dist/popup.js`) automatically triggers the text extraction process.
-   `popup.ts` uses `chrome.scripting.executeScript` to inject `dist/content_script.js` (which is a bundle of `content_script_main.ts` and its import `text_extraction.ts`) into the active tab.
-   The injected `dist/content_script.js` runs in the context of the web page. `content_script_main.ts` logic calls `simplifiedExtractTextFromPage()` from `text_extraction.ts` and then uses `chrome.runtime.sendMessage` to send the extracted text back to `popup.ts`.
-   `popup.ts` has a `chrome.runtime.onMessage` listener that receives this text and displays it in the textarea within the popup. It also enables a "Copy Text" button.
-   The "Copy Text" button uses `navigator.clipboard.writeText` (with a fallback to `document.execCommand('copy')`) to copy the text to the clipboard.
