<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Switch } from './index';

  const { Story } = defineMeta({
    title: 'UI/Switch',
    component: Switch,
    tags: ['autodocs'],
    argTypes: {
      checked: { control: 'boolean' },
      disabled: { control: 'boolean' }
    },
    args: { checked: false, disabled: false }
  });
</script>

<Story name="Off" args={{ checked: false }} />
<Story name="On" args={{ checked: true }} />
<Story name="Disabled" args={{ checked: false, disabled: true }} />
