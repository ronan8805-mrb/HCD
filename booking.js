// Booking System JavaScript

// State
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let currentStep = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('continueToDetails').addEventListener('click', goToStep2);
    document.getElementById('backToCalendar').addEventListener('click', goToStep1);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
    document.getElementById('bookAnother').addEventListener('click', resetBooking);
}

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get calendar data
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true, new Date(year, month - 1, day));
        calendarGrid.appendChild(dayEl);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;
        const dayEl = createDayElement(day, false, date, isToday, isPast);
        calendarGrid.appendChild(dayEl);
    }

    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createDayElement(day, true, new Date(year, month + 1, day));
        calendarGrid.appendChild(dayEl);
    }
}

function createDayElement(day, isOtherMonth, date, isToday = false, isPast = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }

    if (isToday) {
        dayEl.classList.add('today');
    }

    if (isPast) {
        dayEl.classList.add('disabled');
    }

    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayEl.classList.add('selected');
    }

    if (!isOtherMonth && !isPast) {
        dayEl.addEventListener('click', () => selectDate(date));
    }

    return dayEl;
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function selectDate(date) {
    selectedDate = date;
    selectedTime = null;
    renderCalendar();
    renderTimeSlots();
    updateContinueButton();
}

// Time Slots
function renderTimeSlots() {
    const timeslotGrid = document.getElementById('timeslotGrid');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');

    if (!selectedDate) {
        timeslotGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Please select a date first</p>';
        selectedDateDisplay.textContent = 'Please select a date';
        return;
    }

    const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    selectedDateDisplay.textContent = dateStr;

    timeslotGrid.innerHTML = '';

    // Get day of week (0 = Sunday, 5 = Friday)
    const dayOfWeek = selectedDate.getDay();

    // Determine hours based on day
    let startHour, endHour;
    if (dayOfWeek === 5) { // Friday
        startHour = 10;
        endHour = 18;
    } else { // Sat-Thu
        startHour = 9;
        endHour = 21;
    }

    // Generate 1.5 hour (90 minute) slots
    const slots = [];
    let currentHour = startHour;
    let currentMinute = 0;

    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
        if (currentHour < endHour) {
            slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
        }

        // Add 90 minutes
        currentMinute += 90;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    // Get booked slots for this date
    const bookedSlots = getBookedSlots(selectedDate);

    slots.forEach(time => {
        const slotEl = document.createElement('div');
        slotEl.className = 'timeslot';
        slotEl.textContent = formatTime(time);

        if (bookedSlots.includes(time)) {
            slotEl.classList.add('booked');
        } else {
            if (selectedTime === time) {
                slotEl.classList.add('selected');
            }
            slotEl.addEventListener('click', () => selectTime(time));
        }

        timeslotGrid.appendChild(slotEl);
    });
}

function selectTime(time) {
    selectedTime = time;
    renderTimeSlots();
    updateContinueButton();
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function getBookedSlots(date) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const dateStr = date.toISOString().split('T')[0];
    return bookings
        .filter(b => b.date === dateStr && b.status !== 'cancelled')
        .map(b => b.time);
}

function updateContinueButton() {
    const btn = document.getElementById('continueToDetails');
    btn.disabled = !(selectedDate && selectedTime);
}

// Step Navigation
function goToStep1() {
    currentStep = 1;
    updateStepDisplay();
}

function goToStep2() {
    if (!selectedDate || !selectedTime) return;

    currentStep = 2;
    updateStepDisplay();
    updateBookingSummary();
}

function goToStep3() {
    currentStep = 3;
    updateStepDisplay();
}

function updateStepDisplay() {
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === currentStep);
    });

    // Show/hide step content
    document.getElementById('step1').classList.toggle('hidden', currentStep !== 1);
    document.getElementById('step2').classList.toggle('hidden', currentStep !== 2);
    document.getElementById('step3').classList.toggle('hidden', currentStep !== 3);
}

function updateBookingSummary() {
    const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeStr = formatTime(selectedTime);

    document.getElementById('summaryDate').textContent = dateStr;
    document.getElementById('summaryTime').textContent = timeStr;
}

// Form Submission
function handleBookingSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const booking = {
            id: generateBookingId(),
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            service: formData.get('service'),
            notes: formData.get('notes') || '',
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        // Show confirmation
        displayConfirmation(booking);
        goToStep3();
    } catch (error) {
        console.error('Booking Error:', error);
        alert('An error occurred while processing your booking: ' + error.message);
    }
}

function displayConfirmation(booking) {
    const dateStr = new Date(booking.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const timeStr = formatTime(booking.time);

    document.getElementById('confirmBookingId').textContent = booking.id;
    document.getElementById('confirmDateTime').textContent = `${dateStr} at ${timeStr}`;
    document.getElementById('confirmService').textContent = booking.service;
    document.getElementById('confirmAddress').textContent = booking.address;
}

function generateBookingId() {
    return 'HC' + Date.now().toString(36).toUpperCase();
}

function resetBooking() {
    selectedDate = null;
    selectedTime = null;
    currentStep = 1;
    currentDate = new Date();
    document.getElementById('bookingForm').reset();
    renderCalendar();
    renderTimeSlots();
    updateStepDisplay();
    updateContinueButton();
}
