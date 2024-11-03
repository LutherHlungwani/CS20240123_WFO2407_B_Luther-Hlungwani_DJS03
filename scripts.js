import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

let page = 1;
let matches = books;

// BookPreview Web Component Definition
class BookPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        // Define the HTML template and CSS for the component
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
            .preview {
                display: flex;
                align-items: center;
                padding: 0.5rem 1rem;
                background: rgba(var(--color-light), 1);
                border-radius: 8px;
                border: 1px solid rgba(var(--color-dark), 0.15);
                cursor: pointer;
                width: 100%;
            }
            .preview__image {
                width: 48px;
                height: 70px;
                object-fit: cover;
                border-radius: 2px;
                margin-right: 1rem;
            }
            .preview__info {
                display: flex;
                flex-direction: column;
            }
            .preview__title {
                font-weight: bold;
                color: rgba(var(--color-dark), 0.8);
                margin: 0;
            }
            .preview__author {
                color: rgba(var(--color-dark), 0.4);
            }
        </style>
        <div class="preview">
            <img class="preview__image" src="" alt="Book Cover">
            <div class="preview__info">
                <h3 class="preview__title"></h3>
                <div class="preview__author"></div>
            </div>
        </div>
    `;
    //Append template to shadow DOM
    this.shadowRoot.appendChild(template.content.cloneNode(true));
} 

static get observedAttributes() {
    return ['title', 'author', 'image'];

}

attributrChangedCallback(name, oldValue, newValue) {
    const element = this.shadowRoot.querySelector(`.preview__${name}`);
    if (name === 'image') {
        element.src = newValue;
    } else {
        element.textContent = newValue;
    }
}

}

// Register BookPreview Web Component
customElements.define('book-preview', BookPreview);

function init() {
    renderBooks(matches.slice(0, BOOKS_PER_PAGE));
    populateDropdowns();
    setupTheme();
    updateShowMoreButton();
    addEventsListeners();

}

// Render Books Using the New BookPreview Component

function renderBooks(bookList) {
    const bookListContainer = document.querySelector('[data-list-items]');
    bookListContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    bookList.forEach(({author, id, image, title}) => {
        const element = document.createElement('button');
        element.classList = 'preview';
        element.setAttribute('data-preview', id);
        element.innerHTML = `
        <img class="preview__image" src="${image}" />
        <div class="preview__info">
            <h3 class="preview__title">${title}</h3>
            <div class="preview__author">${authors[author]}</div>
        </div>`;
        fragment.appendChild(element);
    });

    bookListContainer.appendChild(fragment);

}

// Populate Dropdowns for Genre and Authors
function populateDropdowns() {
    const genreDropdown = document.querySelector('[data-search-genres]');
    const authorDropdown = document.querySelector('[data-search-authors]');
    genreDropdown.innerHTML = '<option value="any">All Genres</option>';
    authorDropdown.innerHTML = '<option value="any">All Authors</option>';

    Object.entries(genres).forEach(([id, name]) => genreDropdown.appendChild(createOption(id, name)));
    Object.entries(authors).forEach(([id, name]) => authorDropdown.appendChild(createOption(id, name)));

}

function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.innerText = text;
    return option;

}

// Set Initial Theme

function setupTheme() {
    const theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    document.querySelector('[data-settings-theme]').value === theme;
    setTheme(theme);
}

function setTheme(theme) {
    document.documentElement.style.setProperty('--color-dark', theme === 'night' ? '255, 255, 255' : '10, 10, 20');
    document.documentElement.style.setProperty('--color-light', theme === 'night' ? '10, 10, 20' : '255, 255, 255');
}

// Update "Show More" Button Text and State
function updateShowMoreButton() {
    const button = document.querySelector('[data-list-button]');
    const remainingBooks = matches.length - page * BOOKS_PER_PAGE;
    button.classList.add('list__button');
    button.disabled = remainingBooks <= 0;
    button.innerHTML = `<span>Show more</span> <span class="list__remaining">(${Math.max(remainingBooks, 0)})</span>`;

}

// Event Listeners

function addEventsListeners() {
    document.querySelector('[data-search-cancel]').addEventListener('click', () => toggleOverlay('[data-search-overlay]', false));
    document.querySelector('[data-settings-cancel]').addEventListener('click', () => toggleOverlay('[data-settings-overlay]', false));
    document.querySelector('[data-header-search]').addEventListener('click', () => toggleOverlay('[data-search-overlay]', true));
    document.querySelector('[data-header-settings]').addEventListener('click', () => toggleOverlay('[data-settings-overlay]', true));
    document.querySelector('[data-list-close]').addEventListener('click', () => toggleOverlay('[data-list-active]', false));
    document.querySelector('[data-settings-form]').addEventListener('submit', handleThemeChange);
    document.querySelector('[data-search-form]').addEventListener('submit', handleSearch);
    document.querySelector('[data-list-button]').addEventListener('click', showMoreBooks);
    document.querySelector('[data-list-items]').addEventListener('click', showBookDetails);
}

function toggleOverlay(selector, open) {
    document.querySelector(selector).open = open;
}

// Handle Theme Change
function handleThemeChange(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    setTheme(formData.get('theme'));
    toggleOverlay('[data-settings-overlay]', false);
}

// Handle Book Search
function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    matches = filterBooks(filters);
    page = 1;
    renderBooks(matches.slice(0, BOOKS_PER_PAGE));
    updateShowMoreButton();
    toggleOverlay('[data-search-overlay]', false);
}

// Filter Books Based on Search Criteria
function filterBooks(filters) {
    return books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        const titleMatch = filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase());
        const authorMatch = filters.author === 'any' || book.author === filters.author;
        return genreMatch && titleMatch && authorMatch;
    });
} 

// Show More Books
function showMoreBooks() {
    renderBooks(matches.slice(page * BOOKS_PER_PAGE, ++page * BOOKS_PER_PAGE));
    updateShowMoreButton();
}

// Show Book Details
function showBookDetails(event) {
    const preview = event.target.closest('[data-preview]');
    if (preview) {
        const book = books.find(b => b.id === preview.getAttribute('data-preview'));
        if (book) displayBookDetails(book);
    }
}


function displayBookDetails({author, image, title, description, published }) {
    const activeOverlay = document.querySelector('[data-list-active]');
    activeOverlay.classList.add('overlay', 'overlay__content');
    activeOverlay.open = true;
    document.querySelector('[data-list-active]').open = true;
    document.querySelector('[data-list-blur]').src = image;
    document.querySelector('[data-list-image]').src = image;
    document.querySelector('[data-list-title]').innerText = title;
    document.querySelector('[data-list-subtitle]').innerText = `${authors[author]} (${new Date(published).getFullYear()})`;
    document.querySelector('[data-list-description]').innerText = description;
}

// Initialize the app
init();