import { Pokemon } from '../models/Pokemon.js';

export class PokemonAPI {
    static #instance = null;
    #baseUrl = 'https://pokeapi.co/api/v2';
    #cache = new Map();
    #pokemonList = null;
    #totalPokemon = 500;

    constructor() {
        if (PokemonAPI.#instance) {
            return PokemonAPI.#instance;
        }
        PokemonAPI.#instance = this;
    }

    static getInstance() {
        if (!PokemonAPI.#instance) {
            PokemonAPI.#instance = new PokemonAPI();
        }
        return PokemonAPI.#instance;
    }

    async #fetchWithCache(url, cacheKey) {
        if (this.#cache.has(cacheKey)) {
            return this.#cache.get(cacheKey);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.#cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    }

    async getPokemonList(limit = 500, offset = 0) {
        const cacheKey = `pokemon-list-${limit}-${offset}`;
        
        try {
            const data = await this.#fetchWithCache(
                `${this.#baseUrl}/pokemon?limit=${limit}&offset=${offset}`,
                cacheKey
            );
            
            if (!this.#pokemonList) {
                this.#pokemonList = data.results;
            }
            
            return data.results;
        } catch (error) {
            throw new Error(`Failed to fetch Pokemon list: ${error.message}`);
        }
    }

    async getPokemon(identifier) {
        const cacheKey = `pokemon-${identifier}`;
        
        try {
            // Convert identifier to string and then toLowerCase for names only
            const id = typeof identifier === 'string' ? identifier.toLowerCase() : identifier;
            
            const data = await this.#fetchWithCache(
                `${this.#baseUrl}/pokemon/${id}`,
                cacheKey
            );
            
            return new Pokemon(data);
        } catch (error) {
            throw new Error(`Failed to fetch Pokemon ${identifier}: ${error.message}`);
        }
    }

    async getPokemonBatch(identifiers) {
        console.log('🎯 getPokemonBatch called with', identifiers.length, 'identifiers');
        
        const promises = identifiers.map(id => {
            console.log('🔍 Creating promise for Pokemon ID:', id);
            return this.getPokemon(id);
        });
        
        try {
            console.log('⏳ Executing', promises.length, 'Pokemon fetch promises...');
            const results = await Promise.allSettled(promises);
            
            const successfulResults = results
                .filter(result => {
                    if (result.status === 'fulfilled') {
                        return true;
                    } else {
                        console.warn('⚠️ Failed to fetch Pokemon:', result.reason);
                        return false;
                    }
                })
                .map(result => result.value);
            
            console.log('✅ getPokemonBatch SUCCESS:', successfulResults.length, 'out of', identifiers.length, 'Pokemon fetched');
            return successfulResults;
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in getPokemonBatch:', error);
            throw new Error(`Failed to fetch Pokemon batch: ${error.message}`);
        }
    }

    async getPokemonPage(page = 1, itemsPerPage = 50) {
        console.log('📄 SIMPLIFIED getPokemonPage - page:', page, 'items:', itemsPerPage);
        
        try {
            // Create array of Pokemon IDs to fetch (1-50 for first page)
            const startId = ((page - 1) * itemsPerPage) + 1;
            const endId = Math.min(startId + itemsPerPage - 1, this.#totalPokemon);
            
            console.log('🎯 Fetching Pokemon IDs from', startId, 'to', endId);
            
            const pokemonIds = [];
            for (let i = startId; i <= endId; i++) {
                pokemonIds.push(i);
            }
            
            console.log('📋 Pokemon IDs to fetch:', pokemonIds.slice(0, 10), '... (showing first 10)');
            
            // Fetch Pokemon data
            const pokemonData = await this.getPokemonBatch(pokemonIds);
            
            console.log('✅ SUCCESSFULLY fetched', pokemonData.length, 'Pokemon out of', pokemonIds.length, 'requested');
            
            return {
                pokemon: pokemonData,
                totalCount: this.#totalPokemon,
                currentPage: page,
                totalPages: Math.ceil(this.#totalPokemon / itemsPerPage)
            };
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in getPokemonPage:', error);
            throw error;
        }
    }

    async searchPokemonByName(name, page = 1, itemsPerPage = 50) {
        if (!name || name.trim() === '') {
            return this.getPokemonPage(page, itemsPerPage);
        }

        const searchTerm = name.toLowerCase().trim();
        
        if (!this.#pokemonList) {
            await this.getPokemonList();
        }

        const matchingPokemon = this.#pokemonList
            .filter(pokemon => pokemon.name.includes(searchTerm));

        if (matchingPokemon.length === 0) {
            try {
                const pokemon = await this.getPokemon(searchTerm);
                return {
                    pokemon: [pokemon],
                    totalCount: 1,
                    currentPage: 1,
                    totalPages: 1
                };
            } catch (error) {
                return {
                    pokemon: [],
                    totalCount: 0,
                    currentPage: 1,
                    totalPages: 1
                };
            }
        }

        const totalMatches = matchingPokemon.length;
        const totalPages = Math.ceil(totalMatches / itemsPerPage);
        const offset = (page - 1) * itemsPerPage;
        const paginatedResults = matchingPokemon.slice(offset, offset + itemsPerPage);

        const pokemonData = await this.getPokemonBatch(
            paginatedResults.map(p => p.name)
        );

        return {
            pokemon: pokemonData,
            totalCount: totalMatches,
            currentPage: page,
            totalPages: totalPages
        };
    }

    async getFilteredPokemon(filters = {}, page = 1, itemsPerPage = 50) {
        const { types = [], generation = '', stats = {} } = filters;
        
        console.log('🎯 getFilteredPokemon called with filters:', filters);
        
        let pokemonIds = [];
        
        if (generation) {
            const ranges = {
                '1': [1, 151],
                '2': [152, 251],
                '3': [252, 386],
                '4': [387, 493]
            };
            
            const [min, max] = ranges[generation] || [1, this.#totalPokemon];
            pokemonIds = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        } else {
            pokemonIds = Array.from({ length: this.#totalPokemon }, (_, i) => i + 1);
        }

        const allPokemon = await this.getPokemonBatch(pokemonIds);
        
        let filteredPokemon = allPokemon;

        if (types.length > 0) {
            filteredPokemon = filteredPokemon.filter(pokemon =>
                pokemon.types.some(type => types.includes(type))
            );
        }

        // Only apply stat filters if they're not the default ranges
        if (stats.hp && (stats.hp.min > 0 || stats.hp.max < 255)) {
            filteredPokemon = filteredPokemon.filter(pokemon => {
                const hpStat = pokemon.stats.hp;
                if (!hpStat) return true;
                return hpStat.value >= stats.hp.min && hpStat.value <= stats.hp.max;
            });
        }

        if (stats.attack && (stats.attack.min > 0 || stats.attack.max < 255)) {
            filteredPokemon = filteredPokemon.filter(pokemon => {
                const attackStat = pokemon.stats.attack;
                if (!attackStat) return true;
                return attackStat.value >= stats.attack.min && attackStat.value <= stats.attack.max;
            });
        }

        const totalCount = filteredPokemon.length;
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        const offset = (page - 1) * itemsPerPage;
        const paginatedResults = filteredPokemon.slice(offset, offset + itemsPerPage);

        return {
            pokemon: paginatedResults,
            totalCount: totalCount,
            currentPage: page,
            totalPages: totalPages
        };
    }

    async getInitialPokemon(page = 1, itemsPerPage = 50) {
        console.log('🚀 PokemonAPI.getInitialPokemon called with page:', page, 'itemsPerPage:', itemsPerPage);
        const result = await this.getPokemonPage(page, itemsPerPage);
        console.log('📦 getInitialPokemon result:', result);
        return result;
    }

    getTotalPokemonCount() {
        return this.#totalPokemon;
    }

    clearCache() {
        this.#cache.clear();
        this.#pokemonList = null;
    }

    getCacheSize() {
        return this.#cache.size;
    }
}