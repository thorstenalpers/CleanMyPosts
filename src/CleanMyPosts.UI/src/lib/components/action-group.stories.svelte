<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import ActionGroup from './action-group.svelte';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import HeartIcon from '@lucide/svelte/icons/heart';

  const { Story } = defineMeta({
    title: 'App/ActionGroup',
    component: ActionGroup,
    tags: ['autodocs'],
    args: {
      title: 'Posts',
      icon: MessagesSquareIcon,
      disabled: false,
      onShow: fn(),
      onDelete: fn()
    }
  });
</script>

<Story name="Enabled" />
<Story name="Disabled" args={{ disabled: true }} />
<Story name="Likes" args={{ title: 'Likes', icon: HeartIcon }} />
