<!-- <script lang="ts">
  import { profileSetupStore } from '$lib/stores/profileSetup';

  let experiences = ['beginner', 'intermediate', 'advanced'];

  function updateExperience(value: string) {
    profileSetupStore.update(store => ({ ...store, experience: value }));
  }
</script>

<h2>Experience Level</h2>

<form>
  {#each experiences as exp}
    <label class="radio-label">
      <input type="radio" name="experience" value={exp} checked={$profileSetupStore.experience === exp} on:change={() => updateExperience(exp)}>
      <span class="radio-text">{exp.charAt(0).toUpperCase() + exp.slice(1)}</span>
    </label>
  {/each}
</form>

<style>
  h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .radio-label {
    display: block;
    margin-bottom: 0.75rem;
    cursor: pointer;
  }

  input[type="radio"] {
    margin-right: 0.5rem;
  }

  .radio-text {
    color: #555;
    font-size: 0.9rem;
  }
</style> -->