import { App } from './App.js';

let app;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌐 DOM loaded - starting Pokemon App initialization...');
    try {
        console.log('🚀 Creating new App instance...');
        
        app = new App();
        console.log('✅ App instance created:', app);
        
        app.on('app:ready', () => {
            console.log('✅ Pokemon App initialized successfully!');
            console.log('💡 Press Ctrl+/ to focus the search bar');
        });

        app.on('pokemon:rendered', ({ count }) => {
            console.log(`🎨 Rendered ${count} Pokemon cards`);
        });

        window.pokemonApp = app;
        console.log('✅ App assigned to window.pokemonApp');
        
    } catch (error) {
        console.error('❌ CRITICAL: Failed to initialize Pokemon App:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
    }
});

window.addEventListener('beforeunload', () => {
    if (app) {
        console.log('🧹 Cleaning up Pokemon App...');
    }
});