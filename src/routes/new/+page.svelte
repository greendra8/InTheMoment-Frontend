<script lang="ts">
	import NewSession from './NewSession.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<NewSession {data} />
