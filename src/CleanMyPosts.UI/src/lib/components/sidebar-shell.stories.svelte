<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import SidebarShell from './sidebar-shell.svelte';
  import RunStatus from './run-status.svelte';
  import ActionRow from './action-row.svelte';
  import XIcon from './icons/x-icon.svelte';
  import YouTubeIcon from './icons/youtube-icon.svelte';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import ReplyIcon from '@lucide/svelte/icons/reply';
  import HeartIcon from '@lucide/svelte/icons/heart';

  const navItems = [
    { key: 'x', label: 'X', icon: XIcon, status: 'connected' },
    { key: 'youtube', label: 'YouTube', icon: YouTubeIcon, status: 'disconnected' },
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
          <ActionRow label="Posts" icon={MessagesSquareIcon} onShow={fn()} onDelete={fn()} />
          <ActionRow label="Replies" icon={ReplyIcon} onShow={fn()} onDelete={fn()} />
          <ActionRow label="Likes" icon={HeartIcon} onShow={fn()} onDelete={fn()} />
        {/if}
      {/snippet}
    </SidebarShell>
  </div>
{/snippet}

{#snippet withRunning(args)}
  <div class="border-border h-96 w-fit border">
    <SidebarShell {...args}>
      {#snippet subnav(key)}
        {#if key === 'x'}
          <ActionRow label="Posts" icon={MessagesSquareIcon} active disabled onShow={fn()} onDelete={fn()} />
          <ActionRow label="Replies" icon={ReplyIcon} disabled onShow={fn()} onDelete={fn()} />
        {/if}
      {/snippet}
      {#snippet status()}
        <RunStatus label="Posts" deletedCount={128} onStop={fn()} />
      {/snippet}
    </SidebarShell>
  </div>
{/snippet}

<Story name="Expanded" {template} />
<Story name="Collapsed" args={{ expanded: false }} {template} />
<Story name="X active with panel" args={{ activeKey: 'x' }} template={withSubnav} />
<Story name="Deletion running" args={{ activeKey: 'x' }} template={withRunning} />
