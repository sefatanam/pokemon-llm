import { EventEmitter } from './utils/EventEmitter.js';
import { PokemonAPI } from './services/PokemonAPI.js';
import { PokemonCard } from './components/PokemonCard.js';
import { SearchManager } from './managers/SearchManager.js';
import { LoadingManager } from './managers/LoadingManager.js';
import { FilterManager } from './managers/FilterManager.js';
import { PaginationManager } from './managers/PaginationManager.js';

export class App extends EventEmitter {
    #pokemonAPI;
    #searchManager;
    #loadingManager;
    #filterManager;
    #paginationManager;
    #pokemonCards = new Map();
    #currentPokemon = [];
    #currentFilters = {};
    #currentSearchQuery = '';
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
            this.#filterManager = new FilterManager();
            this.#paginationManager = new PaginationManager(50);
            
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
            this.#currentSearchQuery = query;
            this.#paginationManager.reset();
            await this.#loadPokemonData();
        });

        this.#searchManager.on('search:clear', async () => {
            this.#currentSearchQuery = '';
            this.#paginationManager.reset();
            await this.#loadPokemonData();
        });

        this.#filterManager.on('filters:changed', async (filters) => {
            this.#currentFilters = filters;
            this.#paginationManager.reset();
            await this.#loadPokemonData();
        });

        this.#paginationManager.on('pagination:pageChanged', async ({ page }) => {
            await this.#loadPokemonData(page);
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
        await this.#loadPokemonData(1);
    }

    async #loadPokemonData(page = 1) {
        try {
            this.#loadingManager.showLoading();
            this.#loadingManager.setLoadingMessage('Loading Pokemon...');
            
            let result;
            
            if (this.#currentSearchQuery) {
                result = await this.#pokemonAPI.searchPokemonByName(
                    this.#currentSearchQuery, 
                    page, 
                    this.#paginationManager.getItemsPerPage()
                );
            } else if (this.#filterManager.hasActiveFilters()) {
                result = await this.#pokemonAPI.getFilteredPokemon(
                    this.#currentFilters,
                    page,
                    this.#paginationManager.getItemsPerPage()
                );
            } else {
                result = await this.#pokemonAPI.getInitialPokemon(
                    page,
                    this.#paginationManager.getItemsPerPage()
                );
            }

            const { pokemon, totalCount } = result;
            
            this.#currentPokemon = pokemon;
            this.#paginationManager.setTotalItems(totalCount);
            
            if (pokemon.length === 0 && totalCount === 0) {
                this.#loadingManager.hideLoading();
                this.#loadingManager.showNoResults();
                this.#clearPokemonGrid();
                this.#paginationManager.hide();
            } else {
                this.#renderPokemon(pokemon);
                this.#loadingManager.hideLoading();
                this.#loadingManager.hideNoResults();
                this.#paginationManager.show();
            }
            
            this.#loadingManager.removeLoadingMessage();
            
        } catch (error) {
            console.error('Failed to load Pokemon:', error);
            this.#loadingManager.showError('Failed to load Pokemon data. Please try again.');
            this.#paginationManager.hide();
        }
    }

    #renderPokemon(pokemon) {
        this.#clearPokemonGrid();
        
        if (pokemon.length === 0) {
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        pokemon.forEach((poke, index) => {
            const card = new PokemonCard(poke, null);
            this.#pokemonCards.set(poke.id, card);
            
            setTimeout(() => {
                if (card.element) {
                    card.element.classList.add('fade-in');
                }
            }, index * 30);
            
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
        this.#paginationManager.reset();
        await this.#loadPokemonData();
    }

    #cleanup() {
        this.#searchManager?.destroy();
        this.#filterManager?.destroy();
        this.#paginationManager?.destroy();
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

    clearFilters() {
        this.#filterManager.clearAllFilters();
    }

    goToPage(page) {
        this.#paginationManager.goToPage(page);
    }

    refresh() {
        return this.#refreshData();
    }

    get isReady() {
        return this.#isInitialized;
    }

    get stats() {
        return {
            totalPokemon: this.#paginationManager.getTotalItems(),
            currentPage: this.#paginationManager.getCurrentPage(),
            totalPages: this.#paginationManager.getTotalPages(),
            cardsRendered: this.#pokemonCards.size,
            cacheSize: this.#pokemonAPI.getCacheSize(),
            isLoading: this.#loadingManager.isLoading,
            hasFilters: this.#filterManager.hasActiveFilters(),
            hasSearch: this.#currentSearchQuery !== ''
        };
    }
}