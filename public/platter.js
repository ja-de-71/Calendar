// Portland Memorial Bowls - Platter Ordering System
// JavaScript for platter management and ordering

// Firebase configuration (shared with main calendar)
const firebaseConfig = {
  apiKey: "AIzaSyDcQHAqb4EfIQjxZnIg_NbFJ5zrENGKRt0",
  authDomain: "calendar-3391e.firebaseapp.com",
  projectId: "calendar-3391e",
  storageBucket: "calendar-3391e.firebasestorage.app",
  messagingSenderId: "200867528706",
  appId: "1:200867528706:web:b7133926d0626a91d4671b"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Admin email - matches calendar admin
const ADMIN_EMAIL = 'jody.andrews@portlandmemorialbowls.co.nz';

// === HELPER FUNCTIONS === //

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function showLoading() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'none';
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

// Generate unique order number
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${year}-${random}`;
}

// === MENU ITEM MANAGEMENT === //

async function loadMenuItems() {
  try {
    const snapshot = await db.collection('platterMenuItems')
      .orderBy('sortOrder')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading menu items:', error);
    return [];
  }
}

async function createMenuItem(itemData) {
  try {
    const docRef = await db.collection('platterMenuItems').add({
      ...itemData,
      createdAt: new Date(),
      createdBy: auth.currentUser.email
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating menu item:', error);
    return { success: false, error: error.message };
  }
}

async function updateMenuItem(itemId, itemData) {
  try {
    await db.collection('platterMenuItems').doc(itemId).update({
      ...itemData,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.email
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { success: false, error: error.message };
  }
}

async function deleteMenuItem(itemId) {
  try {
    await db.collection('platterMenuItems').doc(itemId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { success: false, error: error.message };
  }
}

// === PRICING CONFIG MANAGEMENT === //

async function loadPricingConfig() {
  try {
    const snapshot = await db.collection('platterPricingConfig').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading pricing config:', error);
    return [];
  }
}

async function createPricingTier(tierData) {
  try {
    const docRef = await db.collection('platterPricingConfig').add({
      ...tierData,
      createdAt: new Date(),
      createdBy: auth.currentUser.email
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    return { success: false, error: error.message };
  }
}

async function updatePricingTier(tierId, tierData) {
  try {
    await db.collection('platterPricingConfig').doc(tierId).update({
      ...tierData,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.email
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating pricing tier:', error);
    return { success: false, error: error.message };
  }
}

async function deletePricingTier(tierId) {
  try {
    await db.collection('platterPricingConfig').doc(tierId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting pricing tier:', error);
    return { success: false, error: error.message };
  }
}

// === ORDER MANAGEMENT (for future phases) === //

async function loadOrders() {
  try {
    const snapshot = await db.collection('platterOrders')
      .orderBy('date')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
}

async function createOrder(orderData) {
  try {
    const docRef = await db.collection('platterOrders').add({
      ...orderData,
      orderNumber: generateOrderNumber(),
      status: 'pending_payment',
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

async function updateOrderStatus(orderId, status, additionalData = {}) {
  try {
    const updateData = {
      status,
      ...additionalData,
      updatedAt: new Date()
    };

    // Add timestamp fields based on status
    if (status === 'paid') updateData.paymentDate = new Date();
    if (status === 'kitchen_notified') updateData.kitchenNotifiedDate = new Date();
    if (status === 'acknowledged') updateData.kitchenAcknowledgedDate = new Date();
    if (status === 'prepared') updateData.preparedDate = new Date();
    if (status === 'delivered') updateData.deliveredDate = new Date();

    await db.collection('platterOrders').doc(orderId).update(updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

async function cancelOrder(orderId, cancelledBy) {
  try {
    await db.collection('platterOrders').doc(orderId).update({
      cancelled: true,
      cancelledBy,
      cancelledAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error.message };
  }
}

// === PRICING CALCULATION === //

function calculatePlatterPrice(pricingConfig, platterType, itemCount, numberOfPeople) {
  // Find matching pricing tier
  const tier = pricingConfig.find(t =>
    t.category === platterType && t.itemCount === itemCount
  );

  if (!tier) {
    return { valid: false, error: 'No pricing tier found for this selection' };
  }

  if (numberOfPeople < tier.minPeople) {
    return {
      valid: false,
      error: `Minimum ${tier.minPeople} people required`
    };
  }

  return {
    valid: true,
    pricePerPerson: tier.pricePerPerson,
    subtotal: tier.pricePerPerson * numberOfPeople,
    minPeople: tier.minPeople
  };
}

// === VALIDATION === //

function validateOrderDate(dateString) {
  const orderDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 7); // 7 days minimum notice

  if (orderDate < minDate) {
    return {
      valid: false,
      error: 'Orders require 7 days notice. Please select a later date.'
    };
  }

  return { valid: true };
}

function validatePlatterSelection(category, selectedItemIds, menuItems) {
  const categoryItems = menuItems.filter(item =>
    item.category === category && item.enabled
  );

  // Check if all selected items exist and are enabled
  for (const itemId of selectedItemIds) {
    const item = menuItems.find(m => m.id === itemId);
    if (!item || !item.enabled || item.category !== category) {
      return {
        valid: false,
        error: 'Invalid item selection'
      };
    }
  }

  return { valid: true };
}

// === EXPORT === //
// Make functions available globally
window.PlatterSystem = {
  // Menu Items
  loadMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,

  // Pricing Config
  loadPricingConfig,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,

  // Orders
  loadOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,

  // Helpers
  calculatePlatterPrice,
  validateOrderDate,
  validatePlatterSelection,
  formatDate,
  generateOrderNumber,
  showToast,
  showLoading,
  hideLoading,

  // Constants
  ADMIN_EMAIL
};
