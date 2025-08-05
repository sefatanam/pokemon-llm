import { EventEmitter } from '../utils/EventEmitter.js';

export class LoadingManager extends EventEmitter {
    #loadingContainer;
    #errorContainer;
    #noResultsContainer;
    #pokemonGrid;
    #isLoading = false;
    #hasError = false;

    constructor() {
        super();
        this.#init();
    }

    #init() {
        this.#loadingContainer = document.getElementById('loadingContainer');
        this.#errorContainer = document.getElementById('errorContainer');
        this.#noResultsContainer = document.getElementById('noResults');
        this.#pokemonGrid = document.getElementById('pokemonGrid');

        if (!this.#loadingContainer || !this.#errorContainer || !this.#pokemonGrid) {
            throw new Error('Required UI elements not found');
        }
    }

    showLoading() {
        this.#isLoading = true;
        this.#hasError = false;
        
        this.#loadingContainer.classList.remove('hidden');
        this.#errorContainer.classList.add('hidden');
        this.#noResultsContainer?.classList.add('hidden');
        
        this.emit('loading:start');
    }

    hideLoading() {
        this.#isLoading = false;
        this.#loadingContainer.classList.add('hidden');
        this.emit('loading:end');
    }

    showError(message = 'An error occurred while loading Pokemon data') {
        this.#hasError = true;
        this.hideLoading();
        
        const errorMessage = this.#errorContainer.querySelector('#errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        this.#errorContainer.classList.remove('hidden');
        this.#noResultsContainer?.classList.add('hidden');
        
        this.emit('error:show', { message });
    }

    hideError() {
        this.#hasError = false;
        this.#errorContainer.classList.add('hidden');
        this.emit('error:hide');
    }

    showNoResults() {
        this.hideLoading();
        this.hideError();
        
        if (this.#noResultsContainer) {
            this.#noResultsContainer.classList.remove('hidden');
        }
        
        this.emit('noResults:show');
    }

    hideNoResults() {
        if (this.#noResultsContainer) {
            this.#noResultsContainer.classList.add('hidden');
        }
        this.emit('noResults:hide');
    }

    async showLoadingCards(count = 12) {
        this.hideError();
        this.hideNoResults();
        
        const { PokemonCard } = await import('../components/PokemonCard.js');
        
        this.#pokemonGrid.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const loadingCard = PokemonCard.createLoadingCard();
            this.#pokemonGrid.appendChild(loadingCard);
        }
        
        this.emit('loadingCards:show', { count });
    }

    clearGrid() {
        this.#pokemonGrid.innerHTML = '';
        this.emit('grid:clear');
    }

    get isLoading() {
        return this.#isLoading;
    }

    get hasError() {
        return this.#hasError;
    }

    get gridElement() {
        return this.#pokemonGrid;
    }

    setLoadingMessage(message) {
        const loadingText = this.#loadingContainer.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        } else {
            const textElement = document.createElement('p');
            textElement.className = 'loading-text text-center text-gray-600 mt-4';
            textElement.textContent = message;
            this.#loadingContainer.appendChild(textElement);
        }
    }

    removeLoadingMessage() {
        const loadingText = this.#loadingContainer.querySelector('.loading-text');
        if (loadingText) {
            loadingText.remove();
        }
    }
}