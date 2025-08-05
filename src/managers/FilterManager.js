import { EventEmitter } from '../utils/EventEmitter.js';

export class FilterManager extends EventEmitter {
    #elements = {};
    #filters = {
        types: new Set(),
        generation: '',
        stats: {
            hp: { min: 0, max: 255 },
            attack: { min: 0, max: 255 }
        }
    };
    #pokemonTypes = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];

    constructor() {
        super();
        this.#init();
    }

    #init() {
        this.#getElements();
        this.#setupMobileToggle();
        this.#renderTypeFilters();
        this.#setupEventListeners();
    }

    #getElements() {
        this.#elements = {
            sidebar: document.getElementById('filterSidebar'),
            overlay: document.getElementById('filterOverlay'),
            mobileToggle: document.getElementById('mobileFilterToggle'),
            mobileClose: document.getElementById('closeMobileFilter'),
            typeFilters: document.getElementById('typeFilters'),
            generationFilter: document.getElementById('generationFilter'),
            clearFilters: document.getElementById('clearFilters'),
            hpMin: document.getElementById('hpMin'),
            hpMax: document.getElementById('hpMax'),
            hpValue: document.getElementById('hpValue'),
            attackMin: document.getElementById('attackMin'),
            attackMax: document.getElementById('attackMax'),
            attackValue: document.getElementById('attackValue')
        };
    }

    #setupMobileToggle() {
        if (this.#elements.mobileToggle) {
            this.#elements.mobileToggle.addEventListener('click', () => {
                this.#openMobileFilter();
            });
        }

        if (this.#elements.mobileClose) {
            this.#elements.mobileClose.addEventListener('click', () => {
                this.#closeMobileFilter();
            });
        }

        if (this.#elements.overlay) {
            this.#elements.overlay.addEventListener('click', () => {
                this.#closeMobileFilter();
            });
        }
    }

    #openMobileFilter() {
        if (this.#elements.sidebar && this.#elements.overlay) {
            this.#elements.sidebar.classList.add('open');
            this.#elements.sidebar.classList.remove('translate-x-full');
            this.#elements.sidebar.classList.add('translate-x-0');
            this.#elements.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    #closeMobileFilter() {
        if (this.#elements.sidebar && this.#elements.overlay) {
            this.#elements.sidebar.classList.remove('open');
            this.#elements.sidebar.classList.add('translate-x-full');
            this.#elements.sidebar.classList.remove('translate-x-0');
            this.#elements.overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    #renderTypeFilters() {
        if (!this.#elements.typeFilters) return;

        this.#elements.typeFilters.innerHTML = this.#pokemonTypes.map(type => `
            <button 
                class="type-filter-btn capitalize" 
                data-type="${type}"
                title="Filter by ${type} type"
            >
                ${type}
            </button>
        `).join('');
    }

    #setupEventListeners() {
        if (this.#elements.typeFilters) {
            this.#elements.typeFilters.addEventListener('click', (event) => {
                if (event.target.classList.contains('type-filter-btn')) {
                    this.#toggleTypeFilter(event.target.dataset.type);
                }
            });
        }

        if (this.#elements.generationFilter) {
            this.#elements.generationFilter.addEventListener('change', (event) => {
                this.#setGenerationFilter(event.target.value);
            });
        }

        if (this.#elements.clearFilters) {
            this.#elements.clearFilters.addEventListener('click', () => {
                this.#clearAllFilters();
            });
        }

        this.#setupStatRangeListeners();
    }

    #setupStatRangeListeners() {
        const statElements = [
            { min: this.#elements.hpMin, max: this.#elements.hpMax, label: this.#elements.hpValue, stat: 'hp' },
            { min: this.#elements.attackMin, max: this.#elements.attackMax, label: this.#elements.attackValue, stat: 'attack' }
        ];

        statElements.forEach(({ min, max, label, stat }) => {
            if (min && max && label) {
                const updateRange = () => {
                    const minVal = parseInt(min.value);
                    const maxVal = parseInt(max.value);
                    
                    if (minVal > maxVal) {
                        min.value = maxVal;
                    }
                    
                    this.#filters.stats[stat] = {
                        min: parseInt(min.value),
                        max: parseInt(max.value)
                    };
                    
                    label.textContent = `${min.value}-${max.value}`;
                    this.#emitFiltersChanged();
                };

                min.addEventListener('input', updateRange);
                max.addEventListener('input', updateRange);
            }
        });
    }

    #toggleTypeFilter(type) {
        const button = this.#elements.typeFilters.querySelector(`[data-type="${type}"]`);
        if (!button) return;

        if (this.#filters.types.has(type)) {
            this.#filters.types.delete(type);
            button.classList.remove('active');
        } else {
            this.#filters.types.add(type);
            button.classList.add('active');
        }

        this.#emitFiltersChanged();
    }

    #setGenerationFilter(generation) {
        this.#filters.generation = generation;
        this.#emitFiltersChanged();
    }

    #clearAllFilters() {
        this.#filters.types.clear();
        this.#filters.generation = '';
        this.#filters.stats = {
            hp: { min: 0, max: 255 },
            attack: { min: 0, max: 255 }
        };

        this.#updateUI();
        this.#emitFiltersChanged();
    }

    #updateUI() {
        document.querySelectorAll('.type-filter-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.#elements.generationFilter) {
            this.#elements.generationFilter.value = '';
        }

        if (this.#elements.hpMin) this.#elements.hpMin.value = 0;
        if (this.#elements.hpMax) this.#elements.hpMax.value = 255;
        if (this.#elements.hpValue) this.#elements.hpValue.textContent = '0-255';

        if (this.#elements.attackMin) this.#elements.attackMin.value = 0;
        if (this.#elements.attackMax) this.#elements.attackMax.value = 255;
        if (this.#elements.attackValue) this.#elements.attackValue.textContent = '0-255';
    }

    #emitFiltersChanged() {
        this.emit('filters:changed', this.getActiveFilters());
    }

    getActiveFilters() {
        return {
            types: Array.from(this.#filters.types),
            generation: this.#filters.generation,
            stats: { ...this.#filters.stats }
        };
    }

    hasActiveFilters() {
        return this.#filters.types.size > 0 ||
               this.#filters.generation !== '';
    }

    applyFilters(pokemon) {
        return pokemon.filter(poke => {
            if (this.#filters.types.size > 0) {
                const hasMatchingType = poke.types.some(type => 
                    this.#filters.types.has(type)
                );
                if (!hasMatchingType) return false;
            }

            if (this.#filters.generation) {
                const gen = parseInt(this.#filters.generation);
                const ranges = {
                    1: [1, 151],
                    2: [152, 251],
                    3: [252, 386],
                    4: [387, 493]
                };
                
                const [min, max] = ranges[gen] || [0, 0];
                if (poke.id < min || poke.id > max) return false;
            }

            const stats = poke.stats;
            if (stats.hp) {
                const hp = stats.hp.value;
                if (hp < this.#filters.stats.hp.min || hp > this.#filters.stats.hp.max) {
                    return false;
                }
            }

            if (stats.attack) {
                const attack = stats.attack.value;
                if (attack < this.#filters.stats.attack.min || attack > this.#filters.stats.attack.max) {
                    return false;
                }
            }

            return true;
        });
    }

    destroy() {
        this.#closeMobileFilter();
        this._events = {};
    }
}