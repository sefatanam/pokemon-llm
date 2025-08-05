import { EventEmitter } from './utils/EventEmitter.js';
import { PokemonAPI } from './services/PokemonAPI.js';
import { PokemonCard } from './components/PokemonCard.js';
import { SearchManager } from './managers/SearchManager.js';
import { LoadingManager } from './managers/LoadingManager.js';
import { FilterManager } from './managers/FilterManager.js';
import { PaginationManager } from './managers/PaginationManager.js';
import { ThemeManager } from './managers/ThemeManager.js';

export class App extends EventEmitter {
    #pokemonAPI;
    #searchManager;
    #loadingManager;
    #filterManager;
    #paginationManager;
    #themeManager;
    #pokemonCards = new Map();
    #currentPokemon = [];
    #currentFilters = {};
    #currentSearchQuery = '';
    #isInitialized = false;

    constructor() {
        super();
        console.log('🏗️ App constructor called');
        this.#init();
    }

    async #init() {
        console.log('🚀 App #init method called');
        try {
            console.log('1️⃣ Creating PokemonAPI instance...');
            this.#pokemonAPI = PokemonAPI.getInstance();
            console.log('✅ PokemonAPI created:', this.#pokemonAPI);
            
            console.log('2️⃣ Creating LoadingManager...');
            this.#loadingManager = new LoadingManager();
            console.log('✅ LoadingManager created');
            
            console.log('3️⃣ Creating SearchManager...');
            this.#searchManager = new SearchManager('searchInput');
            console.log('✅ SearchManager created');
            
            console.log('4️⃣ Creating FilterManager...');
            this.#filterManager = new FilterManager();
            console.log('✅ FilterManager created');
            
            console.log('5️⃣ Creating PaginationManager...');
            this.#paginationManager = new PaginationManager(50);
            console.log('✅ PaginationManager created');
            
            console.log('6️⃣ Creating ThemeManager...');
            this.#themeManager = new ThemeManager();
            console.log('✅ ThemeManager created');
            
            console.log('7️⃣ Setting up event listeners...');
            this.#setupEventListeners();
            console.log('✅ Event listeners set up');
            
            console.log('8️⃣ About to call #loadInitialPokemon...');
            await this.#loadInitialPokemon();
            console.log('✅ Initial Pokemon load completed');
            
            this.#isInitialized = true;
            console.log('9️⃣ App initialization complete - emitting app:ready');
            this.emit('app:ready');
            
        } catch (error) {
            console.error('❌ CRITICAL: App initialization failed:', error);
            console.error('Error stack:', error.stack);
            this.#loadingManager?.showError('Failed to initialize the application');
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
        console.log('🚀 FORCING initial Pokemon load...');
        try {
            this.#loadingManager.showLoading();
            this.#loadingManager.setLoadingMessage('Loading initial Pokemon...');
            
            // FORCE load the first 50 Pokemon regardless of any conditions
            console.log('📦 Directly calling getPokemonPage for first 50 Pokemon');
            const result = await this.#pokemonAPI.getPokemonPage(1, 50);
            console.log('📊 Forced load result:', result);
            
            const { pokemon, totalCount } = result;
            this.#currentPokemon = pokemon;
            this.#paginationManager.setTotalItems(totalCount);
            
            if (pokemon && pokemon.length > 0) {
                console.log('✅ SUCCESS: Rendering', pokemon.length, 'Pokemon');
                this.#renderPokemon(pokemon);
                this.#loadingManager.hideLoading();
                this.#loadingManager.hideNoResults();
                this.#paginationManager.show();
            } else {
                console.log('❌ FAILED: No Pokemon returned');
                this.#loadingManager.showError('Failed to load initial Pokemon');
            }
            
            this.#loadingManager.removeLoadingMessage();
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in initial load:', error);
            this.#loadingManager.showError('Failed to load Pokemon. Please refresh the page.');
        }
    }

    async #loadPokemonData(page = 1) {
        try {
            console.log('📦 Loading Pokemon data for page:', page);
            console.log('🔍 Current search query:', this.#currentSearchQuery);
            console.log('🎯 Has active filters:', this.#filterManager.hasActiveFilters());
            
            this.#loadingManager.showLoading();
            this.#loadingManager.setLoadingMessage('Loading Pokemon...');
            
            let result;
            
            if (this.#currentSearchQuery) {
                console.log('🔍 Using search query path');
                result = await this.#pokemonAPI.searchPokemonByName(
                    this.#currentSearchQuery, 
                    page, 
                    this.#paginationManager.getItemsPerPage()
                );
            } else if (this.#filterManager.hasActiveFilters()) {
                console.log('🎯 Using filtered Pokemon path');
                result = await this.#pokemonAPI.getFilteredPokemon(
                    this.#currentFilters,
                    page,
                    this.#paginationManager.getItemsPerPage()
                );
            } else {
                console.log('🏠 Using initial Pokemon path');
                result = await this.#pokemonAPI.getInitialPokemon(
                    page,
                    this.#paginationManager.getItemsPerPage()
                );
            }

            console.log('📊 Pokemon API result:', result);
            const { pokemon, totalCount } = result;
            
            this.#currentPokemon = pokemon;
            this.#paginationManager.setTotalItems(totalCount);
            
            if (pokemon.length === 0 && totalCount === 0) {
                console.log('❌ No Pokemon found');
                this.#loadingManager.hideLoading();
                this.#loadingManager.showNoResults();
                this.#clearPokemonGrid();
                this.#paginationManager.hide();
            } else {
                console.log('✅ Rendering', pokemon.length, 'Pokemon');
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
        this.#themeManager = null;
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

    get themeManager() {
        return this.#themeManager;
    }
}