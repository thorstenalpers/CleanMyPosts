<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import ActionRow from './action-row.svelte';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import HeartIcon from '@lucide/svelte/icons/heart';

  const { Story } = defineMeta({
    title: 'App/ActionRow',
    component: ActionRow,
    tags: ['autodocs'],
    args: {
      label: 'Posts',
      icon: MessagesSquareIcon,
      disabled: false,
      onShow: fn(),
      onDelete: fn()
    }
  });
</script>

<Story name="Enabled" />
<Story name="Disabled" args={{ disabled: true }} />
<Story name="Likes" args={{ label: 'Likes', icon: HeartIcon }} />
