interface FsDocument<T> {
  id: string
  data: T
  ref: DocumentReference<T>
}
