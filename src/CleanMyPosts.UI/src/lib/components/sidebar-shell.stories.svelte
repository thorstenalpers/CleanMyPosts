<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import SidebarShell from './sidebar-shell.svelte';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import VideoIcon from '@lucide/svelte/icons/video';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  const navItems = [
    { key: 'x', label: 'X', icon: MessagesSquareIcon },
    { key: 'youtube', label: 'YouTube', icon: VideoIcon },
    { key: 'log', label: 'Log', icon: ScrollTextIcon },
    { key: 'settings', label: 'Settings', icon: SettingsIcon }
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

<Story name="Expanded" {template} />
<Story name="Collapsed" args={{ expanded: false }} {template} />
<Story name="YouTube active" args={{ activeKey: 'youtube' }} {template} />
