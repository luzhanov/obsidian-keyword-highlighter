<script lang="ts">
  import type { KeywordStyle } from "src/shared";
  import ToggleButtonGroup from "./ToggleButtonGroup.svelte";
  import Checkbox from "./Checkbox.svelte";
  import { setIcon } from "obsidian";
  import { createEventDispatcher } from "svelte";

  export let keyword: KeywordStyle;
  export let index: number;

  const dispatch = createEventDispatcher();

  const toggleButtonOptions = {
    bold: "<b>b</b>",
    italic: "<i>i</i>",
    underline: "<u>u</u>",
    lineThrough: "<s>s</s>",
  };

  function useIcon(node: HTMLElement, icon: string) {
    setIcon(node, icon);
    return {
      update(icon: string) {
        setIcon(node, icon);
      },
    };
  }
</script>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">{`Keyword #${index}`}</div>
    <div class="setting-item-description">
      Enter a keyword, font modifiers, a font color and a background color
    </div>
  </div>
  <div class="setting-item-control">
    <div>
      <input type="text" spellcheck="false" bind:value={keyword.keyword} />
    </div>
    <div class="setting-item-description">
      RegEx
    </div>
    <Checkbox
      label="Use RegEx"
      state={keyword.isRegex ?? true}
      on:clicked={({ detail }) => (keyword.isRegex = detail.state)}
    />
    <ToggleButtonGroup
      options={toggleButtonOptions}
      state={keyword.fontModifiers ?? []}
      on:stateChanged={({ detail }) => (keyword.fontModifiers = detail.state)}
    />
    <Checkbox
      label="Activate to modify the font color"
      state={keyword.showColor ?? true}
      on:clicked={({ detail }) => (keyword.showColor = detail.state)}
    />
    <input type="color" bind:value={keyword.color} />
    <Checkbox
      label="Activate to modify the background color"
      state={keyword.showBackgroundColor ?? true}
      on:clicked={({ detail }) => (keyword.showBackgroundColor = detail.state)}
    />
    <input type="color" bind:value={keyword.backgroundColor} />
    <button
      class="clickable-icon"
      aria-label="Remove keyword"
      use:useIcon={"minus-circle"}
      on:click={() => dispatch("remove", keyword)}
    ></button>
  </div>
</div>

<style>
  .setting-item-control {
    flex-shrink: 0;
  }
</style>
