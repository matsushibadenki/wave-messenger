/*
File Path: wave-messenger/backend/contacts.js
File Name: contacts.js
Description: Hyperbee を使用して、ピアの連絡先情報（名前、公開鍵、アイコン等）を保存・管理します。
*/

import Hyperbee from 'hyperbee'

/**
 * 連絡先DBを初期化します。
 * @param {Corestore} store
 * @returns {Promise<Hyperbee>}
 */
export async function initContactDB(store) {
  const core = store.get({ name: 'contacts-db' })
  await core.ready()

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })

  await db.ready()
  return db
}

/**
 * 連絡先を追加または更新します。
 * @param {Hyperbee} db
 * @param {string} publicKey - ピアの公開鍵(hex)
 * @param {object} profile - プロフィール情報 { name, avatarUrl }
 */
export async function upsertContact(db, publicKey, profile) {
  const key = `contact:${publicKey}`
  const prev = await getContact(db, publicKey)
  const now = Date.now()

  await db.put(key, {
    ...prev,
    ...profile,
    publicKey,
    unreadCount: prev?.unreadCount || 0,
    addedAt: prev?.addedAt || now,
    updatedAt: now
  })
}

/**
 * 全連絡先を取得します。
 * @param {Hyperbee} db
 * @returns {Promise<Array>}
 */
export async function getAllContacts(db) {
  const contacts = []
  const stream = db.createReadStream({ gt: 'contact:', lt: 'contact:\uffff' })
  for await (const { value } of stream) {
    contacts.push(value)
  }
  return contacts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

/**
 * 個別の連絡先を取得します。
 * @param {Hyperbee} db
 * @param {string} publicKey
 * @returns {Promise<object|null>}
 */
export async function getContact(db, publicKey) {
  const node = await db.get(`contact:${publicKey}`)
  return node ? node.value : null
}

/**
 * 未読件数を加算します。
 * @param {Hyperbee} db
 * @param {string} publicKey
 * @param {number} count
 */
export async function incrementUnread(db, publicKey, count = 1) {
  const current = await getContact(db, publicKey)
  if (!current) return

  await upsertContact(db, publicKey, {
    ...current,
    unreadCount: Math.max(0, (current.unreadCount || 0) + count)
  })
}

/**
 * 未読件数をリセットします。
 * @param {Hyperbee} db
 * @param {string} publicKey
 */
export async function resetUnread(db, publicKey) {
  const current = await getContact(db, publicKey)
  if (!current) return

  await upsertContact(db, publicKey, {
    ...current,
    unreadCount: 0
  })
}
