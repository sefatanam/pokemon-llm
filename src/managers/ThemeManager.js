export class ThemeManager {
    #isDarkMode;
    #toggleButton;
    #sunIcon;
    #moonIcon;

    constructor() {
        this.#isDarkMode = this.#getInitialTheme();
        this.#toggleButton = document.getElementById('darkModeToggle');
        this.#sunIcon = document.getElementById('sunIcon');
        this.#moonIcon = document.getElementById('moonIcon');
        
        this.#initialize();
    }

    #getInitialTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem('pokemon-theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    #initialize() {
        // Apply initial theme
        this.#applyTheme();
        
        // Set up event listeners
        this.#toggleButton?.addEventListener('click', () => {
            this.toggle();
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('pokemon-theme')) {
                this.#isDarkMode = e.matches;
                this.#applyTheme();
            }
        });
    }

    #applyTheme() {
        const body = document.body;
        
        if (this.#isDarkMode) {
            body.setAttribute('data-theme', 'dark');
            body.classList.add('dark');
            this.#showMoonIcon();
        } else {
            body.removeAttribute('data-theme');
            body.classList.remove('dark');
            this.#showSunIcon();
        }
        
        // Save to localStorage
        localStorage.setItem('pokemon-theme', this.#isDarkMode ? 'dark' : 'light');
    }

    #showSunIcon() {
        if (this.#sunIcon && this.#moonIcon) {
            this.#sunIcon.classList.remove('hidden');
            this.#moonIcon.classList.add('hidden');
        }
    }

    #showMoonIcon() {
        if (this.#sunIcon && this.#moonIcon) {
            this.#sunIcon.classList.add('hidden');
            this.#moonIcon.classList.remove('hidden');
        }
    }

    toggle() {
        this.#isDarkMode = !this.#isDarkMode;
        this.#applyTheme();
    }

    get isDarkMode() {
        return this.#isDarkMode;
    }

    setTheme(isDark) {
        this.#isDarkMode = isDark;
        this.#applyTheme();
    }
}