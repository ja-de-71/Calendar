document.addEventListener('DOMContentLoaded', function() {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDcQHAqb4EfIQjxZnIg_NbFJ5zrENGKRt0",
    authDomain: "calendar-3391e.firebaseapp.com",
    projectId: "calendar-3391e",
    storageBucket: "calendar-3391e.firebasestorage.app",
    messagingSenderId: "200867528706",
    appId: "1:200867528706:web:b7133926d0626a91d4671b"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Enable offline persistence (with mobile-friendly error handling)
  db.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence not supported on this browser');
      } else {
        console.warn('Firestore persistence error:', err.message);
      }
      // Continue anyway - app will work without persistence
    });

  // UI Elements
  const app = document.getElementById('app');
  const userEmail = document.getElementById('user-email');
  const signOut = document.getElementById('sign-out');
  const authContainer = document.getElementById('auth-container');
  const calendarEl = document.getElementById('calendar');
  const monthYear = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const todayBtn = document.getElementById('today');
  const bookingForm = document.getElementById('booking-form');
  const formTitle = document.querySelector('.booking-container h2');
  const blackoutForm = document.getElementById('blackout-form');
  const bookingModal = document.getElementById('booking-modal');
  const modalBody = document.getElementById('modal-body');
  const closeModalBtn = document.querySelector('.close-button');
  const successToast = document.getElementById('success-toast');
  const bookingSummaryEl = document.getElementById('booking-summary');
  const loadingSpinner = document.getElementById('loading-spinner');
  const searchInput = document.getElementById('search-bookings');
  const clearSearchBtn = document.getElementById('clear-search');
  const searchResults = document.getElementById('search-results');
  const recurringEnabled = document.getElementById('recurring-enabled');
  const recurringOptions = document.getElementById('recurring-options');
  const recurringFrequency = document.getElementById('recurring-frequency');
  const recurringCount = document.getElementById('recurring-count');
  const recurringPreview = document.getElementById('recurring-preview');

  // App state
  let currentDate = new Date();
  let bookings = [];
  let blackouts = []; // For storing blackout dates
  let currentEditId = null;
  let searchQuery = ''; // Track current search query

  // Auth form elements
  const signinForm = document.getElementById('signin');
  const resetForm = document.getElementById('reset');
  const signinFormDiv = document.getElementById('signin-form');
  const resetFormDiv = document.getElementById('reset-form');

  // Admin email - only this user sees Admin Tools
  const ADMIN_EMAIL = 'jason.dean192@googlemail.com';

  // --- AUTHENTICATION --- //
  auth.onAuthStateChanged(user => {
    if (user) {
      app.style.display = 'block';
      authContainer.style.display = 'none';
      userEmail.textContent = user.email;

      // Show admin tools only for admin user
      const adminTools = document.getElementById('admin-tools');
      if (user.email === ADMIN_EMAIL) {
        adminTools.style.display = 'block';
      } else {
        adminTools.style.display = 'none';
      }

      loadAllData();
    } else {
      app.style.display = 'none';
      authContainer.style.display = 'block';
      showSigninForm();
    }
  });

  // Sign In
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errorDiv = document.getElementById('signin-error');

    errorDiv.textContent = '';

    try {
      await auth.signInWithEmailAndPassword(email, password);
      signinForm.reset();
    } catch (error) {
      errorDiv.textContent = getErrorMessage(error);
    }
  });

  // Password Reset
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const errorDiv = document.getElementById('reset-error');
    const successDiv = document.getElementById('reset-success');

    errorDiv.textContent = '';
    successDiv.textContent = '';

    try {
      await auth.sendPasswordResetEmail(email);
      successDiv.textContent = 'Password reset email sent! Check your inbox.';
      resetForm.reset();
    } catch (error) {
      errorDiv.textContent = getErrorMessage(error);
    }
  });

  // Form switching
  document.getElementById('show-reset').addEventListener('click', (e) => {
    e.preventDefault();
    showResetForm();
  });

  document.getElementById('back-to-signin').addEventListener('click', (e) => {
    e.preventDefault();
    showSigninForm();
  });

  function showSigninForm() {
    signinFormDiv.style.display = 'block';
    resetFormDiv.style.display = 'none';
    clearAuthErrors();
  }

  function showResetForm() {
    signinFormDiv.style.display = 'none';
    resetFormDiv.style.display = 'block';
    clearAuthErrors();
  }

  function clearAuthErrors() {
    document.getElementById('signin-error').textContent = '';
    document.getElementById('reset-error').textContent = '';
    document.getElementById('reset-success').textContent = '';
  }

  function getErrorMessage(error) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email. Please create an account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message;
    }
  }

  signOut.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut();
  });

  // --- CALENDAR RENDERING --- //
  function renderCalendar() {
    calendarEl.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    // Add day of week headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(dayName => {
      const headerEl = document.createElement('div');
      headerEl.classList.add('day-header');
      headerEl.textContent = dayName;
      calendarEl.appendChild(headerEl);
    });

    // Get today's date string for comparison
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar-day');
      const date = new Date(Date.UTC(year, month, i));

      // Format date as YYYY-MM-DD for consistent comparison
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      // Highlight today's date
      if (dateString === todayString) {
        dayEl.classList.add('today');
      }

      const blackout = blackouts.find(b => b.date === dateString);

      dayEl.innerHTML = `<div class="day-number">${i}</div>`;

      if (blackout) {
        dayEl.classList.add('day-blackout');
        dayEl.innerHTML += `<div class="blackout-reason">${blackout.reason}</div>`;
      } else {
        const bookingsForDay = bookings.filter(b => {
          return !b.cancelled && b.date === dateString;
        });

        if (bookingsForDay.length > 0) {
          dayEl.classList.add('has-bookings');
          const bookingList = bookingsForDay.map(b => {
            const rinkCount = parseRinks(b.rinks).length;
            const notesPreview = b.notes ? `<br><span style="color: #666; font-style: italic;">${b.notes.substring(0, 25)}${b.notes.length > 25 ? '...' : ''}</span>` : '';
            return `<div class="booking-summary">${b.startTime} - ${b.endTime} (${rinkCount} rinks)${notesPreview}</div>`;
          }).join('');
          dayEl.innerHTML += bookingList;

          // Add click handler with availability view option (shift+click or right click)
          dayEl.addEventListener('click', (e) => {
            if (e.shiftKey) {
              showAvailabilityView(date);
            } else {
              showBookingModal(date);
            }
          });
          dayEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showAvailabilityView(date);
          });

          // Check if day matches search query
          if (searchQuery) {
            const matchesSearch = bookingsForDay.some(b => {
              const searchLower = searchQuery.toLowerCase();
              return b.name.toLowerCase().includes(searchLower) ||
                     b.phone.includes(searchQuery);
            });
            if (matchesSearch) {
              dayEl.classList.add('search-match');
            }
          }
        } else {
          // Allow clicking on empty days to see availability
          dayEl.style.cursor = 'pointer';
          dayEl.addEventListener('click', () => showAvailabilityView(date));
        }
      }
      calendarEl.appendChild(dayEl);
    }
  }

  // --- DATA LOADING --- //
  async function loadAllData() {
    showLoading();
    try {
      const bookingsSnapshot = await db.collection('bookings').orderBy('startTime').get();
      bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const blackoutsSnapshot = await db.collection('blackouts').get();
      blackouts = blackoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      renderCalendar();
      updateBookingSummary();
      updateStatsDashboard(); // Update admin stats
    } finally {
      hideLoading();
    }
  }

  function showBookingModal(date) {
    modalBody.innerHTML = '';
    // Convert Date object to YYYY-MM-DD string for comparison
    const dateString = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => b.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by start time

    dayBookings.forEach(booking => {
      const bookingEl = document.createElement('div');
      bookingEl.classList.add('booking-entry');
      let buttonsHTML = '';
      // Show buttons if: user is signed in AND booking is not cancelled AND (booking has no uid OR user owns the booking)
      const canEdit = auth.currentUser && !booking.cancelled && (!booking.uid || auth.currentUser.uid === booking.uid);
      if (canEdit) {
        buttonsHTML = `
          <div class="booking-actions">
            <button class="edit-btn" data-id="${booking.id}">Edit</button>
            <button class="cancel-btn" data-id="${booking.id}">Cancel</button>
          </div>`;
      }

      let cancelledInfo = '';
      if (booking.cancelled) {
          cancelledInfo = `<p style="color:red; font-weight:bold;">CANCELLED by ${booking.cancelledBy} on ${new Date(booking.cancelledAt.seconds * 1000).toLocaleDateString()}</p>`;
      }

      let recurringInfo = '';
      if (booking.recurringGroupId) {
        const frequencyText = booking.recurringFrequency === 'weekly' ? 'Weekly' :
                             booking.recurringFrequency === 'biweekly' ? 'Bi-weekly' : 'Monthly';
        recurringInfo = `<p style="color: #0078d4; font-size: 0.9em;">🔁 ${frequencyText} Recurring Booking</p>`;
      }

      bookingEl.innerHTML = `
        <h4>${booking.name} ${booking.recurringGroupId ? '<span style="color: #0078d4;">🔁</span>' : ''}</h4>
        ${cancelledInfo}
        ${recurringInfo}
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Rinks:</strong> ${booking.rinks}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Notes:</strong> ${booking.notes || 'N/A'}</p>
        ${buttonsHTML}
      `;
      modalBody.appendChild(bookingEl);
    });
    bookingModal.style.display = 'flex';
  }

  // Show availability view for a specific date
  function showAvailabilityView(date) {
    modalBody.innerHTML = '';
    const dateString = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => b.date === dateString && !b.cancelled)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Create availability grid by hour
    const availabilityHTML = `
      <h3>Rink Availability - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
      <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Shows which rinks (1-8) are available throughout the day</p>
      <div style="max-height: 400px; overflow-y: auto;">
        ${generateAvailabilityGrid(dayBookings)}
      </div>
    `;

    modalBody.innerHTML = availabilityHTML;
    bookingModal.style.display = 'flex';
  }

  // Generate availability grid showing which rinks are free at each time
  function generateAvailabilityGrid(dayBookings) {
    const hours = [];
    for (let h = 6; h < 22; h++) { // 6 AM to 10 PM
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.85em;">';
    html += '<thead><tr><th style="border: 1px solid #ddd; padding: 8px; background-color: #0059c4; color: white;">Time</th>';

    // Header row with rink numbers
    for (let r = 1; r <= 8; r++) {
      html += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #0059c4; color: white;">R${r}</th>`;
    }
    html += '</tr></thead><tbody>';

    // For each hour, check availability
    hours.forEach(hour => {
      html += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">${hour}</td>`;

      for (let rinkNum = 1; rinkNum <= 8; rinkNum++) {
        // Check if this rink is booked at this time
        const isBooked = dayBookings.some(booking => {
          const bookingRinks = parseRinks(booking.rinks);
          const bookingStartHour = booking.startTime.split(':')[0];
          const bookingEndHour = booking.endTime.split(':')[0];
          const currentHour = hour.split(':')[0];

          // Check if rink is in booking and time overlaps
          return bookingRinks.includes(rinkNum) &&
                 currentHour >= bookingStartHour &&
                 currentHour < bookingEndHour;
        });

        const cellStyle = isBooked
          ? 'border: 1px solid #ddd; padding: 8px; background-color: #ffcdd2; color: #c62828; text-align: center;'
          : 'border: 1px solid #ddd; padding: 8px; background-color: #c8e6c9; color: #2e7d32; text-align: center;';
        const cellContent = isBooked ? '✗' : '✓';

        html += `<td style="${cellStyle}">${cellContent}</td>`;
      }

      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  // --- RECURRING BOOKING FUNCTIONS --- //

  // Generate array of dates based on recurrence pattern
  function generateRecurringDates(startDate, frequency, count) {
    const dates = [];
    const start = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const nextDate = new Date(start);

      if (frequency === 'weekly') {
        nextDate.setDate(start.getDate() + (i * 7));
      } else if (frequency === 'biweekly') {
        nextDate.setDate(start.getDate() + (i * 14));
      } else if (frequency === 'monthly') {
        nextDate.setMonth(start.getMonth() + i);
      }

      const dateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      dates.push({
        date: dateString,
        dateObj: nextDate
      });
    }

    return dates;
  }

  // Update recurring booking preview
  function updateRecurringPreview() {
    const dateInput = document.getElementById('date').value;
    if (!dateInput || !recurringEnabled.checked) {
      return;
    }

    const frequency = recurringFrequency.value;
    const count = parseInt(recurringCount.value) || 4;
    const dates = generateRecurringDates(dateInput, frequency, Math.min(count, 52));

    const dateList = dates.map((d, idx) => {
      const dayName = d.dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${idx + 1}. ${dayName}, ${formattedDate}`;
    }).join('<br>');

    recurringPreview.innerHTML = `<strong>Will create ${dates.length} bookings:</strong><br>${dateList}`;
  }

  // --- HELPER FUNCTIONS --- //

  // Show/hide loading spinner
  function showLoading() {
    loadingSpinner.style.display = 'flex';
  }

  function hideLoading() {
    loadingSpinner.style.display = 'none';
  }

  // Show success toast notification
  function showSuccessToast(message) {
    successToast.textContent = message;
    successToast.classList.add('show');
    setTimeout(() => {
      successToast.classList.remove('show');
    }, 3000);
  }

  // Update booking count summary
  function updateBookingSummary() {
    const activeBookings = bookings.filter(b => !b.cancelled);
    const totalRinks = activeBookings.reduce((sum, b) => {
      return sum + parseRinks(b.rinks).length;
    }, 0);
    bookingSummaryEl.textContent = `Total Active Bookings: ${activeBookings.length} | Total Rinks Booked: ${totalRinks}`;
  }

  // Update stats dashboard
  function updateStatsDashboard() {
    const statsContainer = document.getElementById('stats-dashboard');
    if (!statsContainer) return;

    const activeBookings = bookings.filter(b => !b.cancelled);
    const totalRinks = activeBookings.reduce((sum, b) => sum + parseRinks(b.rinks).length, 0);

    // Get upcoming bookings (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const upcomingBookings = activeBookings.filter(b => b.date >= todayStr && b.date <= nextWeekStr).length;

    // Find most popular time slot
    const timeSlots = {};
    activeBookings.forEach(b => {
      const slot = `${b.startTime}-${b.endTime}`;
      timeSlots[slot] = (timeSlots[slot] || 0) + 1;
    });
    const mostPopularTime = Object.keys(timeSlots).length > 0
      ? Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // Find most booked rink
    const rinkCounts = {};
    activeBookings.forEach(b => {
      parseRinks(b.rinks).forEach(r => {
        rinkCounts[r] = (rinkCounts[r] || 0) + 1;
      });
    });
    const mostBookedRink = Object.keys(rinkCounts).length > 0
      ? Object.entries(rinkCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // Find busiest day of week
    const dayOfWeek = {};
    activeBookings.forEach(b => {
      const date = new Date(b.date + 'T00:00:00');
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
    });
    const busiestDay = Object.keys(dayOfWeek).length > 0
      ? Object.entries(dayOfWeek).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // Count recurring bookings
    const recurringCount = activeBookings.filter(b => b.recurringGroupId).length;

    statsContainer.innerHTML = `
      <div class="stat-card green">
        <div class="stat-label">Total Bookings</div>
        <div class="stat-value">${activeBookings.length}</div>
        <div class="stat-sublabel">${recurringCount} recurring</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Rinks Booked</div>
        <div class="stat-value">${totalRinks}</div>
        <div class="stat-sublabel">Across all bookings</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Next 7 Days</div>
        <div class="stat-value">${upcomingBookings}</div>
        <div class="stat-sublabel">Upcoming bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Popular Time</div>
        <div class="stat-value" style="font-size: 1.5em;">${mostPopularTime}</div>
        <div class="stat-sublabel">Most booked slot</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top Rink</div>
        <div class="stat-value">Rink ${mostBookedRink}</div>
        <div class="stat-sublabel">Most popular</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Busiest Day</div>
        <div class="stat-value" style="font-size: 1.8em;">${busiestDay}</div>
        <div class="stat-sublabel">Of the week</div>
      </div>
    `;
  }

  // Form validation
  function validateField(fieldId, value, validationRules) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    const inputEl = document.getElementById(fieldId);

    for (const rule of validationRules) {
      if (!rule.test(value)) {
        errorEl.textContent = rule.message;
        inputEl.classList.add('invalid');
        inputEl.classList.remove('valid');
        return false;
      }
    }

    errorEl.textContent = '';
    inputEl.classList.remove('invalid');
    if (value) {
      inputEl.classList.add('valid');
    }
    return true;
  }

  function clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = '';
    if (inputEl) {
      inputEl.classList.remove('invalid');
      inputEl.classList.remove('valid');
    }
  }

  function clearAllErrors() {
    ['name', 'phone', 'email', 'date', 'start-time', 'end-time', 'rinks'].forEach(clearFieldError);
  }

  // --- FORM HANDLING --- //

  // Check for rink conflicts - reloads data from Firestore to ensure accuracy
  async function checkRinkConflicts(date, startTime, endTime, rinks, excludeBookingId = null) {
    // Parse the rinks being requested
    const requestedRinks = parseRinks(rinks);

    if (requestedRinks.length === 0) {
      return {
        conflict: true,
        message: 'Please enter valid rink numbers (e.g., 1, 1-4, or 1,2,5)'
      };
    }

    // Check if any requested rinks are out of range (only 8 rinks available)
    const invalidRinks = requestedRinks.filter(r => r < 1 || r > 8);
    if (invalidRinks.length > 0) {
      return {
        conflict: true,
        message: `Invalid rink number(s): ${invalidRinks.join(', ')}. Only rinks 1-8 are available.`
      };
    }

    // Check if trying to book more than 8 rinks total
    if (requestedRinks.length > 8) {
      return {
        conflict: true,
        message: `You cannot book more than 8 rinks. You requested ${requestedRinks.length} rinks.`
      };
    }

    // Reload bookings from Firestore to get the latest data
    const bookingsSnapshot = await db.collection('bookings').where('date', '==', date).get();
    const latestBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all non-cancelled bookings for this date
    const dayBookings = latestBookings.filter(b => {
      if (b.cancelled) return false;
      if (b.id === excludeBookingId) return false; // Exclude current booking when editing
      return true;
    });

    // Check each booking for time and rink conflicts
    for (const booking of dayBookings) {
      // Check if time ranges overlap
      const existingStart = booking.startTime;
      const existingEnd = booking.endTime;

      // Time ranges overlap if: start < existing.end AND end > existing.start
      const timesOverlap = startTime < existingEnd && endTime > existingStart;

      if (timesOverlap) {
        // Check if any rinks conflict
        const existingRinks = parseRinks(booking.rinks);
        const conflictingRinks = requestedRinks.filter(r => existingRinks.includes(r));

        if (conflictingRinks.length > 0) {
          return {
            conflict: true,
            rinks: conflictingRinks,
            time: `${existingStart} - ${existingEnd}`,
            booking: booking
          };
        }
      }
    }

    return { conflict: false };
  }

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');

    const formData = new FormData(bookingForm);
    const bookingData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      date: formData.get('date'),
      startTime: document.getElementById('start-time').value,
      endTime: document.getElementById('end-time').value,
      rinks: formData.get('rinks'),
      notes: formData.get('notes'),
      uid: user.uid,
    };

    // Check if this is a recurring booking
    const isRecurring = recurringEnabled.checked;
    const recurringDates = isRecurring
      ? generateRecurringDates(
          bookingData.date,
          recurringFrequency.value,
          Math.min(parseInt(recurringCount.value) || 4, 52)
        )
      : [{ date: bookingData.date }];

    // Validate all fields
    let isValid = true;

    isValid &= validateField('name', bookingData.name, [
      { test: v => v && v.length >= 2, message: 'Name must be at least 2 characters' }
    ]);

    isValid &= validateField('phone', bookingData.phone, [
      { test: v => v && /^[0-9]{8,10}$/.test(v), message: 'Phone must be 8-10 digits' }
    ]);

    if (bookingData.email) {
      isValid &= validateField('email', bookingData.email, [
        { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Please enter a valid email' }
      ]);
    }

    isValid &= validateField('date', bookingData.date, [
      { test: v => v && v.length > 0, message: 'Date is required' }
    ]);

    isValid &= validateField('start-time', bookingData.startTime, [
      { test: v => v && v.length > 0, message: 'Start time is required' }
    ]);

    isValid &= validateField('end-time', bookingData.endTime, [
      { test: v => v && v.length > 0, message: 'End time is required' }
    ]);

    isValid &= validateField('rinks', bookingData.rinks, [
      { test: v => v && v.trim().length > 0, message: 'Rinks field is required' }
    ]);

    if (!isValid) {
      return; // Stop submission if validation fails
    }

    // Prevent booking on a blacked out date
    // Simple string comparison to avoid timezone issues
    const isBlackedOut = blackouts.some(b => b.date === bookingData.date);

    if (isBlackedOut) {
        return alert('This date is blacked out and cannot be booked.');
    }

    if (new Date(`${bookingData.date}T${bookingData.endTime}`) <= new Date(`${bookingData.date}T${bookingData.startTime}`)) {
      return alert('End time must be after start time.');
    }

    // For recurring bookings, check conflicts on ALL dates first
    if (isRecurring && !currentEditId) {
      showLoading();
      const conflicts = [];

      for (const dateItem of recurringDates) {
        const conflictCheck = await checkRinkConflicts(
          dateItem.date,
          bookingData.startTime,
          bookingData.endTime,
          bookingData.rinks,
          null
        );

        if (conflictCheck.conflict) {
          conflicts.push({
            date: dateItem.date,
            ...conflictCheck
          });
        }
      }

      hideLoading();

      if (conflicts.length > 0) {
        const conflictMsg = conflicts.map(c => {
          if (c.message) return `${c.date}: ${c.message}`;
          return `${c.date}: Rink(s) ${c.rinks.join(', ')} already booked ${c.time}`;
        }).join('\n');

        return alert(
          `Cannot create recurring booking due to conflicts:\n\n${conflictMsg}\n\n` +
          `Please adjust your booking or reduce the number of occurrences.`
        );
      }
    } else if (!currentEditId) {
      // Single booking conflict check
      const conflictCheck = await checkRinkConflicts(
        bookingData.date,
        bookingData.startTime,
        bookingData.endTime,
        bookingData.rinks,
        currentEditId
      );

      if (conflictCheck.conflict) {
        if (conflictCheck.message) {
          return alert(conflictCheck.message);
        }
        const rinkList = conflictCheck.rinks.join(', ');
        return alert(
          `Rink conflict! Rink(s) ${rinkList} are already booked from ${conflictCheck.time}.\n\n` +
          `Existing booking: ${conflictCheck.booking.name}`
        );
      }
    }

    try {
      showLoading();

      if (currentEditId) {
        // Update existing booking (no recurring for edits)
        bookingData.updatedBy = user.email;
        bookingData.updatedAt = new Date();
        await db.collection('bookings').doc(currentEditId).update(bookingData);
        showSuccessToast('Booking updated successfully!');
      } else if (isRecurring) {
        // Create recurring bookings
        const recurringGroupId = db.collection('bookings').doc().id; // Generate unique group ID

        for (const dateItem of recurringDates) {
          const recurringBooking = {
            ...bookingData,
            date: dateItem.date,
            createdBy: user.email,
            createdAt: new Date(),
            recurringGroupId: recurringGroupId,
            recurringFrequency: recurringFrequency.value
          };
          await db.collection('bookings').add(recurringBooking);
        }

        showSuccessToast(`${recurringDates.length} recurring bookings created successfully!`);
      } else {
        // Create single booking
        bookingData.createdBy = user.email;
        bookingData.createdAt = new Date();
        await db.collection('bookings').add(bookingData);
        showSuccessToast('Booking created successfully!');
      }

      hideLoading();
      resetBookingForm();
      loadAllData();
    } catch (error) {
      hideLoading();
      console.error("Error saving document: ", error);
      alert('Failed to save booking.');
    }
  });

  blackoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');

    const reason = document.getElementById('blackout-reason').value;
    const date = document.getElementById('blackout-date').value;

    if (!date || !reason) {
        return alert('Please provide a date and a reason for the blackout.');
    }

    try {
        await db.collection('blackouts').add({ date, reason, createdBy: user.email, createdAt: new Date() });
        showSuccessToast('Day blacked out successfully!');
        blackoutForm.reset();
        loadAllData();
    } catch (error) {
        console.error("Error creating blackout: ", error);
        alert("Failed to create blackout.");
    }
  });

  function resetBookingForm() {
      bookingForm.reset();
      currentEditId = null;
      formTitle.textContent = 'Make a Booking';
      bookingForm.querySelector('button[type="submit"]').textContent = 'Create Booking';
      clearAllErrors();
      recurringEnabled.checked = false;
      recurringOptions.style.display = 'none';
      recurringPreview.innerHTML = 'Preview will appear here...';
  }

  // --- REAL-TIME VALIDATION --- //
  // Add blur event listeners for real-time validation
  document.getElementById('name').addEventListener('blur', (e) => {
    validateField('name', e.target.value, [
      { test: v => v && v.length >= 2, message: 'Name must be at least 2 characters' }
    ]);
  });

  document.getElementById('phone').addEventListener('blur', (e) => {
    validateField('phone', e.target.value, [
      { test: v => v && /^[0-9]{8,10}$/.test(v), message: 'Phone must be 8-10 digits' }
    ]);
  });

  document.getElementById('email').addEventListener('blur', (e) => {
    if (e.target.value) {
      validateField('email', e.target.value, [
        { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Please enter a valid email' }
      ]);
    } else {
      clearFieldError('email');
    }
  });

  document.getElementById('rinks').addEventListener('blur', (e) => {
    validateField('rinks', e.target.value, [
      { test: v => v && v.trim().length > 0, message: 'Rinks field is required' }
    ]);
  });

  // --- MODAL EVENT HANDLING --- //
  modalBody.addEventListener('click', async (e) => {
    const bookingId = e.target.dataset.id;
    if (!bookingId) return;

    if (e.target.classList.contains('cancel-btn')) {
      const bookingToCancel = bookings.find(b => b.id === bookingId);

      // Check if this is part of a recurring series
      let cancelSeries = false;
      if (bookingToCancel && bookingToCancel.recurringGroupId) {
        const seriesCount = bookings.filter(b =>
          b.recurringGroupId === bookingToCancel.recurringGroupId && !b.cancelled
        ).length;

        if (seriesCount > 1) {
          const choice = confirm(
            `This is part of a recurring series (${seriesCount} bookings).\n\n` +
            `Click OK to cancel ALL bookings in this series.\n` +
            `Click Cancel to cancel only THIS occurrence.`
          );
          cancelSeries = choice;
        }
      }

      const cancellerName = prompt('To confirm cancellation, please enter your full name:');
      if (cancellerName && cancellerName.trim().length > 1) {
        try {
          showLoading();

          if (cancelSeries) {
            // Cancel all bookings in the series
            const seriesToCancel = bookings.filter(b =>
              b.recurringGroupId === bookingToCancel.recurringGroupId && !b.cancelled
            );

            for (const booking of seriesToCancel) {
              await db.collection('bookings').doc(booking.id).update({
                cancelled: true,
                cancelledBy: cancellerName.trim(),
                cancelledAt: new Date()
              });
            }

            hideLoading();
            showSuccessToast(`${seriesToCancel.length} recurring bookings cancelled successfully!`);
          } else {
            // Cancel just this one
            await db.collection('bookings').doc(bookingId).update({
                cancelled: true,
                cancelledBy: cancellerName.trim(),
                cancelledAt: new Date()
            });

            hideLoading();
            showSuccessToast('Booking cancelled successfully!');
          }

          bookingModal.style.display = 'none';
          loadAllData();
        } catch (error) {
          hideLoading();
          console.error('Error cancelling booking:', error);
          alert('Failed to cancel booking.');
        }
      }
    } else if (e.target.classList.contains('edit-btn')) {
      const bookingToEdit = bookings.find(b => b.id === bookingId);
      if (bookingToEdit) {
        bookingForm.elements['name'].value = bookingToEdit.name;
        bookingForm.elements['phone'].value = bookingToEdit.phone;
        bookingForm.elements['email'].value = bookingToEdit.email || '';
        bookingForm.elements['date'].value = bookingToEdit.date;
        document.getElementById('start-time').value = bookingToEdit.startTime;
        document.getElementById('end-time').value = bookingToEdit.endTime;
        bookingForm.elements['rinks'].value = bookingToEdit.rinks;
        bookingForm.elements['notes'].value = bookingToEdit.notes || '';
        
        currentEditId = bookingId;
        formTitle.textContent = 'Edit Booking';
        bookingForm.querySelector('button[type="submit"]').textContent = 'Update Booking';
        
        bookingModal.style.display = 'none';
        bookingForm.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // --- UTILITY & NAVIGATION --- //
  function populateTimeSelects() {
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    
    startTimeSelect.innerHTML = '';
    endTimeSelect.innerHTML = '';

    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            const timeValue = `${hour}:${minute}`;

            const option1 = document.createElement('option');
            option1.value = timeValue;
            option1.textContent = timeValue;
            startTimeSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = timeValue;
            option2.textContent = timeValue;
            endTimeSelect.appendChild(option2);
        }
    }
  }

  function parseRinks(rinkStr) {
    if (!rinkStr) return [];
    const rinks = new Set();
    rinkStr.split(',').forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        const [start, end] = trimmedPart.split('-').map(Number);
        for (let i = start; i <= end; i++) rinks.add(i);
      } else if (trimmedPart) {
        rinks.add(Number(trimmedPart));
      }
    });
    return Array.from(rinks);
  }

  prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
  nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
  todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });
  closeModalBtn.addEventListener('click', () => { bookingModal.style.display = 'none'; });
  window.addEventListener('click', (e) => { if (e.target == bookingModal) bookingModal.style.display = 'none'; });

  // --- SEARCH/FILTER FUNCTIONALITY --- //

  function displaySearchResults(query) {
    if (!query || query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    const queryLower = query.toLowerCase();
    const matches = bookings.filter(b => {
      if (b.cancelled) return false;
      return b.name.toLowerCase().includes(queryLower) ||
             b.phone.includes(query) ||
             (b.email && b.email.toLowerCase().includes(queryLower));
    }).sort((a, b) => {
      // Sort by date, then by time
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No bookings found matching your search.</div>';
      searchResults.style.display = 'block';
      return;
    }

    let html = `<div class="search-results-header">Found ${matches.length} booking${matches.length > 1 ? 's' : ''}</div>`;

    matches.forEach(booking => {
      const dateObj = new Date(booking.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const recurringBadge = booking.recurringGroupId ? '<span class="search-result-recurring">🔁 Recurring</span>' : '';

      html += `
        <div class="search-result-item" data-booking-id="${booking.id}" data-date="${booking.date}">
          <div class="search-result-name">${booking.name}${recurringBadge}</div>
          <div class="search-result-details">
            📅 ${formattedDate}<br>
            🕐 ${booking.startTime} - ${booking.endTime}<br>
            🎯 Rinks: ${booking.rinks}<br>
            📞 ${booking.phone}
          </div>
        </div>
      `;
    });

    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    displaySearchResults(searchQuery);
    renderCalendar(); // Still highlight matching days on calendar
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchResults.style.display = 'none';
    renderCalendar();
  });

  // Click on search result to navigate to that date
  searchResults.addEventListener('click', (e) => {
    const resultItem = e.target.closest('.search-result-item');
    if (!resultItem) return;

    const bookingDate = resultItem.dataset.date;
    const [year, month, day] = bookingDate.split('-').map(Number);
    currentDate = new Date(year, month - 1, day);
    renderCalendar();

    // Scroll calendar into view
    calendarEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // --- RECURRING BOOKING EVENT LISTENERS --- //
  recurringEnabled.addEventListener('change', (e) => {
    recurringOptions.style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked) {
      updateRecurringPreview();
    }
  });

  recurringFrequency.addEventListener('change', updateRecurringPreview);
  recurringCount.addEventListener('input', updateRecurringPreview);
  document.getElementById('date').addEventListener('change', updateRecurringPreview);

  // --- CSV IMPORT/EXPORT (ADMIN ONLY) --- //
  const uploadCsvBtn = document.getElementById('upload-csv-btn');
  const csvUploadInput = document.getElementById('csv-upload');
  const uploadStatus = document.getElementById('upload-status');
  const downloadCsvBtn = document.getElementById('download-csv-btn');
  const downloadStatus = document.getElementById('download-status');

  // CSV Upload
  uploadCsvBtn.addEventListener('click', async () => {
    const file = csvUploadInput.files[0];
    if (!file) {
      uploadStatus.textContent = 'Please select a CSV file first.';
      uploadStatus.style.color = '#f44336';
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      uploadStatus.textContent = 'You must be logged in.';
      uploadStatus.style.color = '#f44336';
      return;
    }

    uploadStatus.textContent = 'Processing CSV...';
    uploadStatus.style.color = '#009688';

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');

      // Skip header row
      const dataLines = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Proper CSV parser that handles quoted fields
      function parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote mode
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            fields.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }

        // Add last field
        fields.push(current.trim());
        return fields;
      }

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        try {
          const fields = parseCSVLine(line);

          if (fields.length < 7) {
            errors.push(`Line ${i + 2}: Not enough fields (need at least 7: name,phone,email,date,startTime,endTime,rinks)`);
            errorCount++;
            continue;
          }

          const [name, phone, email, date, startTime, endTime, rinksRaw, ...notesParts] = fields;
          const rinks = rinksRaw.replace(/^"|"$/g, ''); // Remove surrounding quotes
          const notes = notesParts.join(',').trim(); // Rejoin notes in case they had commas

          // Validate date format (must be YYYY-MM-DD)
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!datePattern.test(date)) {
            errors.push(`Line ${i + 2}: Invalid date format "${date}". Must be YYYY-MM-DD (e.g., 2025-12-01)`);
            errorCount++;
            continue;
          }

          // Validate time format (must be HH:MM)
          const timePattern = /^\d{2}:\d{2}$/;
          if (!timePattern.test(startTime)) {
            errors.push(`Line ${i + 2}: Invalid start time "${startTime}". Must be HH:MM (e.g., 08:00, not 8:00)`);
            errorCount++;
            continue;
          }
          if (!timePattern.test(endTime)) {
            errors.push(`Line ${i + 2}: Invalid end time "${endTime}". Must be HH:MM (e.g., 14:00, not 2:00 PM)`);
            errorCount++;
            continue;
          }

          // Validate required fields
          if (!name || name.length < 2) {
            errors.push(`Line ${i + 2}: Name is required and must be at least 2 characters`);
            errorCount++;
            continue;
          }

          if (!phone || phone.length < 8) {
            errors.push(`Line ${i + 2}: Phone is required and must be at least 8 digits`);
            errorCount++;
            continue;
          }

          if (!rinks) {
            errors.push(`Line ${i + 2}: Rinks field is required`);
            errorCount++;
            continue;
          }

          await db.collection('bookings').add({
            name,
            phone,
            email: email || '',
            date,
            startTime,
            endTime,
            rinks,
            notes: notes || '',
            uid: user.uid,
            createdBy: user.email,
            createdAt: new Date()
          });
          successCount++;
        } catch (err) {
          errors.push(`Line ${i + 2}: ${err.message}`);
          errorCount++;
        }
      }

      let statusMsg = `✓ ${successCount} bookings created`;
      if (errorCount > 0) {
        statusMsg += `, ${errorCount} failed`;
      }
      uploadStatus.textContent = statusMsg;
      uploadStatus.style.color = errorCount > 0 ? '#ff9800' : '#4caf50';

      if (errors.length > 0 && errors.length <= 5) {
        uploadStatus.textContent += '\n' + errors.join('\n');
      } else if (errors.length > 5) {
        uploadStatus.textContent += `\nFirst 5 errors:\n` + errors.slice(0, 5).join('\n');
      }

      csvUploadInput.value = '';
      loadAllData();
    } catch (error) {
      uploadStatus.textContent = 'Error: ' + error.message;
      uploadStatus.style.color = '#f44336';
    }
  });

  // CSV Download
  downloadCsvBtn.addEventListener('click', () => {
    const startDate = document.getElementById('export-start-date').value;
    const endDate = document.getElementById('export-end-date').value;

    if (!startDate || !endDate) {
      downloadStatus.textContent = 'Please select both start and end dates.';
      downloadStatus.style.color = '#f44336';
      return;
    }

    if (startDate > endDate) {
      downloadStatus.textContent = 'Start date must be before end date.';
      downloadStatus.style.color = '#f44336';
      return;
    }

    // Filter bookings by date range
    const filteredBookings = bookings.filter(b => {
      return b.date >= startDate && b.date <= endDate;
    });

    if (filteredBookings.length === 0) {
      downloadStatus.textContent = 'No bookings found in this date range.';
      downloadStatus.style.color = '#ff9800';
      return;
    }

    // Generate CSV
    const header = 'name,phone,email,date,startTime,endTime,rinks,notes,cancelled,cancelledBy,createdBy\n';
    const rows = filteredBookings.map(b => {
      const escapeCsv = (val) => {
        if (!val) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      return [
        escapeCsv(b.name),
        escapeCsv(b.phone),
        escapeCsv(b.email),
        escapeCsv(b.date),
        escapeCsv(b.startTime),
        escapeCsv(b.endTime),
        escapeCsv(b.rinks),
        escapeCsv(b.notes),
        b.cancelled ? 'Yes' : 'No',
        escapeCsv(b.cancelledBy),
        escapeCsv(b.createdBy)
      ].join(',');
    }).join('\n');

    const csv = header + rows;

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    downloadStatus.textContent = `✓ Downloaded ${filteredBookings.length} bookings`;
    downloadStatus.style.color = '#4caf50';

    // Clear status after 3 seconds
    setTimeout(() => {
      downloadStatus.textContent = '';
    }, 3000);
  });

  // Initial Load
  populateTimeSelects();
  // loadAllData() will be called by onAuthStateChanged
});
