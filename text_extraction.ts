// Enhanced and debugged text extraction logic

/**
 * Extracts visible text from a DOM node, ignoring non-visible elements and script-related tags.
 * @param node The root node to start extraction from.
 * @returns A single string of visible text content.
 */
function extractVisibleText(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.nodeValue?.trim();
		return text ? text + " " : "";
	}

	if (node.nodeType === Node.ELEMENT_NODE) {
		const element = node as HTMLElement;
		const tagName = element.tagName.toUpperCase();

		const SKIP_TAGS = new Set([
			"SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME",
			"SVG", "CANVAS", "OBJECT", "EMBED", "META", "LINK"
		]);
		const SKIP_SEMANTIC = new Set(["NAV", "ASIDE", "FOOTER", "HEADER"]);
		const SKIP_ROLES = new Set([
			"navigation", "banner", "complementary", "contentinfo",
			"search", "menu", "menubar", "toolbar", "dialog"
		]);

		// Enhanced visibility check
		function isElementVisible(el: Element): boolean {
			const style = window.getComputedStyle(el);
			const rect = el.getBoundingClientRect();
			return !(
				style.display === "none" ||
				style.visibility === "hidden" ||
				style.opacity === "0" ||
				el.hasAttribute("hidden") ||
				el.getAttribute("aria-hidden") === "true" ||
				rect.width === 0 ||
				rect.height === 0
			);
		}

		// Special handling for Gmail
		if (window.location.hostname === "mail.google.com") {
			// Skip Gmail's UI elements
			if (element.getAttribute("role") === "navigation" ||
				element.getAttribute("role") === "complementary" ||
				element.classList.contains("gb_") ||
				element.id?.startsWith("gb_")) {
				return "";
			}

			// Special handling for email content
			if (element.getAttribute("role") === "main" ||
				element.classList.contains("a3s") ||
				element.classList.contains("adn")) {
				// Process email content
				let result = "";
				for (const child of Array.from(element.childNodes)) {
					result += extractVisibleText(child);
				}
				return result;
			}
		}

		if (!isElementVisible(element)) return "";
		if (SKIP_TAGS.has(tagName)) return "";
		if (SKIP_SEMANTIC.has(tagName)) return "";
		if (element.hasAttribute("role") && SKIP_ROLES.has(element.getAttribute("role")!)) return "";

		let result = "";
		let prefix = "";
		let suffix = "";

		// Handle formatting tags
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
				prefix = "\n• ";
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

		// Process child nodes
		for (const child of Array.from(element.childNodes)) {
			result += extractVisibleText(child);
		}

		// Handle iframes if they are visible and accessible
		if (tagName === "IFRAME" && isElementVisible(element)) {
			try {
				const iframeDoc = (element as HTMLIFrameElement).contentDocument;
				if (iframeDoc) {
					result += extractVisibleText(iframeDoc.body);
				}
			} catch (e) {
				console.warn("[TEXT_EXTRACTOR] Could not access iframe content:", e);
			}
		}

		// Traverse shadow DOM if present
		if ((element as any).shadowRoot) {
			for (const child of Array.from((element as any).shadowRoot.childNodes)) {
				result += extractVisibleText(child as Node);
			}
		}

		result += suffix;

		const BLOCK_TAGS = new Set([
			"DIV", "SECTION", "ARTICLE", "UL", "OL", "TABLE"
		]);

		if (BLOCK_TAGS.has(tagName)) {
			result += "\n";
		}

		return result;
	}

	return "";
}

/**
 * This function is not exported as it's a helper for extractTextFromPage.
 * It extracts and cleans up text from a given element.
 */
function extractTextFromElement(element: Element | null): string {
	if (!element) {
		console.warn("[TEXT_EXTRACTOR_CONTENT] Target element for extraction was null.");
		return "Error: Target element was null.";
	}

	let rawText = extractVisibleText(element).trim();

	// Enhanced cleanup
	rawText = rawText
		.replace(/\s+/g, " ") // Collapse multiple spaces
		.replace(/ *\n */g, "\n") // Clean up newlines
		.replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines to 2
		.replace(/\*\*{3,}/g, "**") // Fix multiple bold markers
		.replace(/\*{3,}/g, "*") // Fix multiple italic markers
		.replace(/\n\s*#/g, "\n#") // Fix heading formatting
		.replace(/\n\s*>/g, "\n>") // Fix blockquote formatting
		.replace(/\n\s*•/g, "\n•") // Fix list item formatting
		.trim();

	const lines = rawText.split("\n").map(line => line.trim()).filter(line =>
		line &&
		!/^Skip to content$/i.test(line) &&
		!/^None selected$/i.test(line) &&
		!/^Labels:?/i.test(line) &&
		!/^\d+\s*–\s*\d+\s*of\s*\d+/.test(line) &&
		!/^No conversations selected$/i.test(line) &&
		!/^More for You$/i.test(line) &&
		!/^Continue reading$/i.test(line) &&
		!/^Visit (CBS|Washington Examiner|.*News)/i.test(line) &&
		!/^WATCH LIVE:/i.test(line) &&
		!/^Story by /i.test(line) &&
		!/^Breaking News/i.test(line) &&
		!/^Advertisement$/i.test(line) &&
		!/^Sponsored$/i.test(line) &&
		!/^Cookie Policy$/i.test(line) &&
		!/^Privacy Policy$/i.test(line) &&
		!/^Terms of Service$/i.test(line) &&
		!/^Sign in$/i.test(line) &&
		!/^Create account$/i.test(line) &&
		!/^Settings$/i.test(line) &&
		!/^Help$/i.test(line) &&
		!/^Feedback$/i.test(line)
	);

	const unique = new Map<string, number>();
	for (const line of lines) {
		unique.set(line, (unique.get(line) || 0) + 1);
	}

	const dateRegex = /\b([A-Z][a-z]{2,8} \d{1,2})\b/;
	const grouped: Map<string, string[]> = new Map();
	let currentGroup = "Uncategorized";

	for (const [line, count] of unique.entries()) {
		const lineWithCount = count > 1 ? `${line} [x${count}]` : line;
		const match = line.match(dateRegex);
		if (match) {
			currentGroup = match[1];
			if (!grouped.has(currentGroup)) grouped.set(currentGroup, []);
		}
		if (!grouped.has(currentGroup)) grouped.set(currentGroup, []);
		grouped.get(currentGroup)!.push(lineWithCount);
	}

	const finalText = Array.from(grouped.entries())
		.map(([date, lines]) => `=== ${date} ===\n${lines.join("\n")}`)
		.join("\n\n");

	return finalText.trim();
}

/**
 * Main function to extract visible text from the entire page.
 * @returns Cleaned visible text from the document body.
 */
export function extractTextFromPage(): string {
	return extractTextFromElement(document.body);
}
