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

  // App state
  let currentDate = new Date();
  let bookings = [];
  let blackouts = []; // For storing blackout dates
  let currentEditId = null;

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

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar-day');
      const date = new Date(Date.UTC(year, month, i));

      // Format date as YYYY-MM-DD for consistent comparison
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

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
          const bookingList = bookingsForDay.map(b =>
            `<div class="booking-summary">${b.startTime} - ${b.endTime} (${parseRinks(b.rinks).length} rinks)</div>`
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

  function showBookingModal(date) {
    modalBody.innerHTML = '';
    // Convert Date object to YYYY-MM-DD string for comparison
    const dateString = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => b.date === dateString);

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
    
    // Prevent booking on a blacked out date
    // Simple string comparison to avoid timezone issues
    const isBlackedOut = blackouts.some(b => b.date === bookingData.date);

    if (isBlackedOut) {
        return alert('This date is blacked out and cannot be booked.');
    }

    if (new Date(`${bookingData.date}T${bookingData.endTime}`) <= new Date(`${bookingData.date}T${bookingData.startTime}`)) {
      return alert('End time must be after start time.');
    }

    // Check for rink conflicts (reloads latest data from Firestore)
    const conflictCheck = await checkRinkConflicts(
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime,
      bookingData.rinks,
      currentEditId // Exclude current booking when editing
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
      resetBookingForm();
      loadAllData();
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

  function resetBookingForm() {
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
          await db.collection('bookings').doc(bookingId).update({
              cancelled: true,
              cancelledBy: cancellerName.trim(),
              cancelledAt: new Date()
          });
          bookingModal.style.display = 'none';
          loadAllData();
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

          const [name, phone, email, date, startTime, endTime, rinks, ...notesParts] = fields;
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
