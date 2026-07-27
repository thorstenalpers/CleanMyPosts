<script lang="ts">
  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import ListIcon from '@lucide/svelte/icons/list';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  interface Props {
    label: string;
    icon: Component;
    disabled?: boolean;
    onShow: () => void;
    onDelete: () => void;
  }

  let { label, icon: Icon, disabled = false, onShow, onDelete }: Props = $props();
</script>

<div class="flex items-center gap-1 pl-3">
  <Icon class="text-muted-foreground size-4 shrink-0" />
  <span class="flex-1 truncate text-sm">{label}</span>
  <Button variant="ghost" size="icon" class="size-7" aria-label={`Show ${label}`} {disabled} onclick={onShow}>
    <ListIcon />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    class="text-destructive hover:text-destructive size-7"
    aria-label={`Delete ${label}`}
    {disabled}
    onclick={onDelete}
  >
    <Trash2Icon />
  </Button>
</div>
