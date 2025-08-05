import { Pokemon } from '../models/Pokemon.js';

export class PokemonAPI {
    static #instance = null;
    #baseUrl = 'https://pokeapi.co/api/v2';
    #cache = new Map();
    #pokemonList = null;

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

    async getPokemonList(limit = 150, offset = 0) {
        const cacheKey = `pokemon-list-${limit}-${offset}`;
        
        try {
            const data = await this.#fetchWithCache(
                `${this.#baseUrl}/pokemon?limit=${limit}&offset=${offset}`,
                cacheKey
            );
            
            this.#pokemonList = data.results;
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

    async searchPokemonByName(name) {
        if (!name || name.trim() === '') {
            return [];
        }

        const searchTerm = name.toLowerCase().trim();
        
        if (!this.#pokemonList) {
            await this.getPokemonList();
        }

        const matchingPokemon = this.#pokemonList
            .filter(pokemon => pokemon.name.includes(searchTerm))
            .slice(0, 20);

        if (matchingPokemon.length === 0) {
            try {
                const pokemon = await this.getPokemon(searchTerm);
                return [pokemon];
            } catch (error) {
                return [];
            }
        }

        const pokemonData = await this.getPokemonBatch(
            matchingPokemon.map(p => p.name)
        );

        return pokemonData;
    }

    async getInitialPokemon(count = 50) {
        try {
            const pokemonList = await this.getPokemonList(count);
            const pokemonData = await this.getPokemonBatch(
                pokemonList.slice(0, count).map((_, index) => index + 1)
            );
            
            return pokemonData;
        } catch (error) {
            throw new Error(`Failed to fetch initial Pokemon: ${error.message}`);
        }
    }

    clearCache() {
        this.#cache.clear();
        this.#pokemonList = null;
    }

    getCacheSize() {
        return this.#cache.size;
    }
}