export class PokemonCard {
    #pokemon;
    #element;
    #container;

    constructor(pokemon, container) {
        this.#pokemon = pokemon;
        this.#container = container;
        this.#element = null;
        this.#createElement();
    }

    #createElement() {
        this.#element = document.createElement('div');
        this.#element.className = 'pokemon-card rounded-3xl p-6 fade-in cursor-pointer group';
        this.#element.setAttribute('data-pokemon-id', this.#pokemon.id);
        
        this.#element.innerHTML = this.#generateCardHTML();
        this.#addEventListeners();
        this.#applyTypeGradient();
    }

    #generateCardHTML() {
        const stats = this.#pokemon.stats;
        const types = this.#pokemon.types;
        
        return `
            <div class="relative">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-sm font-medium text-gray-800">#${this.#pokemon.id.toString().padStart(3, '0')}</span>
                    <div class="flex gap-2">
                        ${types.map(type => `
                            <span class="type-badge px-3 py-1 rounded-full text-xs font-medium text-white capitalize">
                                ${type}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <div class="text-center mb-6">
                    <div class="relative w-32 h-32 mx-auto mb-4 overflow-hidden rounded-2xl">
                        <img 
                            src="${this.#pokemon.imageUrl}" 
                            alt="${this.#pokemon.displayName}"
                            class="pokemon-image w-full h-full object-contain"
                            loading="lazy"
                            onerror="this.src='/placeholder-pokemon.png'"
                        >
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 group-hover:text-white transition-colors">
                        ${this.#pokemon.displayName}
                    </h3>
                </div>

                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-gray-700 group-hover:text-gray-200">Height</div>
                            <div class="font-semibold text-gray-900 group-hover:text-white">${this.#pokemon.height}m</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-700 group-hover:text-gray-200">Weight</div>
                            <div class="font-semibold text-gray-900 group-hover:text-white">${this.#pokemon.weight}kg</div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <h4 class="text-sm font-semibold text-gray-800 group-hover:text-gray-200 mb-3">Base Stats</h4>
                        <div class="space-y-2">
                            ${this.#generateStatsHTML(stats)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    #generateStatsHTML(stats) {
        const statOrder = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
        
        return statOrder
            .filter(statKey => stats[statKey])
            .map(statKey => {
                const stat = stats[statKey];
                return `
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-medium text-gray-800 group-hover:text-gray-200 w-12 text-right">
                            ${stat.name}
                        </span>
                        <div class="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                            <div 
                                class="stats-bar h-full rounded-full transition-all duration-1000 ease-out"
                                style="
                                    --stat-width: ${stat.percentage}%;
                                    --stat-color: ${this.#getStatColor(stat.value)};
                                    width: ${stat.percentage}%;
                                "
                            ></div>
                        </div>
                        <span class="text-xs font-semibold text-gray-900 group-hover:text-white w-8">
                            ${stat.value}
                        </span>
                    </div>
                `;
            }).join('');
    }

    #getStatColor(value) {
        if (value >= 120) return '#10b981'; 
        if (value >= 90) return '#f59e0b';   
        if (value >= 60) return '#3b82f6';   
        return '#6b7280';                     
    }

    #applyTypeGradient() {
        const colors = this.#pokemon.typeColors;
        let gradient;
        
        if (colors.length === 1) {
            gradient = `linear-gradient(135deg, ${colors[0]}22, ${colors[0]}11)`;
        } else {
            gradient = `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}22)`;
        }
        
        this.#element.style.background = gradient;
    }

    #addEventListeners() {
        this.#element.addEventListener('click', () => {
            this.#showDetailModal();
        });

        this.#element.addEventListener('mouseenter', () => {
            this.#element.style.transform = 'translateY(-8px) scale(1.02)';
        });

        this.#element.addEventListener('mouseleave', () => {
            this.#element.style.transform = 'translateY(0) scale(1)';
        });
    }

    #showDetailModal() {
        console.log(`Showing details for ${this.#pokemon.displayName}`, this.#pokemon);
    }

    render() {
        if (this.#container && !this.#container.contains(this.#element)) {
            this.#container.appendChild(this.#element);
        }
        return this.#element;
    }

    remove() {
        if (this.#element && this.#element.parentNode) {
            this.#element.parentNode.removeChild(this.#element);
        }
    }

    get element() {
        return this.#element;
    }

    get pokemon() {
        return this.#pokemon;
    }

    static createLoadingCard() {
        const loadingCard = document.createElement('div');
        loadingCard.className = 'pokemon-card rounded-3xl p-6 loading-shimmer';
        
        loadingCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-4 bg-white/20 rounded"></div>
                <div class="flex gap-2">
                    <div class="w-16 h-6 bg-white/20 rounded-full"></div>
                </div>
            </div>
            <div class="text-center mb-6">
                <div class="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-2xl"></div>
                <div class="w-24 h-6 bg-white/20 rounded mx-auto"></div>
            </div>
            <div class="space-y-3">
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                        <div class="w-12 h-4 bg-white/20 rounded mx-auto mb-1"></div>
                        <div class="w-8 h-4 bg-white/20 rounded mx-auto"></div>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-4 bg-white/20 rounded mx-auto mb-1"></div>
                        <div class="w-8 h-4 bg-white/20 rounded mx-auto"></div>
                    </div>
                </div>
                <div class="space-y-2 pt-2">
                    <div class="w-16 h-4 bg-white/20 rounded mb-3"></div>
                    ${Array(6).fill(0).map(() => `
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-3 bg-white/20 rounded"></div>
                            <div class="flex-1 h-2 bg-white/20 rounded-full"></div>
                            <div class="w-6 h-3 bg-white/20 rounded"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return loadingCard;
    }
}