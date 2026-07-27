<script lang="ts">
  import { Label as LabelPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let { class: className, ...rest }: LabelPrimitive.RootProps = $props();
</script>

<LabelPrimitive.Root
  class={cn('text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
  {...rest}
/>
