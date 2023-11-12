import { SearchCursor } from "@codemirror/search";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { KeywordStyle, highlightMark } from "src/editor-extension";
import { KeywordHighlighterPlugin } from "src/keyword-highlighter-plugin";

type NewDecoration = { from: number; to: number; decoration: Decoration };

export class KeywordHighlighter implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const newDecorations: NewDecoration[] = [];

    KeywordHighlighterPlugin.settings.keywords.forEach((k) =>
      newDecorations.push(...this.buildDecorationsForKeyword(view, k))
    );
    newDecorations.sort((a, b) => a.from - b.from);
    newDecorations.forEach((d) => builder.add(d.from, d.to, d.decoration));

    return builder.finish();
  }

  buildDecorationsForKeyword(
    view: EditorView,
    keyword: KeywordStyle
  ): NewDecoration[] {
    const newDecorations: NewDecoration[] = [];
    const cursor = new SearchCursor(view.state.doc, `${keyword.keyword}:`);
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

export const keywordHighlighter = ViewPlugin.fromClass(KeywordHighlighter, {
  decorations: (value: KeywordHighlighter) => value.decorations,
});