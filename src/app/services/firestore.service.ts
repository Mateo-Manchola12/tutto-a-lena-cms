import { inject, Injectable } from '@angular/core'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import { collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore'
import { FirebaseApp } from '../providers/firebase.provider'

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private _app = inject(FirebaseApp)
  private _db = getFirestore(this._app)

  private col<T>(name: string) {
    return collection(this._db, name) as CollectionReference<T>
  }

  async getDocuments<T>(collectionName: string): Promise<T[]> {
    const snap = await getDocs(this.col<T>(collectionName))
    return snap.docs.map((doc) => doc.data())
  }

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const ref = doc(this._db, collectionName, docId)
    const snap = await getDoc(ref)

    if (!snap.exists()) return null

    return snap.data() as T
  }

  async updateDocument<T>(collectionName: string, docId: string, updatedData: Partial<T>) {
    const ref = doc(this._db, collectionName, docId)

    try {
      await updateDoc(ref, updatedData)
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  async setDocument(collectionName: string, docId: string, data: unknown) {
    const ref = doc(this._db, collectionName, docId)

    try {
      await setDoc(ref, data as DocumentData)
    } catch (error) {
      console.error('Error setting document:', error)
      throw error
    }
  }
}
