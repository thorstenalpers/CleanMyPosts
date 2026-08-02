<script lang="ts">
  import { getAppContext } from '$lib/app-context';
  import LogView from '../../views/log-view.svelte';

  const { logStore } = getAppContext();
</script>

<LogView {logStore} />
