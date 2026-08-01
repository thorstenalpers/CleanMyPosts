<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import SettingRow from './setting-row.svelte';
  import { Switch } from './ui/switch';

  const { Story } = defineMeta({
    title: 'App/SettingRow',
    component: SettingRow,
    tags: ['autodocs'],
    args: {
      label: 'Confirm before deleting',
      description: 'Ask once per run. Deletions cannot be undone.',
      for: 'story-row'
    }
  });
</script>

{#snippet template(args)}
  <div class="max-w-xl">
    <SettingRow {...args}>
      {#snippet control()}
        <Switch id="story-row" checked onCheckedChange={fn()} />
      {/snippet}
    </SettingRow>
  </div>
{/snippet}

<Story name="WithDescription" {template} />
<Story name="LabelOnly" args={{ description: undefined }} {template} />
