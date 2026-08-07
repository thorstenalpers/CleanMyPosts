<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { class: className, children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { children?: Snippet } = $props();
</script>

<tr class={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)} {...rest}>
  {@render children?.()}
</tr>
