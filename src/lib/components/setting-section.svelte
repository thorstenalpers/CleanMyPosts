<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  interface Props {
    title: string;
    icon: Component;
    children: Snippet;
  }

  let { title, icon: Icon, children }: Props = $props();
</script>

<section class="border-border/60 bg-card/50 rounded-lg border">
  <h2 class="text-muted-foreground flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
    <Icon class="size-3.5" />
    {title}
  </h2>
  <div class="divide-border/60 divide-y px-4 py-1">
    {@render children()}
  </div>
</section>
