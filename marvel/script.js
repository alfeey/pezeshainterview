class MarvelCharacters {
  constructor() {
    this.apiBaseURL = 'https://gateway.marvel.com/v1/public';
    this.publicKey = '1c8f5f33fbfcf092b2997f4f298d42e6'; 
    this.privateKey = '753ef396420d1942fa1b0cfe309ee11cd3cb2a91';
    this.characters = [];
    this.offset = 0;
    this.limit = 20;
    this.isLoading = false;
    this.allCharactersLoaded = false;
    this.currentSearchQuery = '';
    
    this.init();
  }
  
  init() {
    this.checkCache();
    this.bindEvents();
    this.loadCharacters();
  }
  
  generateAuthParams() {
    const ts = Date.now().toString();
    const hash = CryptoJS.MD5(ts + this.privateKey + this.publicKey).toString();
    
    return {
      ts: ts,
      apikey: this.publicKey,
      hash: hash
    };
  }
  
  async loadCharacters() {
    if (this.isLoading || this.allCharactersLoaded) return;
    
    this.isLoading = true;
    this.showLoading();
    this.hideError();
    
    try {
      let characters;
      
      // get cached data first if not searching
      if (!this.currentSearchQuery) {
        const cachedData = this.getCachedData(`characters-${this.offset}-${this.limit}`);
        
        if (cachedData) {
          characters = cachedData;
        }
      }
      
      // If no cached data, fetch from API
      if (!characters) {
        characters = await this.fetchCharacters();
        
        // Cache the results if not searching
        if (!this.currentSearchQuery) {
          this.cacheData(`characters-${this.offset}-${this.limit}`, characters);
        }
      }
      
      if (characters.length > 0) {
        this.displayCharacters(characters);
        this.offset += characters.length;
        
        // If we got fewer characters than requested, we've reached the end
        if (characters.length < this.limit) {
          this.allCharactersLoaded = true;
        }
      } else {
        this.allCharactersLoaded = true;
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      this.showError('Failed to load characters. Please try again later.');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }
  
  async fetchCharacters() {
    const authParams = this.generateAuthParams();
    
    const params = {
      ...authParams,
      limit: this.limit,
      offset: this.offset
    };
    
    // Add search query if present
    if (this.currentSearchQuery) {
      params.nameStartsWith = this.currentSearchQuery;
    }
    
    const response = await fetch(
      `${this.apiBaseURL}/characters?` + new URLSearchParams(params)
    );
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your API keys.');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.results;
  }
  
  displayCharacters(characters) {
    const grid = document.getElementById('characterGrid');
    
    // If it's a new search, clear the grid
    if (this.offset === 0) {
      grid.innerHTML = '';
    }
    
    characters.forEach(character => {
      const card = this.createCharacterCard(character);
      grid.appendChild(card);
    });
    
    this.initLazyLoading();
  }
  
  createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.id = character.id;
    
    const imageUrl = `${character.thumbnail.path}/standard_medium.${character.thumbnail.extension}`;
    const imageUrlLarge = `${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}`;
    
    card.innerHTML = `
      <div class="character-image-container">
        <picture>
          <source media="(min-width: 768px)" srcset="${imageUrlLarge}">
          <img 
            src="assets/placeholder.jpg" 
            data-src="${imageUrl}" 
            alt="${character.name}" 
            class="character-image lazy"
          >
        </picture>
      </div>
      <div class="character-info">
        <h3>${character.name}</h3>
        <p>${character.description || 'No description available.'}</p>
      </div>
    `;
    
    //  click event to show character details
    card.addEventListener('click', () => {
      this.showCharacterDetails(character);
    });
    
    return card;
  }
  
  async showCharacterDetails(character) {
    // create and show modal with character details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'characterModal';
    
    // Fetch character comics
    let comicsHtml = '<p>No comics information available.</p>';
    try {
      const comics = await this.fetchCharacterComics(character.id);
      if (comics.length > 0) {
        comicsHtml = '<ul class="comics-list">';
        comics.slice(0, 5).forEach(comic => {
          comicsHtml += `<li>${comic.title} (${new Date(comic.dates[0].date).getFullYear()})</li>`;
        });
        comicsHtml += '</ul>';
        if (comics.length > 5) {
          comicsHtml += `<p>...and ${comics.length - 5} more</p>`;
        }
      }
    } catch (error) {
      console.error('Error fetching comics:', error);
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-header">
          <h2 class="modal-title">${character.name}</h2>
        </div>
        <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" 
             alt="${character.name}" class="modal-image">
        <div class="modal-description">
          <p>${character.description || 'No description available.'}</p>
        </div>
        <div class="modal-comics">
          <h4>Appears in:</h4>
          ${comicsHtml}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Close modal event
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 300);
      }
    });
  }
  
  async fetchCharacterComics(characterId) {
    const authParams = this.generateAuthParams();
    const response = await fetch(
      `${this.apiBaseURL}/characters/${characterId}/comics?` + 
      new URLSearchParams({
        ...authParams,
        limit: 10,
        orderBy: '-onsaleDate'
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch comics: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.results;
  }
  
  initLazyLoading() {
    const lazyImages = document.querySelectorAll('.character-image.lazy');
    
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            lazyImageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => {
        lazyImageObserver.observe(img);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  }
  
  // Caching methods
  cacheData(key, data) {
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  }
  
  getCachedData(key) {
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Cache valid for 24 hours 
    if (now - cacheData.timestamp < 24 * 60 * 60 * 1000) {
      return cacheData.data;
    }
    
    // Cache expired
    localStorage.removeItem(key);
    return null;
  }
  
  checkCache() {
    // check for any cached characters
    const cached = this.getCachedData('characters-0-20');
    if (cached) {
      this.displayCharacters(cached);
      this.offset = 20; // Skip first 20 as they're already displayed
    }
  }
  
  // ui
  showLoading() {
    document.getElementById('loadingIndicator').classList.add('show');
  }
  
  hideLoading() {
    document.getElementById('loadingIndicator').classList.remove('show');
  }
  
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
  
  hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.classList.remove('show');
  }
  
  bindEvents() {
    // continous scroll
    window.addEventListener('scroll', () => {
      if (this.isLoading || this.allCharactersLoaded) return;
      
      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= documentHeight - 200) {
        this.loadCharacters();
      }
    });
    
    // Search function
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', this.debounce(() => {
      this.searchCharacters(searchInput.value);
    }, 500));
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  async searchCharacters(query) {
    // reset for new search
    if (query !== this.currentSearchQuery) {
      this.offset = 0;
      this.allCharactersLoaded = false;
      this.currentSearchQuery = query;
    }
    
    // reset to show all characters
    if (query.length === 0) {
      this.currentSearchQuery = '';
      this.offset = 0;
      this.allCharactersLoaded = false;
      this.loadCharacters();
      return;
    }
    
    // Only search if query is at least 2 characters
    if (query.length < 2) return;
    
    try {
      this.isLoading = true;
      this.showLoading();
      this.hideError();
      
      const characters = await this.fetchCharacters();
      this.displayCharacters(characters);
      this.offset = characters.length;
      
      // If we got fewer characters than requested
      if (characters.length < this.limit) {
        this.allCharactersLoaded = true;
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to search characters. Please try again later.');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MarvelCharacters();
});