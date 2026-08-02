<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getPortalTarget } from '$lib/portal-context';

  let {
    class: className,
    children,
    ...rest
  }: AlertDialogPrimitive.ContentProps & { children?: Snippet } = $props();

  const portalTarget = getPortalTarget();
</script>

<AlertDialogPrimitive.Portal to={portalTarget}>
  <AlertDialogPrimitive.Overlay
    class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
  />
  <AlertDialogPrimitive.Content
    class={cn(
      'bg-background fixed top-1/2 left-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg',
      className
    )}
    {...rest}
  >
    {@render children?.()}
  </AlertDialogPrimitive.Content>
</AlertDialogPrimitive.Portal>
