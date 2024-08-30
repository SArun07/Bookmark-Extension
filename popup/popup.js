document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-bookmark');
    const form = document.getElementById('bookmark-form');
    const saveButton = document.getElementById('save-bookmark');
    const cancelButton = document.getElementById('cancel-bookmark');
    const bookmarkTitle = document.getElementById('bookmark-title');
    const bookmarkTags = document.getElementById('bookmark-tags');
    const bookmarkDescription = document.getElementById('bookmark-description');
    const bookmarkList = document.getElementById('bookmark-list');
    const noBookmarksMessage = document.getElementById('no-bookmarks');
    const template = document.getElementById('bookmark-template')

    // Automatically grab current website details
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        bookmarkTitle.value = activeTab.title;
        bookmarkDescription.value = activeTab.url;
    });

    addButton.addEventListener('click', () => {
        form.classList.remove('hidden');
        addButton.classList.add('hidden');
    });

    saveButton.addEventListener('click', () => {
        const title = bookmarkTitle.value;
        const tags = bookmarkTags.value;
        const description = bookmarkDescription.value;

        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            const newBookmark = {
                title,
                url: description,
                tags: tags.split(',').map(tag => tag.trim()),
                description,
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
        bookmarkTitle.value = '';
        bookmarkTags.value = '';
        bookmarkDescription.value = '';
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
                    bookmarkItem.querySelector('h3').textContent = bookmark.title;
                    bookmarkItem.querySelector('.url').textContent = bookmark.url;
                    bookmarkItem.querySelector('.tags').textContent = bookmark.tags.join(', ');
                    bookmarkItem.querySelector('.description').textContent = bookmark.description;

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

    function deleteBookmark(url) {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks.filter(bookmark => bookmark.url !== url);
            chrome.storage.sync.set({ bookmarks }, () => {
                renderBookmarks();
            });
        });
    }

    renderBookmarks();
});
