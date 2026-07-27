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
  }

  interface Props<TKey extends string> {
    navItems: NavItem<TKey>[];
    activeKey: TKey;
    onNavigate: (key: TKey) => void;
    expanded?: boolean;
    /** Called with the resulting pixel width whenever expanded/collapsed — used by the injected overlay to push page content aside. Unused by the local app's own flex layout. */
    onWidthChange?: (widthPx: number) => void;
    /** Rendered indented under the active nav item when the sidebar is expanded. */
    subnav?: Snippet<[TKey]>;
    children?: Snippet;
  }

  let { navItems, activeKey, onNavigate, expanded = $bindable(true), onWidthChange, subnav, children }: Props<TKey> =
    $props();

  $effect(() => {
    onWidthChange?.(expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
  });
</script>

<aside
  class={cn(
    'bg-background flex h-full flex-col overflow-y-auto border-r',
    expanded ? 'w-60' : 'w-14'
  )}
>
  <Button
    variant="ghost"
    size="icon"
    class="m-1 shrink-0 self-start"
    onclick={() => (expanded = !expanded)}
    aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
  >
    <MenuIcon />
  </Button>

  <nav class="flex shrink-0 flex-col gap-1 px-1">
    {#each navItems as item (item.key)}
      <Button
        variant={activeKey === item.key ? 'secondary' : 'ghost'}
        class={cn('justify-start gap-2', !expanded && 'justify-center px-0')}
        onclick={() => onNavigate(item.key)}
      >
        <item.icon />
        {#if expanded}<span>{item.label}</span>{/if}
      </Button>
      {#if expanded && activeKey === item.key}
        {@render subnav?.(item.key)}
      {/if}
    {/each}
  </nav>

  {#if expanded}
    {@render children?.()}
  {/if}
</aside>
