<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { class: className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement> & { children?: Snippet } = $props();
</script>

<thead class={cn('[&_tr]:border-b', className)} {...rest}>
  {@render children?.()}
</thead>
