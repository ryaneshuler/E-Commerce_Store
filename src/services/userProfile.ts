import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export type UserProfile = {
  email: string
  name: string
  address: string
  createdAt: string
  updatedAt: string
}

type UserProfileInput = {
  email: string
  name?: string
  address?: string
}

export async function createUserProfileDocument(userId: string, profile: UserProfileInput) {
  const now = new Date().toISOString()

  await setDoc(doc(db, 'users', userId), {
    email: profile.email,
    name: profile.name?.trim() ?? '',
    address: profile.address?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  })
}

export async function getUserProfileDocument(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export async function updateUserProfileDocument(
  userId: string,
  profile: Partial<Pick<UserProfile, 'name' | 'address' | 'email'>>,
) {
  await setDoc(
    doc(db, 'users', userId),
    {
      ...profile,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

async function deleteUserSubcollection(userId: string, subcollectionName: string) {
  const snapshot = await getDocs(collection(db, 'users', userId, subcollectionName))

  if (snapshot.empty) {
    return
  }

  const batch = writeBatch(db)

  snapshot.docs.forEach((documentSnapshot) => {
    batch.delete(documentSnapshot.ref)
  })

  await batch.commit()
}

export async function deleteUserProfileDocument(userId: string) {
  await Promise.all([
    deleteUserSubcollection(userId, 'cart'),
    deleteUserSubcollection(userId, 'orders'),
  ])

  await deleteDoc(doc(db, 'users', userId))
}
