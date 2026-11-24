import { createClient } from '@supabase/supabase-js';
import type { Order } from '../types/order';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ejfsgrjzuqmhhfsrpkkm.supabase.co';

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_X1Bl66-1ML790ROP-f8FrQ_XiMhToEv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const DEFAULT_APP_NAME = 'COD Desk';
const APP_NAME_STORAGE_KEY = 'cod_admin_app_name';

export function getSavedAppName(): string {
  try {
    const stored = localStorage.getItem(APP_NAME_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // Ignore storage access errors
  }
  return DEFAULT_APP_NAME;
}

export function saveAppNameLocally(name: string): string {
  const cleaned = name.trim() || DEFAULT_APP_NAME;
  try {
    localStorage.setItem(APP_NAME_STORAGE_KEY, cleaned);
  } catch {
    // Ignore storage access errors
  }
  return cleaned;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load orders from Supabase.');
  }

  return (data ?? []) as Order[];
}

export async function updateOrderStatusInDb(
  order: Order,
  nextStatus: string
): Promise<Order> {
  let matchColumn: string;
  let matchValue: string | number;

  if (order.id !== undefined && order.id !== null) {
    matchColumn = 'id';
    matchValue = order.id;
  } else if (order.order_id !== undefined && order.order_id !== null) {
    matchColumn = 'order_id';
    matchValue = order.order_id;
  } else {
    matchColumn = 'created_at';
    matchValue = order.created_at;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq(matchColumn, matchValue)
    .select();

  if (error) {
    throw new Error(error.message || 'Failed to update order status.');
  }

  if (!data || data.length === 0) {
    throw new Error(
      'Order status could not be updated. Check Supabase permissions or row identifier.'
    );
  }

  return data[0] as Order;
}
