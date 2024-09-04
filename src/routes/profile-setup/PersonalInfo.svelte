<script lang="ts">
  import { profileSetupStore } from '$lib/stores/profileSetup';

  function updateStore(field: string, value: string) {
    profileSetupStore.update(store => ({ ...store, [field]: value }));
  }
</script>

<h2>Personal Information</h2>

<form>
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" bind:value={$profileSetupStore.name} on:input={() => updateStore('name', $profileSetupStore.name)} required>
  </div>

  <div class="form-group">
    <label for="dob">Date of Birth:</label>
    <input type="date" id="dob" bind:value={$profileSetupStore.dob} on:input={() => updateStore('dob', $profileSetupStore.dob)} required>
  </div>

  <div class="form-group">
    <label for="gender">Gender:</label>
    <input type="text" id="gender" bind:value={$profileSetupStore.gender} on:input={() => updateStore('gender', $profileSetupStore.gender)} required>
  </div>
</form>

<style>
  h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
    color: #555;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: none;
    border-bottom: 1px solid #ddd;
    font-size: 1rem;
    background-color: transparent;
  }

  input:focus {
    outline: none;
    border-bottom-color: #4a90e2;
  }
</style>