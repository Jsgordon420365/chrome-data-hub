const API_BASE = window.location.origin + '/api';

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'dashboard') {
      loadDashboard();
    } else if (tabName === 'history') {
      loadHistoryStats();
    } else if (tabName === 'bookmarks') {
      loadBookmarkFolders();
    }
  });
});

// Combined search
document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim();
  if (query) performSearch(query);
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) performSearch(query);
  }
});

async function performSearch(query) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results.length === 0) {
      resultsDiv.innerHTML = '<div class="empty">No results found</div>';
      return;
    }
    
    resultsDiv.innerHTML = data.results.map(item => `
      <div class="result-item">
        <h3>${escapeHtml(item.title || item.url)}</h3>
        <div class="url">${escapeHtml(item.url)}</div>
        <div class="meta">
          <span class="badge">${item.source}</span>
          ${item.domain ? `<span>Domain: ${escapeHtml(item.domain)}</span>` : ''}
          ${item.visit_count ? `<span>Visits: ${item.visit_count}</span>` : ''}
          ${item.folder_path ? `<span>Folder: ${escapeHtml(item.folder_path)}</span>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

// History search
document.getElementById('historySearchBtn').addEventListener('click', () => {
  const query = document.getElementById('historySearchInput').value.trim();
  if (query) searchHistory(query);
});

document.getElementById('historySearchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) searchHistory(query);
  }
});

async function searchHistory(query) {
  const resultsDiv = document.getElementById('historyResults');
  resultsDiv.innerHTML = '<div class="loading">Searching history...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/history/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results.length === 0) {
      resultsDiv.innerHTML = '<div class="empty">No history entries found</div>';
      return;
    }
    
    resultsDiv.innerHTML = data.results.map(item => `
      <div class="result-item">
        <h3>${escapeHtml(item.title || item.url)}</h3>
        <div class="url">${escapeHtml(item.url)}</div>
        <div class="meta">
          ${item.domain ? `<span>Domain: ${escapeHtml(item.domain)}</span>` : ''}
          <span>Visits: ${item.visit_count}</span>
          <span>Last visit: ${formatTimestamp(item.visit_time)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

async function loadHistoryStats() {
  const statsDiv = document.getElementById('historyStats');
  
  try {
    const response = await fetch(`${API_BASE}/history/stats`);
    const stats = await response.json();
    
    statsDiv.innerHTML = `
      <div class="stat-card">
        <h4>Total Entries</h4>
        <div class="value">${stats.total_entries}</div>
      </div>
      <div class="stat-card">
        <h4>Unique Domains</h4>
        <div class="value">${stats.unique_domains}</div>
      </div>
      <div class="stat-card">
        <h4>Total Visits</h4>
        <div class="value">${stats.total_visits}</div>
      </div>
    `;
  } catch (error) {
    statsDiv.innerHTML = `<div class="error">Error loading stats: ${error.message}</div>`;
  }
}

// Bookmarks search
document.getElementById('bookmarksSearchBtn').addEventListener('click', () => {
  const query = document.getElementById('bookmarksSearchInput').value.trim();
  if (query) searchBookmarks(query);
});

document.getElementById('bookmarksSearchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) searchBookmarks(query);
  }
});

async function searchBookmarks(query) {
  const resultsDiv = document.getElementById('bookmarksResults');
  resultsDiv.innerHTML = '<div class="loading">Searching bookmarks...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/bookmarks/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results.length === 0) {
      resultsDiv.innerHTML = '<div class="empty">No bookmarks found</div>';
      return;
    }
    
    resultsDiv.innerHTML = data.results.map(item => `
      <div class="result-item">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="url">${escapeHtml(item.url)}</div>
        <div class="meta">
          ${item.folder_path ? `<span>Folder: ${escapeHtml(item.folder_path)}</span>` : ''}
          ${item.is_bookmarklet ? '<span class="badge">Bookmarklet</span>' : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

async function loadBookmarkFolders() {
  const foldersDiv = document.getElementById('bookmarkFolders');
  
  try {
    const response = await fetch(`${API_BASE}/bookmarks/folders`);
    const data = await response.json();
    
    if (data.folders.length === 0) {
      foldersDiv.innerHTML = '<div class="empty">No bookmark folders found</div>';
      return;
    }
    
    foldersDiv.innerHTML = data.folders.map(folder => `
      <div class="folder-item" onclick="loadBookmarksByFolder('${escapeHtml(folder.folder_path)}')">
        <h4>📁 ${escapeHtml(folder.folder_path)}</h4>
        <div class="count">${folder.bookmark_count} bookmarks</div>
      </div>
    `).join('');
  } catch (error) {
    foldersDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

async function loadBookmarksByFolder(folderPath) {
  const resultsDiv = document.getElementById('bookmarksResults');
  resultsDiv.innerHTML = '<div class="loading">Loading bookmarks...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/bookmarks/folder?path=${encodeURIComponent(folderPath)}`);
    const data = await response.json();
    
    if (data.bookmarks.length === 0) {
      resultsDiv.innerHTML = '<div class="empty">No bookmarks in this folder</div>';
      return;
    }
    
    resultsDiv.innerHTML = `
      <h3 style="margin-bottom: 20px;">📁 ${escapeHtml(folderPath)}</h3>
      ${data.bookmarks.map(item => `
        <div class="result-item">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="url">${escapeHtml(item.url)}</div>
          <div class="meta">
            ${item.is_bookmarklet ? '<span class="badge">Bookmarklet</span>' : ''}
          </div>
        </div>
      `).join('')}
    `;
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

// Dashboard
async function loadDashboard() {
  const dashboardDiv = document.getElementById('dashboardContent');
  dashboardDiv.innerHTML = '<div class="loading">Loading dashboard...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    const data = await response.json();
    
    dashboardDiv.innerHTML = `
      <div class="dashboard-section">
        <h3>📊 Overview</h3>
        <div class="stats">
          <div class="stat-card">
            <h4>History Entries</h4>
            <div class="value">${data.history.total_entries}</div>
          </div>
          <div class="stat-card">
            <h4>Unique Domains</h4>
            <div class="value">${data.history.unique_domains}</div>
          </div>
          <div class="stat-card">
            <h4>Total Visits</h4>
            <div class="value">${data.history.total_visits}</div>
          </div>
          <div class="stat-card">
            <h4>Bookmarks</h4>
            <div class="value">${data.bookmarks.total}</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-section">
        <h3>🌐 Top Domains</h3>
        <div class="domain-list">
          ${data.topDomains.map(domain => `
            <div class="domain-item">
              <div class="domain-name">${escapeHtml(domain.domain)}</div>
              <div class="domain-stats">${domain.total_visits} visits • ${domain.page_count} pages</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    dashboardDiv.innerHTML = `<div class="error">Error loading dashboard: ${error.message}</div>`;
  }
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
