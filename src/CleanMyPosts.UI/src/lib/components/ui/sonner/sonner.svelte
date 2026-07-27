<script lang="ts">
  import { Toaster as Sonner, type ToasterProps } from 'svelte-sonner';
  import { mode } from 'mode-watcher';

  let { ...rest }: ToasterProps = $props();
</script>

<Sonner theme={mode.current} class="toaster group" richColors closeButton {...rest} />
