import { EventEmitter } from '../utils/EventEmitter.js';

export class SearchManager extends EventEmitter {
    #searchInput;
    #searchTimeout;
    #lastQuery = '';
    #debounceDelay = 300;

    constructor(searchInputId) {
        super();
        this.#searchInput = document.getElementById(searchInputId);
        this.#init();
    }

    #init() {
        if (!this.#searchInput) {
            throw new Error('Search input element not found');
        }

        this.#addEventListeners();
    }

    #addEventListeners() {
        this.#searchInput.addEventListener('input', (event) => {
            this.#handleSearchInput(event.target.value);
        });

        this.#searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.#performSearch(event.target.value, true);
            }
        });

        this.#searchInput.addEventListener('focus', () => {
            this.emit('search:focus');
        });

        this.#searchInput.addEventListener('blur', () => {
            this.emit('search:blur');
        });
    }

    #handleSearchInput(query) {
        clearTimeout(this.#searchTimeout);
        
        const trimmedQuery = query.trim();
        
        if (trimmedQuery === this.#lastQuery) {
            return;
        }

        this.emit('search:input', { query: trimmedQuery });

        this.#searchTimeout = setTimeout(() => {
            this.#performSearch(trimmedQuery);
        }, this.#debounceDelay);
    }

    #performSearch(query, immediate = false) {
        clearTimeout(this.#searchTimeout);
        
        const trimmedQuery = query.trim();
        this.#lastQuery = trimmedQuery;

        this.emit('search:start', { 
            query: trimmedQuery, 
            immediate 
        });

        if (trimmedQuery === '') {
            this.emit('search:clear');
            return;
        }

        this.emit('search:query', { 
            query: trimmedQuery,
            immediate 
        });
    }

    setQuery(query) {
        if (this.#searchInput) {
            this.#searchInput.value = query;
            this.#performSearch(query, true);
        }
    }

    getQuery() {
        return this.#searchInput ? this.#searchInput.value.trim() : '';
    }

    clear() {
        if (this.#searchInput) {
            this.#searchInput.value = '';
            this.#performSearch('', true);
        }
    }

    focus() {
        if (this.#searchInput) {
            this.#searchInput.focus();
        }
    }

    blur() {
        if (this.#searchInput) {
            this.#searchInput.blur();
        }
    }

    setPlaceholder(placeholder) {
        if (this.#searchInput) {
            this.#searchInput.placeholder = placeholder;
        }
    }

    disable() {
        if (this.#searchInput) {
            this.#searchInput.disabled = true;
            this.#searchInput.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    enable() {
        if (this.#searchInput) {
            this.#searchInput.disabled = false;
            this.#searchInput.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    setDebounceDelay(delay) {
        this.#debounceDelay = Math.max(0, delay);
    }

    destroy() {
        clearTimeout(this.#searchTimeout);
        
        if (this.#searchInput) {
            this.#searchInput.removeEventListener('input', this.#handleSearchInput);
            this.#searchInput.removeEventListener('keydown', this.#handleSearchInput);
            this.#searchInput.removeEventListener('focus', this.#handleSearchInput);
            this.#searchInput.removeEventListener('blur', this.#handleSearchInput);
        }

        this._events = {};
    }
}