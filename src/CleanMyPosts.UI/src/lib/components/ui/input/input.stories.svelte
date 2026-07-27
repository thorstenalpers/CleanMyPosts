<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Input } from './index';

  const { Story } = defineMeta({
    title: 'UI/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
      placeholder: { control: 'text' },
      disabled: { control: 'boolean' },
      type: { control: 'select', options: ['text', 'number', 'email', 'password'] }
    },
    args: { placeholder: 'Type here…', type: 'text', disabled: false }
  });
</script>

<Story name="Default" />
<Story name="Number" args={{ type: 'number', placeholder: '0' }} />
<Story name="Disabled" args={{ disabled: true }} />
