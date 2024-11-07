import { SearchCursor } from "@codemirror/search";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { highlightMark } from "src/editor-extension";
import { KeywordHighlighterPlugin } from "src/keyword-highlighter-plugin";
import type { KeywordStyle } from "src/shared";

// Type definition for a new decoration to be added
type NewDecoration = { from: number; to: number; decoration: Decoration };

/**
 * Splits text into words using simple delimiters
 */
function splitIntoWords(text: string): Array<{ word: string; index: number }> {
  const result: Array<{ word: string; index: number }> = [];
  let currentWord = '';
  let currentWordStart = 0;

  // Define delimiters
  const delimiters = [' ', ',', '.', ';', '\n', '\t'];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (delimiters.includes(char)) {
      if (currentWord.trim().length > 0) {
        result.push({
          word: currentWord.trim(),
          index: currentWordStart
        });
      }
      currentWord = '';
      currentWordStart = i + 1;
    } else {
      if (currentWord.length === 0) {
        currentWordStart = i;
      }
      currentWord += char;
    }
  }

  // Add the last word if it exists
  if (currentWord.trim().length > 0) {
    result.push({
      word: currentWord.trim(),
      index: currentWordStart
    });
  }

  return result;
}

/**
 * EditorHighlighter class implements the PluginValue interface
 * It manages the highlighting of keywords in a CodeMirror editor
 */
export class EditorHighlighter implements PluginValue {
  // Stores the current set of decorations (highlights) in the editor
  decorations: DecorationSet;

  /**
   * Constructor initializes the decorations for the given editor view
   * @param view - The CodeMirror EditorView instance
   */
  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  /**
   * Update method is called when the editor view is updated
   * It rebuilds the decorations if the document or viewport has changed
   * @param update - The ViewUpdate object containing information about the update
   */
  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  /**
   * Builds the complete set of decorations for the current editor state
   * @param view - The current EditorView
   * @returns A DecorationSet containing all keyword highlights
   */
  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const newDecorations: NewDecoration[] = [];

    // Iterate over each keyword in the settings
    KeywordHighlighterPlugin.settings.keywords
      .filter((keyword) => !!keyword.keyword)
      .forEach((k) => {
        if (!k.isRegex) {
          // Handle plain keyword
          newDecorations.push(...this.buildDecorationsForKeyword(view, k));
        } else {
          // Handle regex keyword
          newDecorations.push(...this.buildDecorationsForKeywordRegex(view, k));
        }
      });

    // Sort decorations by their starting position to optimize rendering
    newDecorations.sort((a, b) => a.from - b.from);

    // Add sorted decorations to the builder
    newDecorations.forEach((d) => builder.add(d.from, d.to, d.decoration));

    return builder.finish();
  }

  /**
   * Builds decorations for a single regex keyword throughout the document
   * @param view - The current EditorView
   * @param keyword - The KeywordStyle object containing the regex pattern and its style
   * @returns An array of NewDecoration objects for the given regex keyword
   */
  buildDecorationsForKeywordRegex(
    view: EditorView,
    keyword: KeywordStyle
  ): NewDecoration[] {
    const newDecorations: NewDecoration[] = [];

    try {
      // Get the full document text
      const text = view.state.doc.toString();

      // Split text into words with their positions
      const words = splitIntoWords(text);

      // Create regex for matching
      const regex = new RegExp(`${keyword.keyword}`, "giu");

      // Process each word
      words.forEach(({ word, index }) => {
        // Reset regex state
        regex.lastIndex = 0;

        if (regex.test(word)) {
          newDecorations.push({
            from: index,
            to: index + word.length,
            decoration: highlightMark(keyword),
          });
        }
      });
    } catch (e) {
      console.error("Invalid regular expression:", keyword.keyword, e);
      // Optionally, you can handle invalid regex patterns here
    }

    return newDecorations;
  }

  /**
   * Builds decorations for a single keyword throughout the document
   * @param view - The current EditorView
   * @param keyword - The KeywordStyle object containing the keyword and its style
   * @returns An array of NewDecoration objects for the given keyword
   */
  buildDecorationsForKeyword(
    view: EditorView,
    keyword: KeywordStyle
  ): NewDecoration[] {
    const newDecorations: NewDecoration[] = [];
    const text = view.state.doc.toString();

    // Split text into words with their positions
    const words = splitIntoWords(text);
    const searchText = keyword.keyword.toLowerCase();

    // Process each word
    words.forEach(({ word, index }) => {
      if (word.toLowerCase() === searchText) {
        newDecorations.push({
          from: index,
          to: index + word.length,
          decoration: highlightMark(keyword),
        });
      }
    });

    return newDecorations;
  }
}

/**
 * Creates a ViewPlugin from the EditorHighlighter class
 * This plugin manages the keyword highlighting in the editor
 */
export const editorHighlighter = ViewPlugin.fromClass(EditorHighlighter, {
  decorations: (value: EditorHighlighter) => value.decorations,
});
