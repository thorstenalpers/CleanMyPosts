<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import RunStatus from './run-status.svelte';

  const { Story } = defineMeta({
    title: 'App/RunStatus',
    component: RunStatus,
    tags: ['autodocs'],
    args: {
      label: 'Posts',
      deletedCount: 128,
      onStop: fn()
    }
  });
</script>

{#snippet template(args)}
  <div class="w-56">
    <RunStatus {...args} />
  </div>
{/snippet}

<Story name="Running" {template} />
<Story name="JustStarted" args={{ deletedCount: 0 }} {template} />
<Story name="LongLabel" args={{ label: 'Followed accounts', deletedCount: 4821 }} {template} />
