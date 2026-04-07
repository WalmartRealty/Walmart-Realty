/**
 * Walmart Real Estate Admin Dashboard
 */

const API_BASE = '/api';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let statuses = [];

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        checkAuth();
    }
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('property-form').addEventListener('submit', handlePropertySubmit);
});

// API helper
async function api(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired');
    }
    
    return response.json();
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('adminToken', authToken);
        
        showDashboard();
    } catch (err) {
        errorEl.textContent = 'Invalid email or password';
        errorEl.classList.remove('hidden');
    }
}

async function checkAuth() {
    try {
        currentUser = await api('/auth/me');
        showDashboard();
    } catch (err) {
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

async function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    document.getElementById('user-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    
    await loadStatuses();
    loadDashboard();
}

// Tab navigation
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-walmart-blue', 'text-walmart-blue');
        btn.classList.add('border-transparent', 'text-gray-600');
    });
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('border-walmart-blue', 'text-walmart-blue');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('border-transparent', 'text-gray-600');
    
    switch(tabName) {
        case 'dashboard': loadDashboard(); break;
        case 'properties': loadProperties(); break;
        case 'loi': loadLOISubmissions(); break;
        case 'activity': loadActivityLog(); break;
    }
}

// Load statuses
async function loadStatuses() {
    statuses = await api('/statuses');
    
    const filterSelect = document.getElementById('filter-status');
    const propSelect = document.getElementById('prop-status');
    
    filterSelect.innerHTML = '<option value="">All Statuses</option>';
    propSelect.innerHTML = '';
    
    statuses.forEach(s => {
        filterSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
        propSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// Dashboard
async function loadDashboard() {
    const stats = await api('/stats');
    
    document.getElementById('stat-total').textContent = stats.totalProperties;
    document.getElementById('stat-active').textContent = stats.activeListings;
    document.getElementById('stat-contract').textContent = stats.underContract;
    document.getElementById('stat-loi').textContent = stats.pendingLOIs;
    
    // Status breakdown
    const statusEl = document.getElementById('status-breakdown');
    statusEl.innerHTML = stats.byStatus.map(s => `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${s.color}"></span>
                <span>${s.name}</span>
            </div>
            <span class="font-semibold">${s.count}</span>
        </div>
    `).join('');
    
    // State breakdown
    const stateEl = document.getElementById('state-breakdown');
    stateEl.innerHTML = stats.byState.map(s => `
        <div class="flex items-center justify-between">
            <span>${s.state}</span>
            <span class="font-semibold">${s.count}</span>
        </div>
    `).join('');
}

// Properties
async function loadProperties() {
    const status = document.getElementById('filter-status').value;
    const type = document.getElementById('filter-type').value;
    const listing = document.getElementById('filter-listing').value;
    
    let query = '?active_only=false';
    if (status) query += `&status=${status}`;
    if (type) query += `&type=${type}`;
    if (listing) query += `&listing_type=${listing}`;
    
    const properties = await api(`/properties${query}`);
    
    const tbody = document.getElementById('properties-table');
    tbody.innerHTML = properties.map(p => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${p.city}, ${p.state}</div>
                <div class="text-sm text-gray-500">${p.size_acres ? p.size_acres + ' acres' : ''}</div>
            </td>
            <td class="px-6 py-4">
                <span class="capitalize">${p.property_type}</span>
                <div class="text-sm text-gray-500 capitalize">${p.listing_type?.replace('_', ' ')}</div>
            </td>
            <td class="px-6 py-4">
                ${p.price ? '$' + p.price.toLocaleString() : 'Contact'}
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium" 
                      style="background-color: ${p.status_color}20; color: ${p.status_color}">
                    ${p.status_name}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <button onclick="editProperty(${p.id})" class="text-walmart-blue hover:underline text-sm">Edit</button>
                    <div class="relative group">
                        <button class="text-gray-500 hover:text-gray-700 text-sm">Status ▼</button>
                        <div class="absolute hidden group-hover:block bg-white shadow-lg rounded-lg py-2 z-10 min-w-[150px]">
                            ${statuses.map(s => `
                                <button onclick="updateStatus(${p.id}, ${s.id})" 
                                        class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                                    <span class="w-2 h-2 rounded-full inline-block mr-2" style="background-color: ${s.color}"></span>
                                    ${s.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="deleteProperty(${p.id})" class="text-red-600 hover:underline text-sm">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openPropertyModal(property = null) {
    const modal = document.getElementById('property-modal');
    const title = document.getElementById('property-modal-title');
    
    if (property) {
        title.textContent = 'Edit Property';
        document.getElementById('property-id').value = property.id;
        document.getElementById('prop-city').value = property.city || '';
        document.getElementById('prop-state').value = property.state || '';
        document.getElementById('prop-address').value = property.address || '';
        document.getElementById('prop-acres').value = property.size_acres || '';
        document.getElementById('prop-type').value = property.property_type || 'land';
        document.getElementById('prop-listing').value = property.listing_type || 'sale';
        document.getElementById('prop-price').value = property.price || '';
        document.getElementById('prop-status').value = property.status_id || 1;
        document.getElementById('prop-lat').value = property.latitude || '';
        document.getElementById('prop-lon').value = property.longitude || '';
        document.getElementById('prop-description').value = property.description || '';
        document.getElementById('prop-broker-name').value = property.broker_name || '';
        document.getElementById('prop-broker-email').value = property.broker_email || '';
        document.getElementById('prop-broker-phone').value = property.broker_phone || '';
        document.getElementById('prop-featured').checked = property.is_featured;
        document.getElementById('prop-active').checked = property.is_active;
    } else {
        title.textContent = 'Add Property';
        document.getElementById('property-form').reset();
        document.getElementById('property-id').value = '';
        document.getElementById('prop-active').checked = true;
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closePropertyModal() {
    document.getElementById('property-modal').classList.add('hidden');
    document.getElementById('property-modal').classList.remove('flex');
}

async function editProperty(id) {
    const property = await api(`/properties/${id}`);
    openPropertyModal(property);
}

async function handlePropertySubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('property-id').value;
    const data = {
        city: document.getElementById('prop-city').value,
        state: document.getElementById('prop-state').value.toUpperCase(),
        address: document.getElementById('prop-address').value,
        size_acres: parseFloat(document.getElementById('prop-acres').value) || null,
        property_type: document.getElementById('prop-type').value,
        listing_type: document.getElementById('prop-listing').value,
        price: parseFloat(document.getElementById('prop-price').value) || null,
        status_id: parseInt(document.getElementById('prop-status').value),
        latitude: parseFloat(document.getElementById('prop-lat').value) || null,
        longitude: parseFloat(document.getElementById('prop-lon').value) || null,
        description: document.getElementById('prop-description').value,
        broker_name: document.getElementById('prop-broker-name').value,
        broker_email: document.getElementById('prop-broker-email').value,
        broker_phone: document.getElementById('prop-broker-phone').value,
        is_featured: document.getElementById('prop-featured').checked,
        is_active: document.getElementById('prop-active').checked
    };
    
    if (id) {
        await api(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
        await api('/properties', { method: 'POST', body: JSON.stringify(data) });
    }
    
    closePropertyModal();
    loadProperties();
}

async function updateStatus(propertyId, statusId) {
    await api(`/properties/${propertyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status_id: statusId })
    });
    loadProperties();
}

async function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    await api(`/properties/${id}`, { method: 'DELETE' });
    loadProperties();
}

// LOI Submissions
async function loadLOISubmissions() {
    const submissions = await api('/loi-submissions');
    
    const tbody = document.getElementById('loi-table');
    tbody.innerHTML = submissions.map(s => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm">${new Date(s.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <div class="font-medium">${s.city}, ${s.state}</div>
                <div class="text-sm text-gray-500">${s.size_acres} acres</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-medium">${s.first_name} ${s.last_name}</div>
                <div class="text-sm text-gray-500">${s.company}</div>
                <div class="text-sm text-gray-500">${s.email}</div>
            </td>
            <td class="px-6 py-4">${s.loi_type}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getLoiStatusClass(s.status)}">
                    ${s.status}
                </span>
            </td>
            <td class="px-6 py-4">
                <select onchange="updateLoiStatus(${s.id}, this.value)" class="text-sm border rounded px-2 py-1">
                    <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="reviewed" ${s.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                    <option value="accepted" ${s.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="countered" ${s.status === 'countered' ? 'selected' : ''}>Countered</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function getLoiStatusClass(status) {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-blue-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        countered: 'bg-purple-100 text-purple-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

async function updateLoiStatus(id, status) {
    await api(`/loi-submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
}

// Activity Log
async function loadActivityLog() {
    const logs = await api('/activity');
    
    const container = document.getElementById('activity-log');
    container.innerHTML = logs.map(l => `
        <div class="px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="font-medium">${l.first_name || 'System'} ${l.last_name || ''}</span>
                    <span class="text-gray-600">${formatAction(l.action)}</span>
                    <span class="font-medium">${l.entity_type} #${l.entity_id}</span>
                </div>
                <span class="text-sm text-gray-500">${new Date(l.created_at).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function formatAction(action) {
    const actions = {
        create: 'created',
        update: 'updated',
        delete: 'deleted',
        status_change: 'changed status of'
    };
    return actions[action] || action;
}
