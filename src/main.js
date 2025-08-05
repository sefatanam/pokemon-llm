import { App } from './App.js';

let app;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initializing Pokemon App...');
        
        app = new App();
        
        app.on('app:ready', () => {
            console.log('✅ Pokemon App initialized successfully!');
            console.log('💡 Press Ctrl+/ to focus the search bar');
        });

        app.on('pokemon:rendered', ({ count }) => {
            console.log(`🎨 Rendered ${count} Pokemon cards`);
        });

        window.pokemonApp = app;
        
    } catch (error) {
        console.error('❌ Failed to initialize Pokemon App:', error);
    }
});

window.addEventListener('beforeunload', () => {
    if (app) {
        console.log('🧹 Cleaning up Pokemon App...');
    }
});