import KeywordHighlighterPlugin from "main";
import type { MarkdownPostProcessor } from "obsidian";
import { type KeywordStyle, getCssClasses } from "src/shared";

export const readerHighlighter: MarkdownPostProcessor = (el: HTMLElement) => {
  KeywordHighlighterPlugin.settings.keywords
    .filter((keyword) => !!keyword.keyword)
    .forEach(
      (keyword) => {
        if (!keyword.isRegex) {
          replaceWithHighlight(el, keyword)
        } else {
          replaceWithHighlightRegex(el, keyword)
        }
      }
    );
};

function replaceWithHighlightRegex(node: Node, keyword: KeywordStyle) {
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    (<Element>node).classList.contains("kh-highlighted")
  ) {
    return;
  } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
    try {
      const regex = new RegExp(`\\b(${keyword.keyword})\\b`, "giu");
      const text = node.nodeValue;
      const matches = Array.from(text.matchAll(regex));

      if (matches.length > 0) {
        // Parent cannot be null, so we use non-null assertion
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const parent = node.parentNode!;
        let lastIndex = 0;

        matches.forEach((match) => {
          const matchedWord = match[1];
          const index = match.index!;

          if (index > lastIndex) {
            parent.insertBefore(
              document.createTextNode(text.substring(lastIndex, index)),
              node
            );
          }

          const highlight = getHighlightNode(parent, matchedWord, keyword);
          parent.insertBefore(highlight, node);

          lastIndex = index + matchedWord.length;
        });

        if (lastIndex < text.length) {
          parent.insertBefore(
            document.createTextNode(text.substring(lastIndex)),
            node
          );
        }

        parent.removeChild(node);
      }
    } catch (e) {
      console.error("Invalid regular expression:", keyword.keyword, e);
    }
    return;
  }
  // If the node is not a text node, recursively process its children
  node.childNodes.forEach((child) => replaceWithHighlightRegex(child, keyword));
}

/**
 * Replaces occurrences of a keyword in a DOM node with highlighted versions.
 * @param node - The DOM node to search for keywords
 * @param keyword - The keyword style object containing the keyword and styling information
 */
function replaceWithHighlight(node: Node, keyword: KeywordStyle) {
  // Skip nodes that are already highlighted
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    (<Element>node).classList.contains("kh-highlighted")
  ) {
    return;
  } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
    const searchText = `${keyword.keyword}`;
    const index = node.nodeValue.indexOf(searchText);

    // If the keyword is found in the text node
    if (index > -1) {
      // Parent cannot be null, so we use non-null assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parent = node.parentNode!;

      // Split the text node into before, highlight, and after parts
      const beforeText = node.nodeValue.substring(0, index);
      const afterText = node.nodeValue.substring(index + searchText.length);
      const highlight = getHighlightNode(parent, searchText, keyword);

      // Insert the new nodes in the correct order
      parent.insertBefore(document.createTextNode(beforeText), node);
      parent.insertBefore(highlight, node);
      node.nodeValue = afterText;

      // Recursively call the function on all child nodes to find all keyword occurrences
      parent.childNodes.forEach((child) =>
        replaceWithHighlight(child, keyword)
      );
    }

    return;
  }

  // If the node is not a text node, recursively process its children
  node.childNodes.forEach((child) => replaceWithHighlight(child, keyword));
}

/**
 * Creates a highlighted span element for the given keyword.
 * @param parent - The parent node to create the span element in
 * @param searchText - The text to be highlighted
 * @param keyword - The keyword style object containing styling information
 * @returns The created highlight node
 */
function getHighlightNode(
  parent: Node,
  searchText: string,
  keyword: KeywordStyle
): Node {
  // Create a new span element
  const highlight = parent.createSpan();

  // Add CSS classes to the highlight element
  highlight.classList.add(...getCssClasses(keyword).split(" "));

  // Apply custom color if specified
  const showColor = keyword.showColor ?? true;
  if (showColor) {
    highlight.style.setProperty("--kh-c", keyword.color);
  }

  // Apply custom background color if specified
  const showBackgroundColor = keyword.showBackgroundColor ?? true;
  if (showBackgroundColor) {
    highlight.style.setProperty("--kh-bgc", keyword.backgroundColor);
  }

  // Set the text content of the highlight element
  highlight.setText(searchText);

  return highlight;
}
