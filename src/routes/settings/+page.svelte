<script lang="ts">
  import { getAppContext } from '$lib/app-context';
  import SettingsView from '$lib/views/settings-view.svelte';

  const { bridge, settingsStore } = getAppContext();
</script>

<SettingsView {bridge} {settingsStore} />
