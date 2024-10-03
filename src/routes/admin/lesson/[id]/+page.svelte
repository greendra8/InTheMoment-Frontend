<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let { lesson } = data;
  let isUpdating = false;
  let updateSuccess = false;

  function handleUpdate({ form, data, action, cancel }) {
    isUpdating = true;
    updateSuccess = false;

    return async ({ result, update }) => {
      isUpdating = false;
      if (result.type === 'success') {
        updateSuccess = true;
        lesson = result.data.lesson;
      }
      await update({ reset: false });
    };
  }
</script>

<svelte:head>
  <title>Edit Lesson - {lesson.lesson_title}</title>
</svelte:head>

<div class="lesson-edit">
  <h1><i class="fas fa-edit"></i> Edit Lesson</h1>
  <a href="/admin/category/{lesson.category_id}" class="back-link">
    <i class="fas fa-arrow-left"></i> Back to Category
  </a>

  <form 
    method="POST" 
    action="?/updateLesson" 
    use:enhance={handleUpdate}
  >
    <div class="form-group">
      <label for="lesson_title">Lesson Title</label>
      <input id="lesson_title" name="lesson_title" bind:value={lesson.lesson_title} required />
    </div>

    <div class="form-group">
      <label for="lesson_number">Lesson Number</label>
      <input id="lesson_number" name="lesson_number" type="number" bind:value={lesson.lesson_number} required />
    </div>

    <div class="form-group">
      <label for="lesson_content">Lesson Content</label>
      <textarea id="lesson_content" name="lesson_content" bind:value={lesson.lesson_content} rows="10" required></textarea>
    </div>

    {#if updateSuccess}
    <p class="success"><i class="fas fa-check-circle"></i> Lesson updated successfully!</p>
  {/if}
  {#if form?.error}
      <p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
    {/if}


    <button type="submit" disabled={isUpdating} class="update-button">
      {#if isUpdating}
        <i class="fas fa-spinner fa-spin"></i> Updating...
      {:else}
        <i class="fas fa-save"></i> Update Lesson
      {/if}
    </button>
  </form>


  <form 
    method="POST" 
    action="?/deleteLesson" 
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          goto(`/admin/category/${lesson.category_id}`);
        }
      };
    }}
  >
    <button type="submit" class="delete-button" on:click|preventDefault={() => {
      if (confirm('Are you sure you want to delete this lesson?')) {
        const form = document.querySelector('form[action="?/deleteLesson"]');
        form?.requestSubmit();
      }
    }}>
      <i class="fas fa-trash"></i> Delete Lesson
    </button>
  </form>


</div>

<style>
  .lesson-edit {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1 {
    margin-bottom: 20px;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 20px;
    color: #333;
    text-decoration: none;
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input, textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }

  button {
    padding: 10px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
    border-radius: 4px;
  }

  button:hover {
    background-color: #45a049;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .update-button {
    float: right;
  }

  .delete-button {
    float: left;
    background-color: #f44336;
  }

  .delete-button:hover {
    background-color: #d32f2f;
  }

  .error {
    color: #f44336;
    margin-top: 20px;
  }

  .success {
    color: #4CAF50;
    margin-top: 20px;
  }
</style>