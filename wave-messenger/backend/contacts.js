/*
File Path: wave-messenger/backend/contacts.js
File Name: contacts.js
Description: Hyperbee を使用して、ピアの連絡先情報（名前、公開鍵、アイコン等）を保存・管理します。
*/

import Hyperbee from 'hyperbee'

/**
 * 連絡先DBを初期化します。
 * @param {Hypercore} core - 連絡先を保存するためのHypercore
 * @returns {Hyperbee}
 */
export function initContactDB(core) {
  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
  return db
}

/**
 * 連絡先を追加または更新します。
 * @param {Hyperbee} db 
 * @param {string} publicKey - ピアの公開鍵(hex)
 * @param {object} profile - プロフィール情報 { name, avatarUrl, addedAt }
 */
export async function upsertContact(db, publicKey, profile) {
  const key = `contact:${publicKey}`
  await db.put(key, {
    ...profile,
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
  for await (const { key, value } of db.createReadStream({ gt: 'contact:', lt: 'contact:\uffff' })) {
    contacts.push({ publicKey: key.split(':')[1], ...value })
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
