<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLThAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { class: className, children, ...rest }: HTMLThAttributes & { children?: Snippet } = $props();
</script>

<th
  class={cn(
    'text-muted-foreground h-9 px-2 text-left align-middle font-medium whitespace-nowrap select-none [&:has([role=checkbox])]:pr-0',
    className
  )}
  {...rest}
>
  {@render children?.()}
</th>
