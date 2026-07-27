<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Card, CardHeader, CardTitle, CardContent } from './index';
  import { Button } from '$lib/components/ui/button';

  const { Story } = defineMeta({
    title: 'UI/Card',
    component: Card,
    tags: ['autodocs']
  });
</script>

<Story name="Default" asChild>
  <Card class="w-64">
    <CardHeader>
      <CardTitle>Posts</CardTitle>
    </CardHeader>
    <CardContent class="flex gap-2">
      <Button variant="outline" size="sm">Show</Button>
      <Button variant="destructive" size="sm">Delete</Button>
    </CardContent>
  </Card>
</Story>
