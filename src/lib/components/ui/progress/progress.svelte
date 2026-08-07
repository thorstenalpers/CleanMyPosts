<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    /** Omit for an indeterminate bar — the delete loop cannot know a total up front. */
    value?: number;
    max?: number;
    label: string;
    class?: string;
  }

  let { value, max = 100, label, class: className }: Props = $props();

  const percent = $derived(value === undefined ? undefined : Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={value}
  class={cn('bg-muted relative h-1 w-full overflow-hidden rounded-full', className)}
>
  {#if percent === undefined}
    <div class="bg-primary absolute inset-y-0 w-1/3 animate-[cmp-indeterminate_1.4s_ease-in-out_infinite] rounded-full"></div>
  {:else}
    <div class="bg-primary h-full rounded-full transition-[width] duration-200" style="width: {percent}%"></div>
  {/if}
</div>
