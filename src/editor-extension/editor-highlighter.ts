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

    // Build decorations for each non-empty keyword in the settings
    KeywordHighlighterPlugin.settings.keywords
      .filter((keyword) => !!keyword.keyword)
      .forEach((k) =>
        newDecorations.push(...this.buildDecorationsForKeyword(view, k))
      );

    // Sort decorations by their starting position
    newDecorations.sort((a, b) => a.from - b.from);

    // Add sorted decorations to the builder
    newDecorations.forEach((d) => builder.add(d.from, d.to, d.decoration));

    return builder.finish();
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

    // Create a search cursor for the keyword
    const cursor = new SearchCursor(view.state.doc, `${keyword.keyword}`);

    // Find all occurrences of the keyword in the document
    cursor.next();
    while (!cursor.done) {
      newDecorations.push({
        from: cursor.value.from,
        to: cursor.value.to,
        decoration: highlightMark(keyword),
      });
      cursor.next();
    }
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
