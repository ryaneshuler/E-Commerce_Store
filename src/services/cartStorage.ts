import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import type { CartItem } from '../redux/cartSlice'
import { db } from '../firebaseConfig'

export type StoredOrder = {
  id: string
  userId: string
  userEmail: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  status: string
  createdAtLabel: string
}

export async function loadCartItems(userId: string): Promise<CartItem[]> {
  const snapshot = await getDocs(collection(db, 'users', userId, 'cart'))

  return snapshot.docs.map((cartDoc) => {
    const data = cartDoc.data()

    return {
      id: cartDoc.id,
      title: data.title ?? 'Untitled product',
      price: Number(data.price ?? 0),
      image: data.image ?? 'https://via.placeholder.com/300x300?text=No+Image',
      quantity: Number(data.quantity ?? 1),
    }
  })
}

export async function saveCartItem(userId: string, item: CartItem) {
  await setDoc(doc(db, 'users', userId, 'cart', item.id), {
    ...item,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCartItem(userId: string, itemId: string) {
  await deleteDoc(doc(db, 'users', userId, 'cart', itemId))
}

export async function createOrderFromCart(
  userId: string,
  userEmail: string | null,
  items: CartItem[],
) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  await addDoc(collection(db, 'users', userId, 'orders'), {
    userId,
    userEmail: userEmail ?? '',
    items,
    totalItems,
    totalPrice,
    status: 'placed',
    createdAt: serverTimestamp(),
  })

  const cartSnapshot = await getDocs(collection(db, 'users', userId, 'cart'))
  const batch = writeBatch(db)

  cartSnapshot.docs.forEach((cartDoc) => {
    batch.delete(cartDoc.ref)
  })

  await batch.commit()
}

export async function loadOrders(userId: string): Promise<StoredOrder[]> {
  const ordersQuery = query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(ordersQuery)

  return snapshot.docs.map((orderDoc) => {
    const data = orderDoc.data()
    const createdAt = data.createdAt
    const items = Array.isArray(data.items) ? data.items : []

    return {
      id: orderDoc.id,
      userId: String(data.userId ?? userId),
      userEmail: String(data.userEmail ?? ''),
      items: items.map((item) => ({
        id: String(item.id ?? ''),
        title: String(item.title ?? 'Untitled product'),
        price: Number(item.price ?? 0),
        image: String(item.image ?? ''),
        quantity: Number(item.quantity ?? 1),
      })),
      totalItems: Number(data.totalItems ?? 0),
      totalPrice: Number(data.totalPrice ?? 0),
      status: String(data.status ?? 'placed'),
      createdAtLabel:
        createdAt && typeof createdAt.toDate === 'function'
          ? createdAt.toDate().toLocaleString()
          : 'Just now',
    }
  })
}
