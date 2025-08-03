import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import auth from './script.js'
import app from './firebaseSetup.js'

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message and type
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

const firestore = getFirestore(app)

// Blog data storage
let blogData = {
    title: '',
    subtitle: '',
    authorName: '',
    username: '',
    publishDate: '',
    category: '',
    body: ''
};

// DOM Elements
const blogDetailsStep = document.getElementById('blogDetailsStep');
const blogBodyStep = document.getElementById('blogBodyStep');
const blogDetailsForm = document.getElementById('blogDetailsForm');
const nextToBodyBtn = document.getElementById('nextToBodyStep');
const backToDetailsBtn = document.getElementById('backToDetails');
const blogEditor = document.getElementById('blogEditor');
const editorTitle = document.getElementById('editorTitle');
const publishBtn = document.getElementById('publishBlog');

// Dialog elements
const linkDialog = document.getElementById('linkDialog');
const imageDialog = document.getElementById('imageDialog');

let currentSelection = { start: 0, end: 0 };

// Auto-populate user data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default publish date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('publishDate').value = today;
    
    // Setup editor
    setupMarkdownEditor();
    
    // Wait for auth state and populate user data
    setTimeout(() => {
        if (auth.currentUser) {
            populateUserData();
        }
    }, 1000);
});

function setupMarkdownEditor() {
    // Make the editor a textarea instead of contenteditable
    blogEditor.contentEditable = false;
    blogEditor.innerHTML = '';
    
    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.id = 'markdownEditor';
    textarea.className = 'markdown-textarea';
    textarea.placeholder = 'Start writing your blog content here...\n\nYou can use markdown syntax:\n**bold**, *italic*, # Heading, [link](url), ![image](url), etc.';
    textarea.style.cssText = `
        width: 100%;
        min-height: 500px;
        padding: 20px;
        font-size: 1.1rem;
        line-height: 1.7;
        color: #333;
        border: none;
        outline: none;
        resize: vertical;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: transparent;
    `;
    
    blogEditor.appendChild(textarea);
    
    // Store reference to textarea
    window.markdownEditor = textarea;
    
    // Add event listeners for selection tracking
    textarea.addEventListener('selectionchange', updateSelection);
    textarea.addEventListener('keyup', updateSelection);
    textarea.addEventListener('mouseup', updateSelection);
}

function updateSelection() {
    const textarea = window.markdownEditor;
    currentSelection.start = textarea.selectionStart;
    currentSelection.end = textarea.selectionEnd;
}

function getSelectedText() {
    const textarea = window.markdownEditor;
    return textarea.value.substring(currentSelection.start, currentSelection.end);
}

function insertTextAtCursor(text, selectText = false) {
    const textarea = window.markdownEditor;
    const start = currentSelection.start;
    const end = currentSelection.end;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    textarea.value = beforeText + text + afterText;
    
    if (selectText) {
        textarea.setSelectionRange(start, start + text.length);
    } else {
        textarea.setSelectionRange(start + text.length, start + text.length);
    }
    
    textarea.focus();
    updateSelection();
}

function wrapSelectedText(prefix, suffix = '') {
    const selectedText = getSelectedText();
    const textarea = window.markdownEditor;
    
    if (selectedText) {
        const newText = prefix + selectedText + suffix;
        insertTextAtCursor(newText);
    } else {
        const placeholder = suffix ? 'text' : 'text';
        const newText = prefix + placeholder + suffix;
        insertTextAtCursor(newText, true);
        
        // Select the placeholder text
        const start = currentSelection.start + prefix.length;
        const end = start + placeholder.length;
        textarea.setSelectionRange(start, end);
    }
}

function insertLine(text) {
    const textarea = window.markdownEditor;
    const beforeCursor = textarea.value.substring(0, currentSelection.start);
    const afterCursor = textarea.value.substring(currentSelection.end);
    
    // Check if we're at the start of a line
    const atLineStart = beforeCursor.length === 0 || beforeCursor.endsWith('\n');
    const prefix = atLineStart ? '' : '\n';
    const suffix = afterCursor.startsWith('\n') ? '' : '\n';
    
    insertTextAtCursor(prefix + text + suffix);
}

// Markdown formatting functions
const markdownActions = {
    bold: () => wrapSelectedText('**', '**'),
    italic: () => wrapSelectedText('*', '*'),
    strikethrough: () => wrapSelectedText('~~', '~~'),
    code: () => wrapSelectedText('`', '`'),
    h1: () => insertLine('# Heading 1'),
    h2: () => insertLine('## Heading 2'),
    h3: () => insertLine('### Heading 3'),
    ul: () => insertLine('- List item'),
    ol: () => insertLine('1. List item'),
    quote: () => insertLine('> Quote'),
    codeblock: () => insertLine('```\ncode block\n```'),
    hr: () => insertLine('---'),
    table: () => insertLine('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |'),
    link: () => showLinkDialog(),
    image: () => showImageDialog()
};

// Event listener for toolbar buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toolbar-btn')) {
        const action = e.target.dataset.md;
        if (action && markdownActions[action]) {
            markdownActions[action]();
        }
    }
});

// Dialog functions
function showLinkDialog() {
    const selectedText = getSelectedText();
    document.getElementById('linkText').value = selectedText;
    document.getElementById('linkUrl').value = '';
    linkDialog.style.display = 'flex';
    document.getElementById('linkText').focus();
}

function showImageDialog() {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageAlt').value = '';
    document.getElementById('imageCaption').value = '';
    imageDialog.style.display = 'flex';
    document.getElementById('imageUrl').focus();
}

function hideDialogs() {
    linkDialog.style.display = 'none';
    imageDialog.style.display = 'none';
}

// Link dialog handlers
document.getElementById('linkInsert').addEventListener('click', () => {
    const text = document.getElementById('linkText').value || 'link text';
    const url = document.getElementById('linkUrl').value || 'https://';
    const markdown = `[${text}](${url})`;
    insertTextAtCursor(markdown);
    hideDialogs();
});

document.getElementById('linkCancel').addEventListener('click', hideDialogs);

// Image dialog handlers
document.getElementById('imageInsert').addEventListener('click', () => {
    const url = document.getElementById('imageUrl').value || 'https://';
    const alt = document.getElementById('imageAlt').value || 'image';
    const caption = document.getElementById('imageCaption').value;
    
    let markdown = `![${alt}](${url})`;
    if (caption) {
        markdown += `\n*${caption}*`;
    }
    
    insertTextAtCursor(markdown);
    hideDialogs();
});

document.getElementById('imageCancel').addEventListener('click', hideDialogs);

// Close dialogs when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('md-dialog')) {
        hideDialogs();
    }
});

// Close dialogs with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideDialogs();
    }
});

function populateUserData() {
    const authorNameInput = document.getElementById('authorName');
    const usernameInput = document.getElementById('username');
    
    if (auth.currentUser) {
        authorNameInput.value = auth.currentUser.displayName || 'Anonymous User';
        usernameInput.value = auth.currentUser.email?.split('@')[0] || 'anonymous';
    }
}

// Step navigation
nextToBodyBtn.addEventListener('click', () => {
    if (validateDetailsForm()) {
        saveDetailsData();
        showBodyStep();
    }
});

backToDetailsBtn.addEventListener('click', () => {
    showDetailsStep();
});

function validateDetailsForm() {
    const form = blogDetailsForm;
    const title = form.title.value.trim();
    const subtitle = form.subtitle.value.trim();
    const publishDate = form.publishDate.value;
    const category = form.category.value;
    
    if (!title) {
        showToast('Please enter a blog title', 'error');
        return false;
    }
    
    if (!subtitle) {
        showToast('Please enter a blog subtitle', 'error');
        return false;
    }
    
    if (!publishDate) {
        showToast('Please select a publish date', 'error');
        return false;
    }
    
    if (!category) {
        showToast('Please select a category', 'error');
        return false;
    }
    
    return true;
}

function saveDetailsData() {
    const form = blogDetailsForm;
    blogData.title = form.title.value.trim();
    blogData.subtitle = form.subtitle.value.trim();
    blogData.authorName = form.authorName.value;
    blogData.username = form.username.value;
    blogData.publishDate = form.publishDate.value;
    blogData.category = form.category.value;
}

function showDetailsStep() {
    blogDetailsStep.classList.add('active');
    blogBodyStep.classList.remove('active');
}

function showBodyStep() {
    blogDetailsStep.classList.remove('active');
    blogBodyStep.classList.add('active');
    editorTitle.textContent = blogData.title;
    blogEditor.focus();
}

// Editor toolbar functionality - remove this as we now handle it differently
// document.addEventListener('click', (e) => {
//     if (e.target.classList.contains('toolbar-btn')) {
//         const command = e.target.dataset.command;
//         const value = e.target.dataset.value;
//         
//         if (command) {
//             document.execCommand(command, false, value || null);
//             blogEditor.focus();
//         }
//     }
// });

// Publish blog
publishBtn.addEventListener('click', async () => {
    if (!auth.currentUser) {
        showToast('Please log in to publish your blog', 'error');
        return;
    }
    
    const markdownContent = window.markdownEditor.value.trim();
    if (!markdownContent) {
        showToast('Please write some content for your blog', 'error');
        return;
    }
    
    blogData.body = markdownContent;
    
    try {
        publishBtn.disabled = true;
        publishBtn.textContent = 'Publishing...';
        
        const docRef = await addDoc(collection(firestore, "blogs"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            body: blogData.body,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            category: blogData.category,
            authorEmail: auth.currentUser.email,
            createdAt: new Date().toISOString(),
            status: 'published',
            contentType: 'markdown' // Add this to indicate markdown content
        });

        const indexRef = await addDoc(collection(firestore, "blogsRef"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            category: blogData.category,
            authorEmail: auth.currentUser.email,
            blogId: docRef.id,
            createdAt: new Date().toISOString(),
            status: 'published',
            contentType: 'markdown'
        });

        showToast('Blog published successfully!');
        
        // Reset form and redirect after a delay
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);

    } catch (error) {
        console.error('Error publishing blog:', error);
        showToast('Error publishing blog. Please try again.', 'error');
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish Blog';
    }
});

// Handle auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        populateUserData();
    } else {
        // Redirect to login if not authenticated
        window.location.href = '/index.html';
    }
});

