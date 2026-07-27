<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import SidebarShell from './sidebar-shell.svelte';
  import XIcon from './icons/x-icon.svelte';
  import YouTubeIcon from './icons/youtube-icon.svelte';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  const navItems = [
    { key: 'x', label: 'X', icon: XIcon },
    { key: 'youtube', label: 'YouTube', icon: YouTubeIcon },
    { key: 'log', label: 'Log', icon: ScrollTextIcon },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, footer: true }
  ];

  const { Story } = defineMeta({
    title: 'App/SidebarShell',
    component: SidebarShell,
    tags: ['autodocs'],
    args: {
      navItems,
      activeKey: 'settings',
      onNavigate: fn(),
      expanded: true
    }
  });
</script>

{#snippet template(args)}
  <div class="border-border h-96 w-fit border">
    <SidebarShell {...args} />
  </div>
{/snippet}

{#snippet withSubnav(args)}
  <div class="border-border h-96 w-fit border">
    <SidebarShell {...args}>
      {#snippet subnav(key)}
        {#if key === 'x'}
          <div class="text-muted-foreground flex flex-col gap-1 px-3 py-1 text-sm">
            <span>Posts</span>
            <span>Replies</span>
            <span>Reposts</span>
            <span>Likes</span>
            <span>Following</span>
          </div>
        {/if}
      {/snippet}
    </SidebarShell>
  </div>
{/snippet}

<Story name="Expanded" {template} />
<Story name="Collapsed" args={{ expanded: false }} {template} />
<Story name="X active with panel" args={{ activeKey: 'x' }} template={withSubnav} />
