import KeywordHighlighterPlugin from "main";
import {App, Modal, Notice, PluginSettingTab} from "obsidian";
import { type KeywordStyle } from "src/shared";
import { generateInitialColors } from "./generate-initial-colors";
import SettingTabComponent from "./SettingTab.svelte";

export class SettingTab extends PluginSettingTab {
  plugin: KeywordHighlighterPlugin;
  component?: SettingTabComponent;

  constructor(app: App, plugin: KeywordHighlighterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    this.component = new SettingTabComponent({
      target: containerEl,
      props: {
        keywords: KeywordHighlighterPlugin.settings.keywords,
      },
    });
    this.component.$on("addKeyword", () =>
      this.addKeywordSetting(containerEl)
    );
    this.component.$on("removeKeyword", (event) =>
      this.#removeKeywordSetting(event.detail.keyword)
    );
    this.component.$on("update", () => this.#updateComponent());

    this.component.$on("importSettings", () =>
      this.importSettings(containerEl)
    );
    this.component.$on("exportSettings", () =>
      this.exportSettings(containerEl)
    );
  }

  importSettings(container: HTMLElement, value?: string): void {
    // Create a new Modal instance
    new (class extends Modal {
      constructor(app: App) {
        super(app);
      }

      onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Import Keyword Settings" });

        // Create a textarea for users to paste their JSON data
        const textarea = contentEl.createEl("textarea", {
          placeholder: "Paste your keyword settings JSON here...",
     //     style: "width: 100%; height: 300px;",
        });

        // Add an import button
        const importButton = contentEl.createEl("button", { text: "Import Settings" });
        importButton.addEventListener("click", () => {
          const inputData = textarea.value.trim();
          if (!inputData) {
            new Notice("Please paste valid JSON data.");
            return;
          }

          try {
            const parsedData: KeywordStyle[] = JSON.parse(inputData);

            // Validate the parsed data
            if (!Array.isArray(parsedData)) {
              throw new Error("Invalid format: Expected an array of keyword styles.");
            }

            // Optional: Add more validation for each KeywordStyle object
            parsedData.forEach((item, index) => {
              if (typeof item.keyword !== "string" || typeof item.color !== "string" || typeof item.backgroundColor !== "string") {
                throw new Error(`Invalid keyword style at index ${index}.`);
              }
            });

            // Update the plugin settings
            KeywordHighlighterPlugin.settings.keywords = parsedData;
           // KeywordHighlighterPlugin.settings.saveSettings().then(() => {
              this.close();
        //      KeywordHighlighterPlugin.settingTab.#updateComponent();
        //      new Notice("Keyword settings imported successfully!");
        //    });
          } catch (error) {
            new Notice(`Failed to import settings: ${(error as Error).message}`);
          }
        });

        // Add a close button
        const closeButton = contentEl.createEl("button", {
          text: "Close",
   //       style: "margin-left: 10px;"
        });
        closeButton.addEventListener("click", () => this.close());
      }

      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    })(this.app).open();
  }

  exportSettings(container: HTMLElement, value?: string): void {
    // Create a new Modal instance
    new (class extends Modal {
      constructor(app: App) {
        super(app);
      }

      onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Export Keyword Settings" });

        // Serialize the keywords to JSON
        const data = JSON.stringify(KeywordHighlighterPlugin.settings.keywords, null, 2);

      //  Create a read-only textarea with the JSON data
        // @ts-ignore
        contentEl.createEl("textarea", {
          value: data,
     //     style: "width: 100%; height: 300px;",
     //     readonly: true,
        });

        // Add a button to copy the JSON to clipboard
        const copyButton = contentEl.createEl("button", { text: "Copy to Clipboard" });
        copyButton.addEventListener("click", () => {
          navigator.clipboard.writeText(data).then(() => {
            new Notice("Settings copied to clipboard!");
          }).catch(() => {
            new Notice("Failed to copy settings.");
          });
        });

        // Add a close button
        const closeButton = contentEl.createEl("button", {
          text: "Close",
     //     style: "margin-left: 10px;"
        });
        closeButton.addEventListener("click", () => this.close());
      }

      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    })(this.app).open();
  }

  addKeywordSetting(container: HTMLElement, value?: string): void {
    const [foregroundColor, backgroundColor] = generateInitialColors(container);
    KeywordHighlighterPlugin.settings.keywords.push({
      keyword: value ?? "",
      color: foregroundColor.toHex(),
      backgroundColor: backgroundColor.toHex(),
      fontModifiers: [],
      showColor: true,
      showBackgroundColor: true,
      isRegex: false
    });
    this.#updateComponent();
  }

  #removeKeywordSetting(keyword: KeywordStyle): void {
    // remove the keyword from settings
    const i = KeywordHighlighterPlugin.settings.keywords.indexOf(keyword);
    if (i > -1) {
      KeywordHighlighterPlugin.settings.keywords.splice(i, 1);
      this.#updateComponent();
    }
  }

  #updateComponent(): void {
    // we need to refresh the keywords input to update the component
    this.component?.$set({
      keywords: KeywordHighlighterPlugin.settings.keywords,
    });
  }

  async hide(): Promise<void> {
    // remove empty keywords
    KeywordHighlighterPlugin.settings.keywords =
      KeywordHighlighterPlugin.settings.keywords.filter(
        (k) => k.keyword && k.keyword.match(/^ *$/) === null
      );
    await this.plugin.saveSettings();
  }
}
