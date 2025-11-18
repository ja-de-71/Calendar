
# Master Prompt: Firebase Calendar Booking App - Authentication Bug

## 1. The Goal

The primary goal of this project is to create a simple, single-page web application for booking appointments on a calendar. The application must use Firebase for all backend services, including user authentication, a Firestore database to store booking information, and Firebase Hosting for deployment.

The core functionality is as follows:
- Users must be able to create an account and sign in.
- Authenticated users can view a calendar with available and booked dates.
- Authenticated users can create, edit, and cancel their own bookings.
- The application should prevent booking on dates that are blacked out by an administrator.
- The application should be deployed and accessible via a public Firebase Hosting URL.

## 2. The Unresolved Bug

The application is currently deployed and functional, with one critical exception: the user authentication flow is not working as expected.

When an existing user, already registered in Firebase Authentication, attempts to sign in, they are incorrectly presented with the "Create account" form instead of a "Sign in" form. This prevents existing users from accessing the application.

This bug has been verified by the user "jason.dean192@googlemail.com", who exists in the Firebase Authentication user list but is still being prompted to create a new account.

## 3. Technology Stack

This is a single-page web application built with the following technologies:

- **Frontend:** HTML, CSS, and vanilla JavaScript.
- **Backend:** Firebase
  - **Authentication:** Firebase Authentication with the FirebaseUI library for the user interface.
  - **Database:** Firestore for storing booking and blackout data.
  - **Hosting:** Firebase Hosting for deploying the application.
- **Project Configuration:** `firebase.json` for Firebase configuration, and `firestore.rules` for database security rules.

## 4. Project Structure

The project has the following file and folder structure:

```
.
├── firebase.json
├── firestore.rules
├── public
│   ├── app.js
│   ├── favicon.ico
│   ├── index.html
│   └── styles.css
└── README.md
```

## 5. File Contents

Here is the full content of each relevant file:

### `firebase.json`

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### `public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendar Booking</title>
  <link rel="stylesheet" href="styles.css">
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
  <script src="https://www.gstatic.com/firebasejs/ui/4.8.1/firebase-ui-auth.js"></script>
  <link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/4.8.1/firebase-ui-auth.css" />
</head>
<body>
  <div id="firebaseui-auth-container"></div>
  <div id="app" style="display:none;">
    <header>
      <h1>Calendar Booking</h1>
      <div id="user-info">
        <span id="user-email"></span>
        <button id="sign-out">Sign Out</button>
      </div>
    </header>
    <main>
      <div class="calendar-container">
        <div class="calendar-header">
          <button id="prev-month">&lt;</button>
          <h2 id="month-year"></h2>
          <button id="next-month">&gt;</button>
          <button id="today">Today</button>
        </div>
        <div id="calendar" class="calendar-grid"></div>
      </div>
      <div class="booking-container">
        <h2>Make a Booking</h2>
        <form id="booking-form">
          <input type="text" name="name" placeholder="Name" required>
          <input type="tel" name="phone" placeholder="Phone">
          <input type="email" name="email" placeholder="Email">
          <input type="date" name="date" required>
          <label for="start-time">Start Time:</label>
          <select id="start-time" name="startTime"></select>
          <label for="end-time">End Time:</label>
          <select id="end-time" name="endTime"></select>
          <input type="text" name="rinks" placeholder="Rinks (e.g., 1, 3-5)">
          <textarea name="notes" placeholder="Notes"></textarea>
          <button type="submit">Create Booking</button>
        </form>
      </div>
      <div class="blackout-container">
        <h2>Blackout a Date</h2>
        <form id="blackout-form">
          <input type="date" id="blackout-date" required>
          <input type="text" id="blackout-reason" placeholder="Reason" required>
          <button type="submit">Blackout</button>
        </form>
      </div>
    </main>
    <div id="booking-modal" class="modal">
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <div id="modal-body"></div>
      </div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

### `public/styles.css`

```css
/* Basic styling */
body { font-family: sans-serif; margin: 20px; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
main { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.calendar-container { border: 1px solid #ccc; padding: 10px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.calendar-day { border: 1px solid #eee; min-height: 100px; padding: 5px; }
.day-number { font-weight: bold; }
.has-bookings { background-color: #e0f7fa; }
.day-blackout { background-color: #ffcdd2; text-decoration: line-through; }
.blackout-reason { font-size: 0.8em; color: #b71c1c; }
.booking-summary { font-size: 0.8em; }
.booking-container, .blackout-container { border: 1px solid #ccc; padding: 20px; }
form { display: flex; flex-direction: column; gap: 10px; }
.modal { display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); justify-content: center; align-items: center; }
.modal-content { background-color: #fefefe; padding: 20px; border: 1px solid #888; width: 80%; max-width: 500px; }
.close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; }
.close-button:hover, .close-button:focus { color: black; text-decoration: none; cursor: pointer; }
.booking-entry { border-bottom: 1px solid #eee; padding: 10px 0; }
.booking-actions { margin-top: 10px; }
```

### `public/app.js`

```javascript
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
        console.warn('Firestore persistence failed: failed-precondition');
      } else if (err.code == 'unimplemented') {
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
      ui.start('#firebaseui-auth-container', uiConfig);
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

  // Initial Load
  populateTimeSelects();
  // loadAllData() will be called by onAuthStateChanged
});
```

## 6. Summary of Unsuccessful Attempts

The following changes were made to `public/app.js` in an attempt to resolve the issue, but none were successful:

1.  **Explicitly set `signInFlow` to `'popup'`:**  The `signInFlow` was set to `'popup'` in the `uiConfig` object.
2.  **Disable `credentialHelper`:**  The `credentialHelper` was set to `firebaseui.auth.CredentialHelper.NONE`.
3.  **Simplify `signInOptions`:** The `signInOptions` array was simplified from an array of objects to an array of strings.
4.  **Change to `'redirect'` flow:** The `signInFlow` was changed from `'popup'` to `'redirect'`, and the `signInSuccessUrl` was set.

Despite these changes, the authentication flow has remained broken for existing users. The issue persists.

---
I have created the `master_prompt.md` file as you requested. I sincerely hope that this detailed information will be helpful in resolving the issue. I apologize again for my failure to fix this for you.
