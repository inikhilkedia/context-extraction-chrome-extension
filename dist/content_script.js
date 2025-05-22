"use strict";
(() => {
  // text_extraction.ts
  function extractVisibleText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue?.trim();
      return text ? text + " " : "";
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      let isElementVisible2 = function(el) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return !(style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true" || rect.width === 0 || rect.height === 0);
      };
      var isElementVisible = isElementVisible2;
      const element = node;
      const tagName = element.tagName.toUpperCase();
      const SKIP_TAGS = /* @__PURE__ */ new Set([
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "TEMPLATE",
        "IFRAME",
        "SVG",
        "CANVAS",
        "OBJECT",
        "EMBED",
        "META",
        "LINK"
      ]);
      const SKIP_SEMANTIC = /* @__PURE__ */ new Set(["NAV", "ASIDE", "FOOTER", "HEADER"]);
      const SKIP_ROLES = /* @__PURE__ */ new Set([
        "navigation",
        "banner",
        "complementary",
        "contentinfo",
        "search",
        "menu",
        "menubar",
        "toolbar",
        "dialog"
      ]);
      if (window.location.hostname === "mail.google.com") {
        if (element.getAttribute("role") === "navigation" || element.getAttribute("role") === "complementary" || element.classList.contains("gb_") || element.id?.startsWith("gb_")) {
          return "";
        }
        if (element.getAttribute("role") === "main" || element.classList.contains("a3s") || element.classList.contains("adn")) {
          let result2 = "";
          for (const child of Array.from(element.childNodes)) {
            result2 += extractVisibleText(child);
          }
          return result2;
        }
      }
      if (!isElementVisible2(element))
        return "";
      if (SKIP_TAGS.has(tagName))
        return "";
      if (SKIP_SEMANTIC.has(tagName))
        return "";
      if (element.hasAttribute("role") && SKIP_ROLES.has(element.getAttribute("role")))
        return "";
      let result = "";
      let prefix = "";
      let suffix = "";
      switch (tagName) {
        case "B":
        case "STRONG":
          prefix = "**";
          suffix = "**";
          break;
        case "I":
        case "EM":
          prefix = "*";
          suffix = "*";
          break;
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
          prefix = "\n#".repeat(parseInt(tagName[1])) + " ";
          suffix = "\n";
          break;
        case "A":
          const href = element.getAttribute("href");
          if (href) {
            prefix = "[";
            suffix = `](${href})`;
          }
          break;
        case "P":
          prefix = "\n";
          suffix = "\n";
          break;
        case "BR":
          prefix = "\n";
          break;
        case "LI":
          prefix = "\n\u2022 ";
          suffix = "\n";
          break;
        case "BLOCKQUOTE":
          prefix = "\n> ";
          suffix = "\n";
          break;
        case "PRE":
          prefix = "\n```\n";
          suffix = "\n```\n";
          break;
      }
      result += prefix;
      for (const child of Array.from(element.childNodes)) {
        result += extractVisibleText(child);
      }
      if (tagName === "IFRAME" && isElementVisible2(element)) {
        try {
          const iframeDoc = element.contentDocument;
          if (iframeDoc) {
            result += extractVisibleText(iframeDoc.body);
          }
        } catch (e) {
          console.warn("[TEXT_EXTRACTOR] Could not access iframe content:", e);
        }
      }
      if (element.shadowRoot) {
        for (const child of Array.from(element.shadowRoot.childNodes)) {
          result += extractVisibleText(child);
        }
      }
      result += suffix;
      const BLOCK_TAGS = /* @__PURE__ */ new Set([
        "DIV",
        "SECTION",
        "ARTICLE",
        "UL",
        "OL",
        "TABLE"
      ]);
      if (BLOCK_TAGS.has(tagName)) {
        result += "\n";
      }
      return result;
    }
    return "";
  }
  function extractTextFromElement(element) {
    if (!element) {
      console.warn("[TEXT_EXTRACTOR_CONTENT] Target element for extraction was null.");
      return "Error: Target element was null.";
    }
    let rawText = extractVisibleText(element).trim();
    rawText = rawText.replace(/\s+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\*\*{3,}/g, "**").replace(/\*{3,}/g, "*").replace(/\n\s*#/g, "\n#").replace(/\n\s*>/g, "\n>").replace(/\n\s*•/g, "\n\u2022").trim();
    const lines = rawText.split("\n").map((line) => line.trim()).filter(
      (line) => line && !/^Skip to content$/i.test(line) && !/^None selected$/i.test(line) && !/^Labels:?/i.test(line) && !/^\d+\s*–\s*\d+\s*of\s*\d+/.test(line) && !/^No conversations selected$/i.test(line) && !/^More for You$/i.test(line) && !/^Continue reading$/i.test(line) && !/^Visit (CBS|Washington Examiner|.*News)/i.test(line) && !/^WATCH LIVE:/i.test(line) && !/^Story by /i.test(line) && !/^Breaking News/i.test(line) && !/^Advertisement$/i.test(line) && !/^Sponsored$/i.test(line) && !/^Cookie Policy$/i.test(line) && !/^Privacy Policy$/i.test(line) && !/^Terms of Service$/i.test(line) && !/^Sign in$/i.test(line) && !/^Create account$/i.test(line) && !/^Settings$/i.test(line) && !/^Help$/i.test(line) && !/^Feedback$/i.test(line)
    );
    const unique = /* @__PURE__ */ new Map();
    for (const line of lines) {
      unique.set(line, (unique.get(line) || 0) + 1);
    }
    const dateRegex = /\b([A-Z][a-z]{2,8} \d{1,2})\b/;
    const grouped = /* @__PURE__ */ new Map();
    let currentGroup = "Uncategorized";
    for (const [line, count] of unique.entries()) {
      const lineWithCount = count > 1 ? `${line} [x${count}]` : line;
      const match = line.match(dateRegex);
      if (match) {
        currentGroup = match[1];
        if (!grouped.has(currentGroup))
          grouped.set(currentGroup, []);
      }
      if (!grouped.has(currentGroup))
        grouped.set(currentGroup, []);
      grouped.get(currentGroup).push(lineWithCount);
    }
    const finalText = Array.from(grouped.entries()).map(([date, lines2]) => `=== ${date} ===
${lines2.join("\n")}`).join("\n\n");
    return finalText.trim();
  }
  function extractTextFromPage() {
    return extractTextFromElement(document.body);
  }

  // content_script_main.ts
  (async () => {
    try {
      const extractedText = await extractTextFromPage();
      chrome.runtime.sendMessage(
        { type: "TEXT_EXTRACTION_RESULT", extractedText },
        (response) => {
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
        () => {
        }
      );
    }
  })();
})();
