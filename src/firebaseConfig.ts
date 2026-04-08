import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCeTcHcTeLg_HpX5evletVytA_8Z_BMrtE',
  authDomain: 'e-commerce-store-52651.firebaseapp.com',
  projectId: 'e-commerce-store-52651',
  storageBucket: 'e-commerce-store-52651.appspot.com',
  messagingSenderId: '209664575348',
  appId: '1:209664575348:web:641bf78b731ea5d0b74e21',
}

export const isFirebaseConfigured = true

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app