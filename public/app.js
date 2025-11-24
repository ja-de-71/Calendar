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

  // Enable offline persistence
  db.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore persistence failed: failed-precondition');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence failed: unimplemented');
      }
    });

  // UI Elements
  const app = document.getElementById('app');
  const userEmail = document.getElementById('user-email');
  const signOut = document.getElementById('sign-out');
  const authContainer = document.getElementById('firebaseui-auth-container');
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

  // App state
  let currentDate = new Date();
  let bookings = [];
  let blackouts = []; // For storing blackout dates
  let currentEditId = null;
  let uiStarted = false; // Track if FirebaseUI has been started

  // FirebaseUI config
  const ui = new firebaseui.auth.AuthUI(auth);
  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return true to redirect the user to the signInSuccessUrl
        return true;
      }
    },
    signInFlow: 'redirect',
    signInSuccessUrl: '/',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
  };

  // --- AUTHENTICATION --- //
  auth.onAuthStateChanged(user => {
    if (user) {
      app.style.display = 'block';
      authContainer.style.display = 'none';
      userEmail.textContent = user.email;
      loadAllData();
    } else {
      app.style.display = 'none';
      authContainer.style.display = 'block';
      // Only start FirebaseUI once to avoid repeated initialization
      if (!uiStarted) {
        ui.start('#firebaseui-auth-container', uiConfig);
        uiStarted = true;
      }
    }
  });

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

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar-day');
      const date = new Date(Date.UTC(year, month, i));

      const blackout = blackouts.find(b => {
          const blackoutDate = new Date(b.date);
          return blackoutDate.getUTCFullYear() === date.getUTCFullYear() &&
                 blackoutDate.getUTCMonth() === date.getUTCMonth() &&
                 blackoutDate.getUTCDate() === date.getUTCDate();
      });

      dayEl.innerHTML = `<div class="day-number">${i}</div>`;

      if (blackout) {
        dayEl.classList.add('day-blackout');
        dayEl.innerHTML += `<div class="blackout-reason">${blackout.reason}</div>`;
      } else {
        const bookingsForDay = bookings.filter(b => {
          const bookingDate = new Date(b.date);
          return !b.cancelled &&
                 bookingDate.getUTCFullYear() === date.getUTCFullYear() &&
                 bookingDate.getUTCMonth() === date.getUTCMonth() &&
                 bookingDate.getUTCDate() === date.getUTCDate();
        });

        if (bookingsForDay.length > 0) {
          dayEl.classList.add('has-bookings');
          const bookingList = bookingsForDay.map(b => 
            `<div class="booking-summary">${b.startTime} (${parseRinks(b.rinks).length} rinks)</div>`
          ).join('');
          dayEl.innerHTML += bookingList;
          dayEl.addEventListener('click', () => showBookingModal(date));
        }
      }
      calendarEl.appendChild(dayEl);
    }
  }

  // --- DATA LOADING --- //
  async function loadAllData() {
    const bookingsSnapshot = await db.collection('bookings').orderBy('startTime').get();
    bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const blackoutsSnapshot = await db.collection('blackouts').get();
    blackouts = blackoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    renderCalendar();
  }

  // --- PUBLIC DAY SUMMARY SYNC --- //
  // Updates the public-facing calendar data (anonymized)
  async function updatePublicDaySummary(date) {
    try {
      // Get all non-cancelled bookings for this date
      const dayBookings = bookings.filter(b =>
        b.date === date && !b.cancelled
      );

      if (dayBookings.length === 0) {
        // No bookings - delete the public summary for this day
        await db.collection('publicDaySummary').doc(date).delete();
      } else {
        // Create safe public data (no names, phones, emails)
        const publicData = {
          date: date,
          bookings: dayBookings.map(b => ({
            startTime: b.startTime,
            endTime: b.endTime,
            rinks: b.rinks,
            label: b.notes || 'Booking'  // Use notes as the public label
          }))
        };

        await db.collection('publicDaySummary').doc(date).set(publicData);
      }
    } catch (error) {
      console.error('Error updating public day summary:', error);
    }
  }

  function showBookingModal(date) {
    modalBody.innerHTML = '';
    const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.getUTCFullYear() === date.getUTCFullYear() &&
               bookingDate.getUTCMonth() === date.getUTCMonth() &&
               bookingDate.getUTCDate() === date.getUTCDate();
    });

    dayBookings.forEach(booking => {
      const bookingEl = document.createElement('div');
      bookingEl.classList.add('booking-entry');
      let buttonsHTML = '';
      if (auth.currentUser && auth.currentUser.uid === booking.uid && !booking.cancelled) {
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

      bookingEl.innerHTML = `
        <h4>${booking.name}</h4>
        ${cancelledInfo}
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

  // --- FORM HANDLING --- //
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
    
    // Prevent booking on a blacked out date
    const d = new Date(bookingData.date + "T00:00:00");
    const isBlackedOut = blackouts.some(b => {
        const blackoutDate = new Date(b.date);
        return blackoutDate.getUTCFullYear() === d.getUTCFullYear() &&
               blackoutDate.getUTCMonth() === d.getUTCMonth() &&
               blackoutDate.getUTCDate() === d.getUTCDate();
    });

    if (isBlackedOut) {
        return alert('This date is blacked out and cannot be booked.');
    }

    if (new Date(`${bookingData.date}T${bookingData.endTime}`) <= new Date(`${bookingData.date}T${bookingData.startTime}`)) {
      return alert('End time must be after start time.');
    }

    try {
      if (currentEditId) {
        bookingData.updatedBy = user.email;
        bookingData.updatedAt = new Date();
        await db.collection('bookings').doc(currentEditId).update(bookingData);
      } else {
        bookingData.createdBy = user.email;
        bookingData.createdAt = new Date();
        await db.collection('bookings').add(bookingData);
      }
      resetForm();
      await loadAllData();
      // Update public calendar with safe anonymized data
      await updatePublicDaySummary(bookingData.date);
    } catch (error) {
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
        blackoutForm.reset();
        loadAllData();
    } catch (error) {
        console.error("Error creating blackout: ", error);
        alert("Failed to create blackout.");
    }
  });

  function resetForm() {
      bookingForm.reset();
      currentEditId = null;
      formTitle.textContent = 'Make a Booking';
      bookingForm.querySelector('button[type="submit"]').textContent = 'Create Booking';
  }

  // --- MODAL EVENT HANDLING --- //
  modalBody.addEventListener('click', async (e) => {
    const bookingId = e.target.dataset.id;
    if (!bookingId) return;

    if (e.target.classList.contains('cancel-btn')) {
      const cancellerName = prompt('To confirm cancellation, please enter your full name:');
      if (cancellerName && cancellerName.trim().length > 1) {
        try {
          const bookingToCancel = bookings.find(b => b.id === bookingId);
          await db.collection('bookings').doc(bookingId).update({
              cancelled: true,
              cancelledBy: cancellerName.trim(),
              cancelledAt: new Date()
          });
          bookingModal.style.display = 'none';
          await loadAllData();
          // Update public calendar to remove cancelled booking
          if (bookingToCancel) {
            await updatePublicDaySummary(bookingToCancel.date);
          }
        } catch (error) {
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

  // Initial Load
  populateTimeSelects();
  // loadAllData() will be called by onAuthStateChanged
});
