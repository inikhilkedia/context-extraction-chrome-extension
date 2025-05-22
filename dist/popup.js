// popup.ts
document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.getElementById("copyButton");
  const extractedTextElement = document.getElementById("extractedText");
  const multiTabButton = document.getElementById("multiTabButton");
  const loadingElement = document.querySelector(".loading");
  const errorElement = document.querySelector(".error-message");
  const statusText = document.getElementById("statusText");
  const charCount = document.getElementById("charCount");
  function showLoading(show) {
    loadingElement.classList.toggle("active", show);
    multiTabButton.disabled = show;
  }
  function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.add("active");
    setTimeout(() => {
      errorElement.classList.remove("active");
    }, 5e3);
  }
  function updateStatus(message) {
    statusText.textContent = message;
  }
  function updateCharCount(text) {
    const count = text.length;
    charCount.textContent = `${count.toLocaleString()} character${count !== 1 ? "s" : ""}`;
  }
  if (multiTabButton) {
    multiTabButton.addEventListener("click", extractFromAllTabs);
  }
  async function extractFromAllTabs() {
    showLoading(true);
    updateStatus("Extracting from all tabs...");
    extractedTextElement.value = "";
    copyButton.disabled = true;
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
      const results = await Promise.all(
        tabs.map((tab) => {
          return new Promise((resolve) => {
            if (!tab.id)
              return resolve({ tab, text: null });
            chrome.scripting.executeScript(
              { target: { tabId: tab.id }, files: ["dist/content_script.js"] },
              () => {
                if (chrome.runtime.lastError) {
                  console.warn(`Injection failed for tab ${tab.id}:`, chrome.runtime.lastError.message);
                  return resolve({ tab, text: null });
                }
                const handler = (msg, sender) => {
                  if (sender.tab?.id === tab.id && msg.type === "TEXT_EXTRACTION_RESULT") {
                    chrome.runtime.onMessage.removeListener(handler);
                    resolve({ tab, text: msg.extractedText || "" });
                  }
                };
                chrome.runtime.onMessage.addListener(handler);
              }
            );
          });
        })
      );
      const combinedText = results.filter((r) => r.text).map((r) => `=== Tab: ${r.tab.title} ===
${r.text}`).join("\n\n");
      extractedTextElement.value = combinedText || "No text extracted from any tabs.";
      extractedTextElement.placeholder = combinedText ? "Extraction complete." : "Nothing to show.";
      copyButton.disabled = !combinedText;
      updateCharCount(combinedText);
      updateStatus("Extraction complete");
    } catch (error) {
      console.error("Error in extractFromAllTabs:", error);
      showError(`Failed to extract from all tabs: ${error instanceof Error ? error.message : String(error)}`);
      updateStatus("Extraction failed");
    } finally {
      showLoading(false);
    }
  }
  async function triggerExtraction() {
    showLoading(true);
    updateStatus("Extracting text...");
    extractedTextElement.value = "";
    copyButton.disabled = true;
    copyButton.textContent = "Copy Text";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["dist/content_script.js"]
        });
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      } else {
        throw new Error("No active tab found");
      }
    } catch (error) {
      console.error("Error in triggerExtraction:", error);
      showError(`Extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      updateStatus("Extraction failed");
      showLoading(false);
    }
  }
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TEXT_EXTRACTION_RESULT") {
      showLoading(false);
      if (request.extractedText !== void 0 && request.extractedText !== null) {
        extractedTextElement.value = request.extractedText;
        extractedTextElement.placeholder = "Text extracted.";
        copyButton.disabled = false;
        updateCharCount(request.extractedText);
        updateStatus("Extraction complete");
        sendResponse({ status: "success", message: "Text received" });
      } else {
        extractedTextElement.value = "Received empty text from page.";
        extractedTextElement.placeholder = "No text found or error in page script.";
        copyButton.disabled = true;
        updateStatus("No text found");
        showError("No text was extracted from the page");
        sendResponse({ status: "error", message: "Empty text received" });
      }
    } else {
      console.warn("[TEXT_EXTRACTOR_POPUP] Received unknown message type:", request.type);
      sendResponse({ status: "error", message: "Unknown message type" });
    }
    return true;
  });
  if (copyButton) {
    copyButton.disabled = true;
    copyButton.addEventListener("click", async () => {
      try {
        extractedTextElement.focus();
        extractedTextElement.select();
        const textToCopy = extractedTextElement.value;
        if (textToCopy) {
          await navigator.clipboard.writeText(textToCopy);
          copyButton.textContent = "Copied!";
          updateStatus("Text copied to clipboard");
          setTimeout(() => {
            copyButton.textContent = "Copy Text";
          }, 2e3);
        }
      } catch (error) {
        console.error("Error copying text:", error);
        showError("Failed to copy text to clipboard");
      }
    });
  }
  triggerExtraction();
});
