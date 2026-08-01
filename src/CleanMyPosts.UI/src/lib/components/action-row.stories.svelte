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
      active: false,
      onShow: fn(),
      onDelete: fn()
    }
  });
</script>

{#snippet template(args)}
  <div class="w-52">
    <ActionRow {...args} />
  </div>
{/snippet}

<Story name="Enabled" {template} />
<Story name="Disabled" args={{ disabled: true }} {template} />
<Story name="Running" args={{ active: true, disabled: true }} {template} />
<Story name="Likes" args={{ label: 'Likes', icon: HeartIcon }} {template} />
