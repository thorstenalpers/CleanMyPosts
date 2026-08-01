<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import AccentPicker from './accent-picker.svelte';

  const { Story } = defineMeta({
    title: 'App/AccentPicker',
    component: AccentPicker,
    tags: ['autodocs'],
    args: {
      value: '#3B82F6',
      useSystemAccent: false,
      onChange: fn(),
      onUseSystemAccentChange: fn()
    }
  });
</script>

<Story name="Default" />
<Story name="CustomColour" args={{ value: '#F43F5E' }} />
<Story name="FollowingSystem" args={{ useSystemAccent: true }} />
