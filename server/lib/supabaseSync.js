import { supabase } from './supabase.js';

export const supabaseSync = {
  // Sync Product Creation
  async createProduct(prodData) {
    try {
      const payload = {
        sku: prodData.sku,
        name: prodData.name_ko,
        name_ko: prodData.name_ko,
        name_en: prodData.name_en,
        description: prodData.description_ko,
        description_ko: prodData.description_ko,
        description_en: prodData.description_en,
        price: Number(prodData.price),
        sale_price: prodData.discount_price ? Number(prodData.discount_price) : null,
        category: String(prodData.category_id || '9'),
        material: prodData.material_ko || prodData.material || '',
        colors: typeof prodData.colors === 'string' ? prodData.colors : JSON.stringify(prodData.colors || []),
        sizes: typeof prodData.sizes === 'string' ? prodData.sizes : JSON.stringify(prodData.sizes || []),
        stock: Number(prodData.stock),
        images: typeof prodData.images === 'string' ? prodData.images : JSON.stringify(prodData.images || []),
        is_active: prodData.status === 'active' ? true : false,
        is_new: Boolean(prodData.is_new),
        is_sale: Boolean(prodData.is_sale),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('products').insert([payload]).select();
      if (error) console.error('Supabase product insert error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase product insert exception:', err);
    }
  },

  // Sync Product Update
  async updateProduct(id, prodData) {
    try {
      const payload = {
        sku: prodData.sku,
        name: prodData.name_ko,
        name_ko: prodData.name_ko,
        name_en: prodData.name_en,
        description: prodData.description_ko,
        description_ko: prodData.description_ko,
        description_en: prodData.description_en,
        price: Number(prodData.price),
        sale_price: prodData.discount_price ? Number(prodData.discount_price) : null,
        category: String(prodData.category_id || '9'),
        material: prodData.material_ko || prodData.material || '',
        colors: typeof prodData.colors === 'string' ? prodData.colors : JSON.stringify(prodData.colors || []),
        sizes: typeof prodData.sizes === 'string' ? prodData.sizes : JSON.stringify(prodData.sizes || []),
        stock: Number(prodData.stock),
        images: typeof prodData.images === 'string' ? prodData.images : JSON.stringify(prodData.images || []),
        is_active: prodData.status === 'active' ? true : false,
        is_new: Boolean(prodData.is_new),
        is_sale: Boolean(prodData.is_sale),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select();
      if (error) console.error('Supabase product update error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase product update exception:', err);
    }
  },

  // Sync Product Status / Stock
  async updateProductField(id, fields) {
    try {
      const { data, error } = await supabase.from('products').update(fields).eq('id', id).select();
      if (error) console.error('Supabase product field update error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase product field update exception:', err);
    }
  },

  // Sync Product Delete
  async deleteProduct(id) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error('Supabase product delete error:', error.message);
    } catch (err) {
      console.error('Supabase product delete exception:', err);
    }
  },

  // Sync Category Upsert
  async upsertCategory(catData) {
    try {
      const payload = {
        name: catData.name_ko,
        slug: catData.slug,
        is_active: catData.is_active !== undefined ? Boolean(catData.is_active) : true
      };
      const { data, error } = await supabase.from('categories').upsert([payload]).select();
      if (error) console.error('Supabase category upsert error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase category upsert exception:', err);
    }
  },

  // Sync Coupon Upsert
  async upsertCoupon(couponData) {
    try {
      const payload = {
        code: couponData.code.toUpperCase().trim(),
        discount_type: couponData.discount_type,
        discount_value: Number(couponData.discount_value),
        minimum_order_amount: Number(couponData.min_order_amount || 0),
        expiry_date: couponData.end_date || null,
        usage_limit: couponData.usage_limit ? Number(couponData.usage_limit) : 1000,
        used_count: Number(couponData.times_used || 0),
        is_active: Boolean(couponData.is_active)
      };
      const { data, error } = await supabase.from('coupons').upsert([payload], { onConflict: 'code' }).select();
      if (error) console.error('Supabase coupon upsert error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase coupon upsert exception:', err);
    }
  },

  // Sync Order Creation
  async createOrder(orderData) {
    try {
      const payload = {
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        postal_code: orderData.postal_code,
        address: orderData.address,
        detail_address: orderData.detail_address,
        subtotal: Number(orderData.subtotal),
        coupon_code: orderData.coupon_code || null,
        discount: Number(orderData.discount_amount || 0),
        shipping_fee: Number(orderData.shipping_fee || 0),
        total_amount: Number(orderData.total_amount),
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_status,
        order_status: orderData.order_status,
        items: JSON.stringify(orderData.items || []),
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('orders').insert([payload]).select();
      if (error) console.error('Supabase order insert error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase order insert exception:', err);
    }
  },

  // Sync Order Status Update
  async updateOrderStatus(orderId, orderStatus, paymentStatus) {
    try {
      const payload = {};
      if (orderStatus) payload.order_status = orderStatus;
      if (paymentStatus) payload.payment_status = paymentStatus;
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('orders').update(payload).eq('id', orderId).select();
      if (error) console.error('Supabase order status update error:', error.message);
      return data;
    } catch (err) {
      console.error('Supabase order status update exception:', err);
    }
  }
};
