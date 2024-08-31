document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-bookmark');
    const form = document.getElementById('bookmark-form');
    const saveButton = document.getElementById('save-bookmark');
    const cancelButton = document.getElementById('cancel-bookmark');
    const bookmarkTitle = document.getElementById('bookmark-title');
    const myurl = document.getElementById('bookmark-urlinput'); 
    const bookmarkDescription = document.getElementById('bookmark-description'); 
    const bookmarkList = document.getElementById('bookmark-list');
    const noBookmarksMessage = document.getElementById('no-bookmarks');
    const template = document.getElementById('bookmark-template');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        bookmarkTitle.value = activeTab.title;
        myurl.value = activeTab.url; 
        bookmarkDescription.value = activeTab.title;
    });

    addButton.addEventListener('click', () => {
        form.classList.remove('hidden');
        addButton.classList.add('hidden');
    });

    saveButton.addEventListener('click', () => {
        const title = bookmarkTitle.value;
        const url = myurl.value; 
        const urlinput = bookmarkDescription.value; 

        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            const newBookmark = {
                title,
                url, 
                urlinput, 
                description: "", 
                timestamp: new Date().getTime(),
            };
            bookmarks.push(newBookmark);
            chrome.storage.sync.set({ bookmarks }, () => {
                renderBookmarks();
                form.classList.add('hidden');
                addButton.classList.remove('hidden');
            });
        });
    });

    cancelButton.addEventListener('click', () => {
        form.classList.add('hidden');
        addButton.classList.remove('hidden');
    });

    function renderBookmarks() {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            bookmarkList.innerHTML = '';
            const sortedBookmarks = data.bookmarks.sort((a, b) => b.timestamp - a.timestamp);

            if (sortedBookmarks.length === 0) {
                noBookmarksMessage.classList.remove('hidden');
            } else {
                noBookmarksMessage.classList.add('hidden');

                sortedBookmarks.forEach((bookmark, index) => {
                    const clone = document.importNode(template.content, true);
                    const bookmarkItem = clone.querySelector('.bookmark-item');

                    // Truncate the title if it's longer than 10 characters
                    const truncatedTitle = bookmark.title.length > 10
                    ? `${bookmark.title.substring(0, 12)}...`
                    : bookmark.title;

                    // Truncate the title if it's longer than 10 characters
                    const truncateUrl = bookmark.url.length > 10
                    ? `${bookmark.url.substring(0, 25)}...`
                    : bookmark.url;

                    bookmarkItem.querySelector('h3').textContent = truncatedTitle;
                    bookmarkItem.querySelector('.url').textContent = truncateUrl;
                    bookmarkItem.querySelector('.urlinput').textContent = bookmark.urlinput;
                    bookmarkItem.querySelector('.description').textContent = ''; // Leave description empty

                    // Extract the domain from the URL
                    const urlObj = new URL(bookmark.url);
                    const domain = urlObj.origin;

                    // Try to fetch the favicon from the root domain
                    const faviconUrl = `${domain}/favicon.ico`;
                    fetchFavicon(faviconUrl, bookmarkItem, bookmark.title, bookmark.url);

                    // Copy button functionality
                    const copyButton = bookmarkItem.querySelector('.copy-button');
                    copyButton.addEventListener('click', () => {
                        copyToClipboard(bookmark.url);
                    });

                     // Share button functionality
                    const shareButton = bookmarkItem.querySelector('.share-button');
                    shareButton.addEventListener('click', () => {
                        shareBookmark(bookmark.title, bookmark.url);
                    });

                    // Open button functionality
                    const openButton = bookmarkItem.querySelector('.open-button');
                    openButton.addEventListener('click', () => {
                        openBookmarkInNewTab(bookmark.url);
                    });

                    // Delete functionality
                    const deleteButton = bookmarkItem.querySelector('.delete-bookmark');
                    deleteButton.setAttribute('data-url', bookmark.url);
                    deleteButton.addEventListener('click', () => {
                        deleteBookmark(bookmark.url);
                    });

                    bookmarkList.appendChild(bookmarkItem);
                });
            }
        });
    }

    function openBookmarkInNewTab(url) {
        chrome.tabs.create({ url });
    }
    

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccessMessage();
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    function showCopySuccessMessage() {
        let copyMessage = document.getElementById('copy-success-message');
        
        if (!copyMessage) {
            copyMessage = document.createElement('div');
            copyMessage.id = 'copy-success-message';
            copyMessage.className = 'copy-success';
            copyMessage.textContent = 'URL copied successfully!';
            document.body.appendChild(copyMessage);
        }
    
        copyMessage.classList.add('show');
    
        setTimeout(() => {
            copyMessage.classList.remove('show');
        }, 2000); // Message will disappear after 2 seconds
    }

    function shareBookmark(title, url) {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            alert('Web Share API is not supported in this browser.');
        }
    }

    function fetchFavicon(faviconUrl, bookmarkItem, title, url) {
        const img = new Image();
        img.src = faviconUrl;

        img.onload = () => {
            bookmarkItem.querySelector('.logo-item img').src = faviconUrl;
        };

        img.onerror = () => {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    const faviconLink = doc.querySelector('link[rel~="icon"]');
                    if (faviconLink) {
                        bookmarkItem.querySelector('.logo-item img').src = faviconLink.href;
                    } else {
                        bookmarkItem.querySelector('.logo-item img').src = '../icons/icon.png'; 
                    }
                })
                .catch(() => {
                    bookmarkItem.querySelector('.logo-item img').src = '../icons/icon.png'; 
                });
        };
    }

    function deleteBookmark(url) {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks.filter(bookmark => bookmark.url !== url);
            chrome.storage.sync.set({ bookmarks }, () => {
                renderBookmarks();
            });
        });
    }

    
    //  for search functionality
    searchButton.addEventListener('click', () => {
        if (searchInput.classList.contains('hidden')) {
            searchInput.classList.remove('hidden');
            searchInput.classList.add('visible');
            searchInput.focus();
        } else {
            searchInput.classList.add('hidden');
            searchInput.classList.remove('visible');
            clearHighlights();
            searchInput.value = '';
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        clearHighlights();

        if (query) {
            highlightSearch(query);
        }
    });

    function highlightSearch(query) {
        const bookmarkItems = document.querySelectorAll('.bookmark-item');
        bookmarkItems.forEach(item => {
            const titleElement = item.querySelector('h3');
            const descriptionElement = item.querySelector('.description');
            const urlElement = item.querySelector('.url');

            const elementsToSearch = [titleElement, descriptionElement, urlElement];

            elementsToSearch.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (text.includes(query)) {
                    const regex = new RegExp(`(${query})`, 'gi');
                    element.innerHTML = element.textContent.replace(regex, `<span class="highlight">$1</span>`);
                }
            });
        });
    }

    function clearHighlights() {
        const highlightedElements = document.querySelectorAll('.highlight');
        highlightedElements.forEach(element => {
            element.outerHTML = element.textContent;
        });
    }

    renderBookmarks();
});
