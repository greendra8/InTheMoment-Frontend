# AI Wellbeing Meditation App

This document provides a detailed technical overview of the AI Wellbeing Meditation App codebase. The application is built with SvelteKit and Supabase, leveraging modern web technologies to deliver personalized meditation experiences.

> **Note:** When editing this file, ensure that all code blocks are properly closed and nested. Avoid breaking the structure by keeping all content within a single code block.

## Project Structure

```
ai-wellbeing-frontend/
├── src/
│   ├── lib/
│   │   ├── audioVisualizer.ts
│   │   ├── supabase.ts
│   │   └── stores/
│   │       ├── profileSetup.ts
│   │       └── transition.ts
│   ├── routes/
│   │   ├── +page.svelte
│   │   ├── meditation/
│   │   │   ├── [id]/
│   │   │   │   ├── +page.svelte
│   │   │   └── +page.svelte
│   │   ├── library/
│   │   │   └── +page.svelte
│   │   ├── profile-setup/
│   │   │   └── +page.svelte
│   │   ├── dashboard/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   ├── assets/
│   │   ├── 3d.png
│   │   ├── 3d2.png
│   │   ├── 3d3.png
│   │   ├── 3d4.png
│   │   ├── 3d5.png
│   │   ├── med-bg.png
│   │   └── square.png
│   ├── components/
│   │   └── FeedbackForm.svelte
│   ├── styles/
│   │   └── global.css
│   ├── hooks/
│   │   └── server.ts
│   ├── app.d.ts
│   └── app.html
├── .env
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Detailed File Descriptions

### `src/lib/`

- **`audioVisualizer.ts`**: Contains functions to set up and manage the audio visualizer for meditation sessions. It handles the creation of audio contexts, analyzers, and the rendering of visual effects on a canvas element.

- **`supabase.ts`**: Sets up the Supabase client and provides helper functions for interacting with the Supabase backend. This includes functions for user authentication, profile management, and meditation data handling.

- **`stores/`**:
  - **`profileSetup.ts`**: Defines a Svelte store for managing the state of the profile setup process. It includes actions for updating and resetting the profile setup state.
  - **`transition.ts`**: Manages transition states within the application, likely used for handling page transitions or other UI state changes.

### `src/routes/`

- **`+page.svelte`**: The main entry point for the application, defining the layout and structure of the homepage. It includes sections for the hero banner, features, how the app works, highlights, and calls to action.

- **`meditation/`**:
  - **`[id]/+page.svelte`**: Handles the display and functionality of individual meditation sessions. It includes the audio player, visualizer, feedback form, and related UI elements. It also manages the state of the meditation session, including playback, feedback submission, and download status.
  - **`+page.svelte`**: Likely serves as a listing or overview page for available meditations, providing navigation to individual sessions.

- **`library/+page.svelte`**: Displays a list of available meditations in the user's library. It includes error handling and styles for the meditation list.

- **`profile-setup/+page.svelte`**: Manages the profile setup process, guiding the user through a series of questions to personalize their meditation experience. It uses Svelte stores to manage the state of the setup process.

- **`dashboard/`**:
  - **`+page.svelte`**: Displays the user's dashboard, including a list of featured and regular meditations. It includes styles and interactions for the meditation list.
  - **`+page.server.ts`**: Server-side code for loading data required by the dashboard page. It defines the structure and content of the meditations displayed on the dashboard.

### `src/assets/`

Contains static assets used throughout the application, such as images for meditation themes and backgrounds.

### `src/components/`

- **`FeedbackForm.svelte`**: A reusable component for submitting feedback on meditation sessions. It includes form handling and submission logic.

### `src/styles/`

- **`global.css`**: Defines global styles for the application, including font settings, layout adjustments, and responsive design rules.

### `src/hooks/`

- **`server.ts`**: Contains server-side hooks for the application, likely used for initializing the Supabase client and handling authentication on the server.

### `src/app.d.ts`

TypeScript declaration file for defining global types and interfaces used throughout the application.

### `src/app.html`

The HTML template for the application, including meta tags, links to external stylesheets, and the main content placeholder for SvelteKit.

### `.env`

Environment variables for configuring the application, such as Supabase credentials.

### `package.json`

Defines the project's metadata, dependencies, and scripts for building, running, and maintaining the application.

### `svelte.config.js`

Configuration file for SvelteKit, defining settings for the Svelte compiler and other build-related options.

### `tsconfig.json`

TypeScript configuration file, specifying compiler options and paths for the project.

### `vite.config.ts`

Configuration file for Vite, the build tool used by SvelteKit. It includes settings for plugins, server options, and build optimizations.

## Summary

The AI Wellbeing Meditation App is a comprehensive SvelteKit application that leverages Supabase for backend services. The codebase is organized into clear, modular components, with a focus on maintainability and scalability. Each file and directory serves a specific purpose, contributing to the overall functionality and user experience of the application.

### Additional Notes

- **State Management**: The application uses Svelte stores for state management, ensuring reactive and efficient updates to the UI.
- **Authentication**: Supabase handles user authentication, providing secure and scalable user management.
- **Audio Handling**: The `audioVisualizer.ts` file is crucial for creating an immersive audio experience, leveraging the Web Audio API for real-time audio processing and visualization.
- **Responsive Design**: The application is designed to be fully responsive, ensuring a seamless experience across different devices and screen sizes.
- **Error Handling**: Error handling is implemented throughout the application, particularly in data fetching and form submission processes, to ensure robustness and a smooth user experience.
