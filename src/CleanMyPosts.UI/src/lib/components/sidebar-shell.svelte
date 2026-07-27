<script lang="ts" module>
  export const SIDEBAR_EXPANDED_WIDTH = 240;
  export const SIDEBAR_COLLAPSED_WIDTH = 56;
</script>

<script lang="ts" generics="TKey extends string">
  import type { Component, Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import MenuIcon from '@lucide/svelte/icons/menu';

  interface NavItem<TKey extends string> {
    key: TKey;
    label: string;
    icon: Component;
    /** Pins the item to the bottom of the sidebar instead of the top group. */
    footer?: boolean;
  }

  interface Props<TKey extends string> {
    navItems: NavItem<TKey>[];
    activeKey: TKey;
    onNavigate: (key: TKey) => void;
    expanded?: boolean;
    /** Called with the resulting pixel width whenever expanded/collapsed — used by the injected overlay to push page content aside. Unused by the local app's own flex layout. */
    onWidthChange?: (widthPx: number) => void;
    /** Rendered indented directly under the active nav item when the sidebar is expanded. */
    subnav?: Snippet<[TKey]>;
    children?: Snippet;
  }

  let { navItems, activeKey, onNavigate, expanded = $bindable(true), onWidthChange, subnav, children }: Props<TKey> =
    $props();

  const topItems = $derived(navItems.filter((item) => !item.footer));
  const footerItems = $derived(navItems.filter((item) => item.footer));

  $effect(() => {
    onWidthChange?.(expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
  });
</script>

{#snippet navButton(item: NavItem<TKey>)}
  <Button
    variant={activeKey === item.key ? 'secondary' : 'ghost'}
    class={cn('justify-start gap-2', !expanded && 'justify-center px-0')}
    onclick={() => onNavigate(item.key)}
  >
    <item.icon />
    {#if expanded}<span>{item.label}</span>{/if}
  </Button>
{/snippet}

<aside class={cn('bg-background flex h-full flex-col overflow-hidden border-r', expanded ? 'w-60' : 'w-14')}>
  <Button
    variant="ghost"
    size="icon"
    class="m-1 shrink-0 self-start"
    onclick={() => (expanded = !expanded)}
    aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
  >
    <MenuIcon />
  </Button>

  <div class="min-h-0 flex-1 overflow-y-auto">
    <nav class="flex flex-col gap-1 px-1">
      {#each topItems as item (item.key)}
        {@render navButton(item)}
        {#if expanded && activeKey === item.key}
          {@render subnav?.(item.key)}
        {/if}
      {/each}
    </nav>
    {#if expanded}
      {@render children?.()}
    {/if}
  </div>

  {#if footerItems.length > 0}
    <nav class={cn('flex shrink-0 flex-col gap-1 px-1 pb-1', expanded && 'border-t pt-1')}>
      {#each footerItems as item (item.key)}
        {@render navButton(item)}
      {/each}
    </nav>
  {/if}
</aside>
