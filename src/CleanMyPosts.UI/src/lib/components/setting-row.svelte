<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    /** Always visible, never a placeholder — the user has to know what a toggle costs before flipping it. */
    description?: string;
    /** Ties the label to the control the caller renders. */
    for?: string;
    control: Snippet;
  }

  let { label, description, for: htmlFor, control }: Props = $props();
</script>

<div class="flex items-start justify-between gap-6 py-2.5">
  <div class="min-w-0">
    <label class="text-[13px] font-medium" for={htmlFor}>{label}</label>
    {#if description}
      <p class="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
    {/if}
  </div>
  <div class="flex shrink-0 items-center gap-2">
    {@render control()}
  </div>
</div>
