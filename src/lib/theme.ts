// Theme configuration for the application
// This file defines all the colors used throughout the app

export const theme = {
    // Text colors
    text: {
        primary: '#1a1a1a',
        secondary: '#666',
        light: '#e8e8e8',
        error: '#c62828',
        success: '#2e7d32',
    },

    // Background colors
    background: {
        main: '#e1e1e1',
        card: '#e8e8e8',
        cardHover: '#f0f0f0',
        button: '#000',
        buttonHover: '#222',
        input: '#f8f8f8',
        error: '#ffebee',
    },

    // UI element colors
    ui: {
        divider: '#e0e0e0',
        shadow: 'rgba(0, 0, 0, 0.04)',
        shadowHover: 'rgba(0, 0, 0, 0.08)',
        border: 'rgba(0, 0, 0, 0.1)',
        focus: '#1a1a1a',
        success: '#4CAF50',
        'success-hover': '#45a049',
        danger: '#f44336',
        'danger-hover': '#d32f2f',
        disabled: '#cccccc',
    },

    // Icon colors
    icon: {
        primary: '#333',
        secondary: '#666',
        danger: '#e53935',
    }
};

// Dark theme colors
export const darkTheme = {
    // Text colors
    text: {
        primary: '#e8e8e8',
        secondary: '#a0a0a0',
        light: '#1a1a1a',
        error: '#ef5350',
        success: '#66bb6a',
    },

    // Background colors
    background: {
        main: '#121212',
        card: '#1e1e1e',
        cardHover: '#2a2a2a',
        button: '#e8e8e8',
        buttonHover: '#d0d0d0',
        input: '#2a2a2a',
        error: '#4a1515',
    },

    // UI element colors
    ui: {
        divider: '#333333',
        shadow: 'rgba(0, 0, 0, 0.2)',
        shadowHover: 'rgba(0, 0, 0, 0.4)',
        border: 'rgba(255, 255, 255, 0.1)',
        focus: '#e8e8e8',
        success: '#43a047',
        'success-hover': '#388e3c',
        danger: '#e53935',
        'danger-hover': '#c62828',
        disabled: '#555555',
    },

    // Icon colors
    icon: {
        primary: '#d0d0d0',
        secondary: '#909090',
        danger: '#ef5350',
    }
};

// Cosmic theme colors
export const cosmicTheme = {
    // Text colors
    text: {
        primary: '#e0e4fc',
        secondary: '#a0a8e0',
        light: '#1a1a2e',
        error: '#ff6b6b',
        success: '#72efdd',
    },

    // Background colors
    background: {
        main: '#0f0f2d',
        card: '#1a1a3a',
        cardHover: '#252550',
        button: '#7b68ee',
        buttonHover: '#9370db',
        input: '#252550',
        error: '#4a1530',
    },

    // UI element colors
    ui: {
        divider: '#2d2d6d',
        shadow: 'rgba(0, 0, 50, 0.3)',
        shadowHover: 'rgba(0, 0, 50, 0.5)',
        border: 'rgba(123, 104, 238, 0.3)',
        focus: '#7b68ee',
        success: '#72efdd',
        'success-hover': '#64dfcb',
        danger: '#ff6b6b',
        'danger-hover': '#ff5252',
        disabled: '#444464',
    },

    // Icon colors
    icon: {
        primary: '#c8c8ff',
        secondary: '#8080c0',
        danger: '#ff6b6b',
    }
};

// RGB values for colors that need transparency
export const rgbValues = {
    'background-card': '232, 232, 232', // #e8e8e8
    'icon-primary': '51, 51, 51',       // #333
    'text-primary': '26, 26, 26',       // #1a1a1a
};

// RGB values for dark theme
export const darkRgbValues = {
    'background-card': '30, 30, 30',     // #1e1e1e
    'icon-primary': '208, 208, 208',     // #d0d0d0
    'text-primary': '232, 232, 232',     // #e8e8e8
};

// RGB values for cosmic theme
export const cosmicRgbValues = {
    'background-card': '26, 26, 58',     // #1a1a3a
    'icon-primary': '200, 200, 255',     // #c8c8ff
    'text-primary': '224, 228, 252',     // #e0e4fc
};

// Export individual color groups for convenience
export const { text, background, ui, icon } = theme;

// Export default theme
export default theme; 