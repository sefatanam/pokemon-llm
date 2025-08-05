import { EventEmitter } from './utils/EventEmitter.js';
import { PokemonAPI } from './services/PokemonAPI.js';
import { PokemonCard } from './components/PokemonCard.js';
import { SearchManager } from './managers/SearchManager.js';
import { LoadingManager } from './managers/LoadingManager.js';

export class App extends EventEmitter {
    #pokemonAPI;
    #searchManager;
    #loadingManager;
    #pokemonCards = new Map();
    #currentPokemon = [];
    #isInitialized = false;

    constructor() {
        super();
        this.#init();
    }

    async #init() {
        try {
            this.#pokemonAPI = PokemonAPI.getInstance();
            this.#loadingManager = new LoadingManager();
            this.#searchManager = new SearchManager('searchInput');
            
            this.#setupEventListeners();
            await this.#loadInitialPokemon();
            
            this.#isInitialized = true;
            this.emit('app:ready');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.#loadingManager.showError('Failed to initialize the application');
        }
    }

    #setupEventListeners() {
        this.#searchManager.on('search:query', async ({ query }) => {
            await this.#handleSearch(query);
        });

        this.#searchManager.on('search:clear', async () => {
            await this.#loadInitialPokemon();
        });

        this.#loadingManager.on('error:show', ({ message }) => {
            console.error('Loading error:', message);
        });

        window.addEventListener('beforeunload', () => {
            this.#cleanup();
        });

        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === '/') {
                event.preventDefault();
                this.#searchManager.focus();
            }
        });
    }

    async #loadInitialPokemon() {
        try {
            this.#loadingManager.showLoading();
            this.#loadingManager.setLoadingMessage('Loading Pokemon...');
            
            const pokemon = await this.#pokemonAPI.getInitialPokemon(50);
            this.#currentPokemon = pokemon;
            
            this.#renderPokemon(pokemon);
            this.#loadingManager.hideLoading();
            this.#loadingManager.removeLoadingMessage();
            
        } catch (error) {
            console.error('Failed to load initial Pokemon:', error);
            this.#loadingManager.showError('Failed to load Pokemon data. Please try again.');
        }
    }

    async #handleSearch(query) {
        if (!query || query.trim() === '') {
            await this.#loadInitialPokemon();
            return;
        }

        try {
            this.#loadingManager.showLoading();
            this.#loadingManager.setLoadingMessage(`Searching for "${query}"...`);
            
            const pokemon = await this.#pokemonAPI.searchPokemonByName(query);
            
            if (pokemon.length === 0) {
                this.#loadingManager.hideLoading();
                this.#loadingManager.showNoResults();
                this.#clearPokemonGrid();
            } else {
                this.#currentPokemon = pokemon;
                this.#renderPokemon(pokemon);
                this.#loadingManager.hideLoading();
                this.#loadingManager.hideNoResults();
            }
            
            this.#loadingManager.removeLoadingMessage();
            
        } catch (error) {
            console.error('Search failed:', error);
            this.#loadingManager.showError(`Search failed: ${error.message}`);
        }
    }

    #renderPokemon(pokemon) {
        this.#clearPokemonGrid();
        
        const fragment = document.createDocumentFragment();
        
        pokemon.forEach((poke, index) => {
            const card = new PokemonCard(poke, null);
            this.#pokemonCards.set(poke.id, card);
            
            setTimeout(() => {
                card.element.classList.add('fade-in');
            }, index * 50);
            
            fragment.appendChild(card.render());
        });
        
        this.#loadingManager.gridElement.appendChild(fragment);
        this.emit('pokemon:rendered', { count: pokemon.length });
    }

    #clearPokemonGrid() {
        this.#pokemonCards.forEach(card => card.remove());
        this.#pokemonCards.clear();
        this.#loadingManager.clearGrid();
    }

    async #refreshData() {
        this.#pokemonAPI.clearCache();
        await this.#loadInitialPokemon();
    }

    #cleanup() {
        this.#searchManager?.destroy();
        this.#pokemonCards.clear();
        this._events = {};
    }

    getPokemonById(id) {
        return this.#pokemonCards.get(id)?.pokemon;
    }

    getCurrentPokemon() {
        return [...this.#currentPokemon];
    }

    async searchPokemon(query) {
        this.#searchManager.setQuery(query);
    }

    clearSearch() {
        this.#searchManager.clear();
    }

    refresh() {
        return this.#refreshData();
    }

    get isReady() {
        return this.#isInitialized;
    }

    get stats() {
        return {
            totalPokemon: this.#currentPokemon.length,
            cardsRendered: this.#pokemonCards.size,
            cacheSize: this.#pokemonAPI.getCacheSize(),
            isLoading: this.#loadingManager.isLoading
        };
    }
}