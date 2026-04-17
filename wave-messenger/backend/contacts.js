/*
File Path: wave-messenger/backend/contacts.js
File Name: contacts.js
Description: Hyperbee を使用して、ピアの連絡先情報（名前、公開鍵、アイコン等）を保存・管理します。
*/

import Hyperbee from 'hyperbee'

/**
 * 連絡先DBを初期化します。
 * @param {Corestore} store 
 * @returns {Hyperbee}
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
  await db.put(key, {
    ...profile,
    publicKey, // 検索時に便利なように公開鍵も含める
    addedAt: Date.now(),
    updatedAt: Date.now()
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
  return contacts
}

/**
 * 個別の連絡先を取得します。
 * @param {Hyperbee} db 
 * @param {string} publicKey 
 */
export async function getContact(db, publicKey) {
  const node = await db.get(`contact:${publicKey}`)
  return node ? node.value : null
}
