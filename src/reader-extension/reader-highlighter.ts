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

/**
 * Splits text into words considering UTF-8 characters
 * Uses Unicode properties to identify letters and numbers across different scripts
 */
function splitIntoWords(text: string): string[] {
  const splitWords = text.split(/[ ,.;\n\t]/);
  const filteredWords = splitWords.filter(word => word.trim().length > 0);
  const trimmedWords = filteredWords.map(word => word.trim());
  return trimmedWords;
}


function replaceWithHighlightRegex(node: Node, keyword: KeywordStyle) {
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    (<Element>node).classList.contains("kh-highlighted")
  ) {
    return;
  } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
    try {
      const text = node.nodeValue;
      const words = splitIntoWords(text);
      const regex = new RegExp(`${keyword.keyword}`, "giu");

      // Find all matching words and their positions in original text
      const matches: { word: string; index: number }[] = [];
      words.forEach(word => {

        // Need to reset regex lastIndex since we're reusing it
        regex.lastIndex = 0;

        if (regex.test(word)) {

          const startSearchIndex = matches.length > 0 ?
            matches[matches.length - 1].index + matches[matches.length - 1].word.length :
            0;

          const wordIndex = text.indexOf(word, startSearchIndex);

          if (wordIndex !== -1) {
            matches.push({ word, index: wordIndex });
          }
        }
      });

      if (matches.length > 0) {
        const parent = node.parentNode!;
        let lastIndex = 0;

        matches.forEach(({ word, index }) => {
          if (index > lastIndex) {
            const beforeText = text.substring(lastIndex, index);
            parent.insertBefore(
              document.createTextNode(beforeText),
              node
            );
          }

          const highlight = getHighlightNode(parent, word, keyword);
          parent.insertBefore(highlight, node);

          lastIndex = index + word.length;
        });

        if (lastIndex < text.length) {
          const remainingText = text.substring(lastIndex);
          parent.insertBefore(
            document.createTextNode(remainingText),
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
    const nodeText = node.nodeValue;

    // Find the index using case-insensitive comparison
    const index = nodeText.toLowerCase().indexOf(searchText.toLowerCase());

    // If the keyword is found in the text node
    if (index > -1) {
      // Parent cannot be null, so we use non-null assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parent = node.parentNode!;

      // Get the actual matched text from the original string to preserve original case
      const matchedText = nodeText.substring(index, index + searchText.length);

      // Split the text node into before, highlight, and after parts
      const beforeText = nodeText.substring(0, index);
      const afterText = nodeText.substring(index + searchText.length);
      const highlight = getHighlightNode(parent, matchedText, keyword);

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
