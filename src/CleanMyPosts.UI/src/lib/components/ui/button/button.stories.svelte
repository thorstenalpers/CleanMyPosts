<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from './index';

  const { Story } = defineMeta({
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: 'select',
        options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
      },
      size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
      disabled: { control: 'boolean' }
    },
    args: { variant: 'default', size: 'default', disabled: false }
  });
</script>

<Story name="Default" args={{ variant: 'default' }}>Button</Story>
<Story name="Destructive" args={{ variant: 'destructive' }}>Delete</Story>
<Story name="Outline" args={{ variant: 'outline' }}>Outline</Story>
<Story name="Secondary" args={{ variant: 'secondary' }}>Secondary</Story>
<Story name="Ghost" args={{ variant: 'ghost' }}>Ghost</Story>
<Story name="Link" args={{ variant: 'link' }}>Link</Story>
<Story name="Small" args={{ size: 'sm' }}>Small</Story>
<Story name="Large" args={{ size: 'lg' }}>Large</Story>
<Story name="Disabled" args={{ disabled: true }}>Disabled</Story>
