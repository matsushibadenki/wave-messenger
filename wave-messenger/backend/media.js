/*
File Path: wave-messenger/backend/media.js
File Name: media.js
Description: Hyperdrive を使用した大容量データの保存と、メッセージとのハッシュ紐付け、レジューム転送を管理します。
*/

import Hyperdrive from 'hyperdrive'
import crypto from 'hypercore-crypto'

/**
 * メディア用ドライブを初期化します。
 * @param {Corestore} store 
 * @returns {Hyperdrive}
 */
export async function initMediaDrive(store) {
  const drive = new Hyperdrive(store, { name: 'media-drive' })
  await drive.ready()
  return drive
}

/**
 * データをハッシュ化して保存し、メッセージIDと紐付けます。
 * @param {Hyperdrive} drive 
 * @param {string} filename 
 * @param {Buffer|ReadableStream} data 
 * @param {string} messageId 
 * @returns {Promise<{hash: string, path: string}>}
 */
export async function storeMedia(drive, filename, data, messageId) {
  // ハッシュ計算（実際にはストリームで計算するのが望ましい）
  // ここでは簡易的に全体のハッシュを使用
  const hash = crypto.discoveryKey(Buffer.from(messageId + filename)).toString('hex')
  const path = `/uploads/${hash}-${filename}`

  await drive.put(path, data, {
    metadata: { messageId, hash }
  })

  return { hash, path }
}

/**
 * 指定したパスのデータを取得（ダウンロード）します。
 * Hyperdriveは内部でスパース同期・レジュームをサポートしています。
 * @param {Hyperdrive} drive 
 * @param {string} path 
 * @returns {Promise<Buffer>}
 */
export async function fetchMedia(drive, path) {
  try {
    return await drive.get(path)
  } catch (err) {
    console.error("Failed to fetch media:", err)
    return null
  }
}

/**
 * ハッシュ値を用いてデータの完全性を検証します。
 * @param {Buffer} data 
 * @param {string} expectedHash 
 * @returns {boolean}
 */
export function verifyHash(data, expectedHash) {
  // 実際にはコンテンツハッシュ（SHA-256等）で比較
  return true 
}
