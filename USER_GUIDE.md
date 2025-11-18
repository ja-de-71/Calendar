# Portland Memorial Bowls - Calendar Booking System
## User Guide

---

## Getting Started

### Accessing the Calendar

**Internal Calendar (Login Required)**
- URL: `https://calendar-3391e.web.app`
- Use this for making, editing, and cancelling bookings

**Public Calendar (Read-Only)**
- URL: `https://calendar-3391e.web.app/public-calendar.html`
- View all bookings without logging in
- Click on bookings to see details in a tooltip

---

## Logging In

1. Navigate to `https://calendar-3391e.web.app`
2. Enter your **email address** and **password**
3. Click **Sign In**

### Forgot Password?
1. Click **"Forgot password?"** below the sign-in form
2. Enter your email address
3. Click **Send Reset Link**
4. Check your email inbox for the password reset link
5. Follow the link to create a new password
6. Return to the calendar and sign in with your new password

---

## Viewing the Calendar

### Calendar Navigation
- **Previous/Next Month**: Click the arrows (< >) to move between months
- **Today**: Click the "Today" button to jump to the current month
- **Day Headers**: Each column shows the day of the week (Sun-Sat)
- **Today's Date**: Highlighted with an orange border

### Understanding Calendar Colors
- **Light Blue Days**: Days with bookings
- **Gray Days**: Blacked-out days (unavailable for booking)
- **Orange Border**: Today's date
- **Green Border**: Days matching your search (when using search)

### Booking Information on Calendar
Each booking shows:
- Start time - End time (e.g., 09:00 - 11:00)
- Number of rinks booked (e.g., 4 rinks)
- First 25 characters of booking notes in italic gray text

**Example:**
```
09:00 - 11:00 (4 rinks)
Tournament practice...
```

---

## Searching for Bookings

### How to Search
1. Locate the **search box** below the calendar summary
2. Type at least **2 characters** to search
3. Search works on:
   - Name
   - Phone number
   - Email address

### Search Results
- Results appear in a panel below the search box
- Shows matching bookings sorted by date and time
- Each result displays:
  - Booking name and date
  - Time slot
  - Rinks
  - Phone number
  - 🔁 icon if it's a recurring booking

### Navigating from Search Results
- **Click any search result** to jump to that date on the calendar
- Calendar automatically scrolls into view
- Matching days are highlighted with a green border

### Clearing Search
- Click the **Clear** button next to the search box
- Or delete all text from the search box

---

## Making a Booking

### Step-by-Step Instructions

1. **Fill in Contact Information**
   - **Name**: Your full name (minimum 2 characters)
   - **Phone**: Your phone number (8-10 digits, numbers only)
   - **Email**: Optional, but recommended for notifications

2. **Select Date and Time**
   - **Date**: Click the date field and select from calendar picker
   - **Start Time**: Choose from dropdown (15-minute intervals)
   - **End Time**: Choose from dropdown
   - *Note: End time must be after start time*

3. **Choose Rinks**
   - Enter rink numbers in the **Rinks** field
   - Format options:
     - Single rink: `1`
     - Multiple rinks: `1,2,5`
     - Range of rinks: `1-4`
     - Mixed: `1-4,7,8`
   - Maximum 8 rinks total

4. **Add Notes (Optional)**
   - Enter any additional information
   - Examples: "Tournament practice", "Team training", "Championship"
   - Notes will be visible on the calendar and to the public

5. **Click "Create Booking"**
   - Form will validate all fields
   - If there's a conflict, you'll see an error message
   - On success, you'll see a green confirmation toast

### Field Validation
The form validates in real-time as you fill it out:
- **Green border**: Field is valid
- **Red border**: Field has an error
- **Error message**: Appears below the field explaining the issue

---

## Making Recurring Bookings

### When to Use Recurring Bookings
Use recurring bookings when you need the **same time slot regularly**, such as:
- Weekly team practice
- Bi-weekly tournaments
- Monthly club meetings

### Creating a Recurring Booking

1. **Fill in all standard booking fields** (name, phone, date, time, rinks, notes)

2. **Check "Make this a recurring booking"**
   - A new section will appear with recurring options

3. **Choose Frequency**
   - **Weekly**: Same day/time every week (e.g., every Tuesday)
   - **Bi-weekly**: Same day/time every 2 weeks
   - **Monthly**: Same date each month (e.g., 15th of every month)

4. **Set Number of Occurrences**
   - Enter how many times you want the booking to repeat
   - Includes the first booking (e.g., 4 means this week + next 3 weeks)
   - Maximum: 52 occurrences

5. **Review the Preview**
   - A preview box shows all dates that will be booked
   - Verify the dates are correct before submitting

6. **Click "Create Booking"**
   - System checks ALL dates for conflicts
   - If any date has a conflict, the entire series is rejected
   - If successful, all bookings are created at once
   - Confirmation shows number of bookings created

### Example Recurring Booking
- **Scenario**: Weekly team practice, every Tuesday, for 12 weeks
- **Settings**:
  - Date: 2025-11-18 (a Tuesday)
  - Repeat: Weekly
  - Occurrences: 12
- **Result**: Creates 12 bookings, one for each Tuesday

---

## Viewing Booking Details

### On Days with Bookings
Click any day with bookings to see:
- All bookings for that day
- Details for each booking:
  - Name
  - Time slot
  - Rinks
  - Phone number
  - Full notes
  - Recurring indicator (if applicable)
  - Cancellation status (if cancelled)

### Viewing Rink Availability

**Two ways to view availability:**

**Method 1: Shift + Click**
- Hold **Shift** and click any day

**Method 2: Right-Click**
- Right-click any day on the calendar

**Availability View Shows:**
- Time-by-time grid (6 AM to 10 PM)
- All 8 rinks across the top
- ✓ Green cells = Rink available at that time
- ✗ Red cells = Rink booked at that time

**Perfect for:**
- Finding available rinks
- Planning bookings around existing bookings
- Seeing peak usage times

---

## Editing a Booking

### Who Can Edit?
You can only edit bookings that you created (linked to your account).

### How to Edit

1. **Click the day** with your booking
2. **Click the "Edit" button** next to your booking in the modal
3. Form fills with current booking details
4. **Make your changes**
5. **Click "Update Booking"**
   - System checks for conflicts with the new time/date
   - Confirmation shown on success

**Notes:**
- You cannot convert a single booking to recurring when editing
- You cannot edit a recurring series at once (edit each individually)
- Updated bookings show who updated them and when

---

## Cancelling a Booking

### Single Booking Cancellation

1. **Click the day** with your booking
2. **Click the "Cancel" button** next to your booking
3. **Enter your full name** in the confirmation prompt
4. Booking is marked as cancelled (not deleted)
5. Cancelled bookings show:
   - "CANCELLED" in red
   - Who cancelled it
   - When it was cancelled

### Recurring Booking Cancellation

When you cancel a booking that's part of a recurring series:

1. **Click "Cancel"** on any occurrence in the series
2. You'll see a **choice prompt**:
   - **OK**: Cancel ALL bookings in the series
   - **Cancel**: Cancel only THIS single occurrence
3. **Enter your full name** to confirm
4. Bookings are cancelled as requested

**Example:**
- You have 10 recurring bookings
- You cancel the 3rd one
- Choose to cancel ALL
- All 10 bookings are cancelled at once

---

## Using the Public Calendar

### Accessing
Navigate to: `https://calendar-3391e.web.app/public-calendar.html`

### Features
- **No login required**
- View all active bookings
- See booking notes preview on calendar
- Click any booking to see full details in a tooltip

### Viewing Booking Details
1. **Click any booking** on the calendar
2. **Tooltip appears** showing:
   - Full date (e.g., "Monday, November 18, 2025")
   - Time slot
   - Rinks
   - Complete notes
3. **Click outside** the tooltip to close it

### What You Cannot Do
- Create bookings
- Edit bookings
- Cancel bookings
- See contact information (phone/email)

---

## Tips & Best Practices

### Booking Tips
- **Book early**: Popular times fill up quickly
- **Use notes**: Add context so others know what the booking is for
- **Use recurring bookings**: Save time for regular bookings
- **Check availability first**: Right-click a day to see what's free

### Avoiding Conflicts
- The system prevents double-booking rinks
- Check the availability view before booking
- If you get a conflict error:
  - Choose different rinks
  - Choose a different time
  - Check who has the existing booking

### Managing Recurring Bookings
- Recurring bookings have a 🔁 icon
- All bookings in a series are linked
- Be careful when cancelling - confirm if you want to cancel just one or all
- You cannot partially edit a series (each occurrence is independent after creation)

### Search Efficiently
- Search by name to find all bookings for a person
- Search by phone number for quick lookup
- Use the search result links to jump to booking dates

---

## Troubleshooting

### Can't Log In
- Verify you're using the correct email
- Use "Forgot password?" to reset if needed
- Check for typos in email/password
- Clear browser cache and try again

### Booking Not Saving
- Check all fields have green borders (valid)
- Ensure end time is after start time
- Verify rink format is correct (e.g., 1-4, not 1 to 4)
- Check for conflict error messages

### Can't See My Booking
- Refresh the page (Ctrl+R or Cmd+R)
- Check you're looking at the correct month
- Verify the booking wasn't cancelled
- Use search to find the booking by name

### Recurring Booking Failed
- Check if ANY of the dates have conflicts
- System rejects entire series if one date conflicts
- Reduce number of occurrences and try again
- Or manually book each date individually

---

## Mobile Usage

The calendar is fully responsive and works great on phones and tablets!

### Mobile Tips
- **Pinch to zoom**: If calendar text is too small
- **Long-press**: Instead of right-click to see availability
- **Portrait mode**: Works best for forms
- **Landscape mode**: Works best for viewing calendar grid

### Mobile-Specific Features
- Search stacks vertically for easier use
- Forms are full-width for easier tapping
- Calendar grid adjusts for smaller screens
- Modals and tooltips are touch-friendly

---

## Support

If you encounter any issues or have questions:
1. Try refreshing the page
2. Clear your browser cache
3. Try a different browser (Chrome, Firefox, Safari, Edge)
4. Check the troubleshooting section above
5. Contact your administrator for assistance

---

**Version 0.11.1**
Last Updated: November 2025
Portland Memorial Bowls Calendar System
