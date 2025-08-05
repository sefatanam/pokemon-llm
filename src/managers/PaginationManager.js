import { EventEmitter } from '../utils/EventEmitter.js';

export class PaginationManager extends EventEmitter {
    #currentPage = 1;
    #totalPages = 1;
    #itemsPerPage = 50;
    #totalItems = 0;
    #elements = {};
    #maxVisiblePages = 5;

    constructor(itemsPerPage = 50) {
        super();
        this.#itemsPerPage = itemsPerPage;
        this.#init();
    }

    #init() {
        this.#getElements();
        this.#setupEventListeners();
        this.#updateUI();
    }

    #getElements() {
        this.#elements = {
            container: document.getElementById('paginationContainer'),
            prevButton: document.getElementById('prevPage'),
            nextButton: document.getElementById('nextPage'),
            pageNumbers: document.getElementById('pageNumbers'),
            resultsInfo: document.getElementById('resultsInfo'),
            resultsCount: document.getElementById('resultsCount')
        };
    }

    #setupEventListeners() {
        if (this.#elements.prevButton) {
            this.#elements.prevButton.addEventListener('click', () => {
                this.#goToPreviousPage();
            });
        }

        if (this.#elements.nextButton) {
            this.#elements.nextButton.addEventListener('click', () => {
                this.#goToNextPage();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft' && event.ctrlKey) {
                event.preventDefault();
                this.#goToPreviousPage();
            } else if (event.key === 'ArrowRight' && event.ctrlKey) {
                event.preventDefault();
                this.#goToNextPage();
            }
        });
    }

    #goToPreviousPage() {
        if (this.#currentPage > 1) {
            this.goToPage(this.#currentPage - 1);
        }
    }

    #goToNextPage() {
        if (this.#currentPage < this.#totalPages) {
            this.goToPage(this.#currentPage + 1);
        }
    }

    #updateUI() {
        this.#updateNavigationButtons();
        this.#updatePageNumbers();
        this.#updateResultsInfo();
    }

    #updateNavigationButtons() {
        if (this.#elements.prevButton) {
            this.#elements.prevButton.disabled = this.#currentPage <= 1;
        }

        if (this.#elements.nextButton) {
            this.#elements.nextButton.disabled = this.#currentPage >= this.#totalPages;
        }
    }

    #updatePageNumbers() {
        if (!this.#elements.pageNumbers) return;

        const pageButtons = this.#generatePageButtons();
        this.#elements.pageNumbers.innerHTML = pageButtons.join('');

        this.#elements.pageNumbers.addEventListener('click', (event) => {
            if (event.target.classList.contains('page-btn') && !event.target.disabled) {
                const page = parseInt(event.target.dataset.page);
                if (page && page !== this.#currentPage) {
                    this.goToPage(page);
                }
            }
        });
    }

    #generatePageButtons() {
        const buttons = [];
        const startPage = Math.max(1, this.#currentPage - Math.floor(this.#maxVisiblePages / 2));
        const endPage = Math.min(this.#totalPages, startPage + this.#maxVisiblePages - 1);

        if (startPage > 1) {
            buttons.push(this.#createPageButton(1));
            if (startPage > 2) {
                buttons.push('<span class="px-2 text-gray-500">...</span>');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(this.#createPageButton(i));
        }

        if (endPage < this.#totalPages) {
            if (endPage < this.#totalPages - 1) {
                buttons.push('<span class="px-2 text-gray-500">...</span>');
            }
            buttons.push(this.#createPageButton(this.#totalPages));
        }

        return buttons;
    }

    #createPageButton(page) {
        const isActive = page === this.#currentPage;
        const classes = `page-btn ${isActive ? 'active' : ''}`;
        
        return `
            <button 
                class="${classes}" 
                data-page="${page}"
                ${isActive ? 'disabled' : ''}
            >
                ${page}
            </button>
        `;
    }

    #updateResultsInfo() {
        if (!this.#elements.resultsCount) return;

        const startItem = (this.#currentPage - 1) * this.#itemsPerPage + 1;
        const endItem = Math.min(this.#currentPage * this.#itemsPerPage, this.#totalItems);

        if (this.#totalItems > 0) {
            this.#elements.resultsCount.textContent = 
                `Showing ${startItem}-${endItem} of ${this.#totalItems} Pokemon`;
        } else {
            this.#elements.resultsCount.textContent = 'No Pokemon found';
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.#totalPages || page === this.#currentPage) {
            return;
        }

        this.#currentPage = page;
        this.#updateUI();
        
        this.emit('pagination:pageChanged', {
            page: this.#currentPage,
            offset: (this.#currentPage - 1) * this.#itemsPerPage,
            limit: this.#itemsPerPage
        });

        this.#scrollToTop();
    }

    #scrollToTop() {
        const pokemonGrid = document.getElementById('pokemonGrid');
        if (pokemonGrid) {
            pokemonGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    setTotalItems(totalItems) {
        this.#totalItems = totalItems;
        this.#totalPages = Math.ceil(totalItems / this.#itemsPerPage);
        
        if (this.#currentPage > this.#totalPages) {
            this.#currentPage = Math.max(1, this.#totalPages);
        }

        this.#updateUI();
    }

    reset() {
        this.#currentPage = 1;
        this.#totalItems = 0;
        this.#totalPages = 1;
        this.#updateUI();
    }

    getCurrentPage() {
        return this.#currentPage;
    }

    getTotalPages() {
        return this.#totalPages;
    }

    getItemsPerPage() {
        return this.#itemsPerPage;
    }

    getTotalItems() {
        return this.#totalItems;
    }

    getCurrentOffset() {
        return (this.#currentPage - 1) * this.#itemsPerPage;
    }

    getCurrentRange() {
        const startItem = (this.#currentPage - 1) * this.#itemsPerPage + 1;
        const endItem = Math.min(this.#currentPage * this.#itemsPerPage, this.#totalItems);
        return { start: startItem, end: endItem };
    }

    setItemsPerPage(itemsPerPage) {
        if (itemsPerPage > 0 && itemsPerPage !== this.#itemsPerPage) {
            this.#itemsPerPage = itemsPerPage;
            this.#totalPages = Math.ceil(this.#totalItems / this.#itemsPerPage);
            this.#currentPage = 1;
            this.#updateUI();
        }
    }

    hide() {
        if (this.#elements.container) {
            this.#elements.container.style.display = 'none';
        }
    }

    show() {
        if (this.#elements.container) {
            this.#elements.container.style.display = '';
        }
    }

    destroy() {
        this._events = {};
    }
}