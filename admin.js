// Admin Dashboard JavaScript

// Admin credentials (in production, use proper backend authentication)
const ADMIN_USERNAME = 'ross';
const ADMIN_PASSWORD = 'homecutz2025';

// State
let isLoggedIn = false;
let allBookings = [];
let filteredBookings = [];

// Initialize
console.log('Admin script loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    checkLoginStatus();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    document.getElementById('closeModal').addEventListener('click', closeModal);
}

function clearAllData() {
    console.log('Clear All button clicked');
    if (confirm('Are you sure you want to delete ALL bookings? This cannot be undone.')) {
        console.log('User confirmed clearing data');
        localStorage.removeItem('bookings');
        allBookings = [];
        loadBookings();
        renderBookingsTable(); // Force re-render
        alert('All bookings have been cleared.');
        location.reload(); // Force reload to be absolutely sure
    }
}

// Authentication
function checkLoginStatus() {
    isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

    if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
}

function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    console.log('Attempting login with:', username);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('Login successful');
        sessionStorage.setItem('adminLoggedIn', 'true');
        isLoggedIn = true;
        showDashboard();
        errorEl.textContent = '';
    } else {
        console.log('Login failed');
        errorEl.textContent = 'Invalid username or password';
        alert('Invalid username or password'); // Explicit feedback
    }
}

function handleLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    isLoggedIn = false;
    showLogin();
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadBookings();
}

// Load and Display Bookings
function loadBookings() {
    allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');

    // Sort by date and time (newest first)
    allBookings.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });

    updateStats();
    applyFilters();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];

    const stats = {
        total: allBookings.length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        today: allBookings.filter(b => b.date === today && b.status !== 'cancelled').length,
        completed: allBookings.filter(b => b.status === 'completed').length
    };

    document.getElementById('totalBookings').textContent = stats.total;
    document.getElementById('confirmedBookings').textContent = stats.confirmed;
    document.getElementById('todayBookings').textContent = stats.today;
    document.getElementById('completedBookings').textContent = stats.completed;
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    filteredBookings = allBookings.filter(booking => {
        const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
        const dateMatch = !dateFilter || booking.date === dateFilter;
        return statusMatch && dateMatch;
    });

    renderBookingsTable();
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    const noBookings = document.getElementById('noBookings');

    if (filteredBookings.length === 0) {
        tbody.innerHTML = '';
        noBookings.classList.remove('hidden');
        return;
    }

    noBookings.classList.add('hidden');

    tbody.innerHTML = filteredBookings.map(booking => `
        <tr>
            <td><strong>${booking.id}</strong></td>
            <td>${formatDate(booking.date)}</td>
            <td>${formatTime(booking.time)}</td>
            <td>${booking.name}</td>
            <td>${booking.service}</td>
            <td>${booking.phone}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewDetails('${booking.id}')">View</button>
                    ${booking.status === 'confirmed' ? `
                        <button class="action-btn" onclick="markCompleted('${booking.id}')">Complete</button>
                        <button class="action-btn danger" onclick="cancelBooking('${booking.id}')">Cancel</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Booking Actions
function viewDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-row">
            <span>Booking ID:</span>
            <strong>${booking.id}</strong>
        </div>
        <div class="detail-row">
            <span>Status:</span>
            <strong><span class="status-badge status-${booking.status}">${booking.status}</span></strong>
        </div>
        <div class="detail-row">
            <span>Date:</span>
            <strong>${formatDate(booking.date)}</strong>
        </div>
        <div class="detail-row">
            <span>Time:</span>
            <strong>${formatTime(booking.time)}</strong>
        </div>
        <div class="detail-row">
            <span>Customer Name:</span>
            <strong>${booking.name}</strong>
        </div>
        <div class="detail-row">
            <span>Email:</span>
            <strong>${booking.email}</strong>
        </div>
        <div class="detail-row">
            <span>Phone:</span>
            <strong>${booking.phone}</strong>
        </div>
        <div class="detail-row">
            <span>Service:</span>
            <strong>${booking.service}</strong>
        </div>
        <div class="detail-row">
            <span>Address:</span>
            <strong>${booking.address}</strong>
        </div>
        ${booking.notes ? `
            <div class="detail-row">
                <span>Special Requests:</span>
                <strong>${booking.notes}</strong>
            </div>
        ` : ''}
        <div class="detail-row">
            <span>Booked On:</span>
            <strong>${new Date(booking.createdAt).toLocaleString()}</strong>
        </div>
    `;

    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}

function markCompleted(bookingId) {
    if (!confirm('Mark this booking as completed?')) return;

    updateBookingStatus(bookingId, 'completed');
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    updateBookingStatus(bookingId, 'cancelled');
}

function updateBookingStatus(bookingId, newStatus) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = newStatus;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        loadBookings();
    }
}

// Export to CSV
function exportToCSV() {
    if (filteredBookings.length === 0) {
        alert('No bookings to export');
        return;
    }

    const headers = ['ID', 'Date', 'Time', 'Customer', 'Email', 'Phone', 'Service', 'Address', 'Status', 'Booked On'];
    const rows = filteredBookings.map(b => [
        b.id,
        b.date,
        b.time,
        b.name,
        b.email,
        b.phone,
        b.service,
        b.address.replace(/,/g, ';'), // Replace commas in address
        b.status,
        new Date(b.createdAt).toLocaleString()
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homecutz-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Make functions global for onclick handlers
window.viewDetails = viewDetails;
window.markCompleted = markCompleted;
window.cancelBooking = cancelBooking;
