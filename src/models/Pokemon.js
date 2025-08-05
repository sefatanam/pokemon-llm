export class Pokemon {
    #id;
    #name;
    #types;
    #stats;
    #sprites;
    #height;
    #weight;

    constructor(data) {
        this.#id = data.id;
        this.#name = data.name;
        this.#types = data.types?.map(type => type.type.name) || [];
        this.#stats = this.#processStats(data.stats || []);
        this.#sprites = data.sprites || {};
        this.#height = data.height || 0;
        this.#weight = data.weight || 0;
    }

    #processStats(stats) {
        const processedStats = {};
        stats.forEach(stat => {
            const statName = stat.stat.name.replace('-', '_');
            processedStats[statName] = {
                name: this.#formatStatName(stat.stat.name),
                value: stat.base_stat,
                percentage: Math.min((stat.base_stat / 200) * 100, 100)
            };
        });
        return processedStats;
    }

    #formatStatName(name) {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get displayName() {
        return this.#name.charAt(0).toUpperCase() + this.#name.slice(1);
    }

    get types() {
        return [...this.#types];
    }

    get primaryType() {
        return this.#types[0] || 'normal';
    }

    get stats() {
        return { ...this.#stats };
    }

    get imageUrl() {
        return this.#sprites.other?.['official-artwork']?.front_default || 
               this.#sprites.front_default || 
               '/placeholder-pokemon.png';
    }

    get height() {
        return this.#height / 10;
    }

    get weight() {
        return this.#weight / 10;
    }

    get typeColors() {
        const colors = {
            normal: '#A8A878',
            fire: '#F08030',
            water: '#6890F0',
            electric: '#F8D030',
            grass: '#78C850',
            ice: '#98D8D8',
            fighting: '#C03028',
            poison: '#A040A0',
            ground: '#E0C068',
            flying: '#A890F0',
            psychic: '#F85888',
            bug: '#A8B820',
            rock: '#B8A038',
            ghost: '#705898',
            dragon: '#7038F8',
            dark: '#705848',
            steel: '#B8B8D0',
            fairy: '#EE99AC'
        };
        return this.#types.map(type => colors[type] || colors.normal);
    }

    matchesSearch(query) {
        if (!query || query.trim() === '') return true;
        
        const searchTerm = query.toLowerCase().trim();
        return this.#name.toLowerCase().includes(searchTerm) ||
               this.#types.some(type => type.toLowerCase().includes(searchTerm));
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            types: this.#types,
            stats: this.#stats,
            sprites: this.#sprites,
            height: this.#height,
            weight: this.#weight
        };
    }
}