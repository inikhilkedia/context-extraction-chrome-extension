/// <reference types="chrome" />

// content_script_main.ts - Entry point for the content script.

// Assuming text_extraction.ts is compiled to text_extraction.js in the same output directory (dist/)
// esbuild should handle resolving this import correctly during bundling.
import { extractTextFromPage } from "./text_extraction.js";

(async () => {
	try {
		const extractedText = await extractTextFromPage();
		chrome.runtime.sendMessage(
			{ type: "TEXT_EXTRACTION_RESULT", extractedText },
			response => {
				if (chrome.runtime.lastError) {
					console.error(
						"[CONTENT_SCRIPT_MAIN] Error sending message to popup:",
						chrome.runtime.lastError.message
					);
				}
			}
		);
	} catch (error) {
		console.error("[CONTENT_SCRIPT_MAIN] Text extraction failed:", error);
		chrome.runtime.sendMessage(
			{ type: "TEXT_EXTRACTION_RESULT", extractedText: "ERROR: Extraction failed." },
			() => { }
		);
	}
})();
