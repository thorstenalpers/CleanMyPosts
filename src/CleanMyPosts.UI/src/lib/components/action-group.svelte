<script lang="ts">
  import type { Component } from 'svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import ListIcon from '@lucide/svelte/icons/list';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  interface Props {
    title: string;
    icon: Component;
    disabled: boolean;
    onShow: () => void;
    onDelete: () => void;
  }

  let { title, icon: Icon, disabled, onShow, onDelete }: Props = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-1.5">
      <Icon class="size-4" />
      {title}
    </CardTitle>
  </CardHeader>
  <CardContent class="flex gap-2">
    <Button variant="outline" size="sm" {disabled} onclick={onShow}>
      <ListIcon />
      Show
    </Button>
    <Button variant="destructive" size="sm" {disabled} onclick={onDelete}>
      <Trash2Icon />
      Delete
    </Button>
  </CardContent>
</Card>
