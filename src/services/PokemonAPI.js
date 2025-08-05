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
            const data = await this.#fetchWithCache(
                `${this.#baseUrl}/pokemon/${identifier.toLowerCase()}`,
                cacheKey
            );
            
            return new Pokemon(data);
        } catch (error) {
            throw new Error(`Failed to fetch Pokemon ${identifier}: ${error.message}`);
        }
    }

    async getPokemonBatch(identifiers) {
        const promises = identifiers.map(id => this.getPokemon(id));
        
        try {
            const results = await Promise.allSettled(promises);
            
            return results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
        } catch (error) {
            throw new Error(`Failed to fetch Pokemon batch: ${error.message}`);
        }
    }

    async getPokemonPage(page = 1, itemsPerPage = 50) {
        const offset = (page - 1) * itemsPerPage;
        const limit = Math.min(itemsPerPage, this.#totalPokemon - offset);
        
        if (offset >= this.#totalPokemon) {
            return {
                pokemon: [],
                totalCount: this.#totalPokemon,
                currentPage: page,
                totalPages: Math.ceil(this.#totalPokemon / itemsPerPage)
            };
        }

        try {
            const pokemonIds = Array.from(
                { length: limit }, 
                (_, i) => offset + i + 1
            );
            
            const pokemonData = await this.getPokemonBatch(pokemonIds);
            
            return {
                pokemon: pokemonData,
                totalCount: this.#totalPokemon,
                currentPage: page,
                totalPages: Math.ceil(this.#totalPokemon / itemsPerPage)
            };
        } catch (error) {
            throw new Error(`Failed to fetch Pokemon page: ${error.message}`);
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

        if (stats.hp) {
            filteredPokemon = filteredPokemon.filter(pokemon => {
                const hpStat = pokemon.stats.hp;
                if (!hpStat) return true;
                return hpStat.value >= stats.hp.min && hpStat.value <= stats.hp.max;
            });
        }

        if (stats.attack) {
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
        return this.getPokemonPage(page, itemsPerPage);
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