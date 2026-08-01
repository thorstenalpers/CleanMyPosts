<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import SettingSection from './setting-section.svelte';
  import SettingRow from './setting-row.svelte';
  import { Switch } from './ui/switch';
  import { Input } from './ui/input';
  import ShieldIcon from '@lucide/svelte/icons/shield';

  const { Story } = defineMeta({
    title: 'App/SettingSection',
    component: SettingSection,
    tags: ['autodocs'],
    args: { title: 'Safety', icon: ShieldIcon }
  });
</script>

{#snippet template(args)}
  <div class="max-w-2xl">
    <SettingSection {...args}>
      <SettingRow
        label="Confirm before deleting"
        description="Ask once per run. Deletions cannot be undone."
        for="story-confirm"
      >
        {#snippet control()}
          <Switch id="story-confirm" checked onCheckedChange={fn()} />
        {/snippet}
      </SettingRow>
      <SettingRow label="Between deletions" description="Pause after each removed item." for="story-wait">
        {#snippet control()}
          <Input id="story-wait" type="number" value={500} class="h-8 w-24 text-right tabular-nums" />
          <span class="text-muted-foreground w-5 text-xs">ms</span>
        {/snippet}
      </SettingRow>
    </SettingSection>
  </div>
{/snippet}

<Story name="Default" {template} />
