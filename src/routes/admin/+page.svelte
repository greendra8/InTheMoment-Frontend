<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;
  export let form;

  let newCategory = '';

  function handleAddCategory() {
    newCategory = '';
  }
</script>

<svelte:head>
  <title>Admin Dashboard</title>
</svelte:head>

<div class="admin-dashboard">
  <h1><i class="fas fa-cogs"></i> Admin Dashboard</h1>

  <div class="category-list">
    <h2><i class="fas fa-list"></i> Categories</h2>
    {#each data.categories as category}
      <div class="category-item">
        <a href="/admin/category/{category.id}">
          <i class="fas fa-folder"></i> {category.category_order}. {category.category_name}
        </a>
        <form method="POST" action="?/deleteCategory" use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              await invalidateAll();
            }
          };
        }}>
          <input type="hidden" name="categoryId" value={category.id} />
          <button type="submit" class="delete-btn" title="Delete Category">
            <i class="fas fa-trash"></i>
          </button>
        </form>
      </div>
    {/each}
  </div>

  <div class="add-category">
    <h3><i class="fas fa-plus-circle"></i> Add New Category</h3>
    <form method="POST" action="?/addCategory" use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          handleAddCategory();
          await invalidateAll();
        }
      };
    }}>
      <div class="input-group">
        <input name="category" bind:value={newCategory} placeholder="Enter new category name" required />
        <button type="submit">Add Category</button>
      </div>
    </form>
  </div>

  {#if form?.error}
    <p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
  {/if}
</div>

<style>
  .admin-dashboard {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1, h2, h3 {
    margin-bottom: 20px;
  }

  .category-list {
    margin-bottom: 30px;
  }

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
  }

  .category-item a {
    padding: 10px;
    text-decoration: none;
    color: #333;
    flex-grow: 1;
    transition: background-color 0.3s;
  }

  .category-item:hover {
    background-color: #c5c5c5;
  }


  i {
    margin-right: 3dpx;
  }

  .input-group {
    display: flex;
  }

  .input-group input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-right: none;
    border-radius: 5px 0 0 5px;
  }

  button {
    padding: 10px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #45a049;
  }

  .input-group button {
    border-radius: 0 5px 5px 0;
  }

  .delete-btn {
    color: #333;
    background-color: transparent;
    padding: 10px;
  }

  .delete-btn:hover {
    color: #f44336;
    background-color: transparent;
  }

  .error {
    color: #f44336;
    margin-top: 20px;
  }
</style>