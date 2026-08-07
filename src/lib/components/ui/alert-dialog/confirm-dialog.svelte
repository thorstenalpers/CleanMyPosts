<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import AlertDialogContent from './alert-dialog-content.svelte';
  import { buttonVariants } from '$lib/components/ui/button';

  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }

  let { open = $bindable(), title, description, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }: Props = $props();
</script>

<AlertDialogPrimitive.Root bind:open>
  <AlertDialogContent>
    <AlertDialogPrimitive.Title class="text-lg font-semibold">{title}</AlertDialogPrimitive.Title>
    <AlertDialogPrimitive.Description class="text-muted-foreground text-sm">{description}</AlertDialogPrimitive.Description>
    <div class="flex justify-end gap-2">
      <AlertDialogPrimitive.Cancel class={buttonVariants({ variant: 'outline' })} onclick={onCancel}>
        {cancelLabel}
      </AlertDialogPrimitive.Cancel>
      <AlertDialogPrimitive.Action class={buttonVariants({ variant: 'destructive' })} onclick={onConfirm}>
        {confirmLabel}
      </AlertDialogPrimitive.Action>
    </div>
  </AlertDialogContent>
</AlertDialogPrimitive.Root>
