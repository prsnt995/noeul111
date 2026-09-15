import {
  db,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp
} from '../config/firebase.js';

/**
 * Saves a new order to Firestore under `orders/{order_number}`
 * Ensures `userId: currentUser.uid` is stored for exact security rule match.
 */
export async function saveOrderToFirestore(orderData, user) {
  if (!orderData || !orderData.order_number) {
    throw new Error('Order number is required to save to Firestore.');
  }

  const userId = user?.uid || user?.id || 'guest';
  const orderDocRef = doc(db, 'orders', orderData.order_number);

  const payload = {
    order_number: orderData.order_number,
    userId: userId,
    user_id: userId,
    customer_name: orderData.customer_name || '',
    customer_email: orderData.customer_email || '',
    customer_phone: orderData.customer_phone || '',
    postal_code: orderData.postal_code || '',
    address: orderData.address || '',
    detail_address: orderData.detail_address || '',
    shipping_memo: orderData.shipping_memo || '',
    subtotal: orderData.subtotal || 0,
    discount_amount: orderData.discount_amount || 0,
    coupon_code: orderData.coupon_code || null,
    shipping_fee: orderData.shipping_fee || 0,
    total_amount: orderData.total_amount || 0,
    payment_method: orderData.payment_method || 'bank_transfer',
    payment_status: orderData.payment_status || 'pending_payment',
    order_status: orderData.order_status || 'pending',
    payment_sender_name: orderData.payment_sender_name || orderData.customer_name || '',
    payment_receipt_url: orderData.payment_receipt_url || null,
    courier_name: orderData.courier_name || null,
    tracking_number: orderData.tracking_number || null,
    items: (orderData.items || []).map(item => ({
      product_id: item.product_id || item.id,
      product_name_ko: item.product_name_ko || item.name_ko || item.name || '',
      product_name_en: item.product_name_en || item.name_en || item.name || '',
      image_url: item.image_url || (item.images && item.images[0]) || '',
      price: item.price || item.unit_price || 0,
      quantity: item.quantity || 1,
      size: item.size || 'FREE',
      color: item.color || item.color_ko || 'DEFAULT'
    })),
    created_at: orderData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: serverTimestamp()
  };

  try {
    const setPromise = setDoc(orderDocRef, payload);
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 2000)
    );
    await Promise.race([setPromise, timeoutPromise]);
    return payload;
  } catch (error) {
    console.warn('Firestore order save warning (network or permissions):', error);
    return payload;
  }
}

/**
 * Real-time subscription to a user's orders in Firestore
 * @param {string} firebaseUid
 * @param {function} onOrdersUpdate Callback receiving array of order objects
 * @returns {function} Unsubscribe function
 */
export function subscribeUserOrders(firebaseUid, onOrdersUpdate) {
  if (!firebaseUid) {
    onOrdersUpdate([]);
    return () => {};
  }

  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', firebaseUid));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const ordersList = [];
      snapshot.forEach((docSnap) => {
        ordersList.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort by created_at descending
      ordersList.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt?.toDate() || 0);
        const dateB = new Date(b.created_at || b.createdAt?.toDate() || 0);
        return dateB - dateA;
      });

      onOrdersUpdate(ordersList);
    },
    (error) => {
      console.warn('Firestore orders real-time subscription error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Updates status fields of an order document in Firestore by order_number
 */
export async function updateFirestoreOrderStatus(orderNumber, statusUpdates) {
  if (!orderNumber) return;
  const orderDocRef = doc(db, 'orders', orderNumber);

  try {
    const updatePromise = updateDoc(orderDocRef, {
      ...statusUpdates,
      updated_at: new Date().toISOString()
    });
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 2000)
    );
    await Promise.race([updatePromise, timeoutPromise]);
  } catch (err) {
    console.warn(`Firestore update for order ${orderNumber} warning:`, err);
  }
}
