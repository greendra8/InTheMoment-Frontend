<script>
    export let data;
    $: ({ supabase } = data);
</script>

<slot />