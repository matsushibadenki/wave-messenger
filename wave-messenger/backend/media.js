/*
File Path: wave-messenger/backend/media.js
File Name: media.js
Description: Hyperdrive を使用した大容量データの保存と、メッセージとのハッシュ紐付け、レジューム転送を管理します。
*/

import Hyperdrive from 'hyperdrive'
import crypto from 'hypercore-crypto'
import { createHash } from 'bare-crypto'
import Stream from 'bare-stream'
const { pipeline } = Stream.promises || Stream

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
 * ストリームからデータをハッシュ化して保存し、メッセージIDと紐付けます。
 * @param {Hyperdrive} drive 
 * @param {string} filename 
 * @param {ReadableStream} inputStream 
 * @param {string} messageId 
 * @returns {Promise<{hash: string, path: string}>}
 */
export async function storeMedia(drive, filename, inputStream, messageId) {
  // コンテンツハッシュを計算するためのパス
  const tempHash = createHash('sha256')
  
  const randomId = crypto.randomBytes(16).toString('hex')
  const tempPath = `/uploads/tmp-${randomId}-${filename}`

  try {
    const outStream = drive.createWriteStream(tempPath, {
      metadata: {
        messageId,
        originalName: filename,
        contentType: getContentType(filename),
        timestamp: Date.now()
      }
    })

    // 読み込みながらハッシュ計算と書き込みを並行
    await pipeline(
      inputStream,
      async function * (source) {
        for await (const chunk of source) {
          tempHash.update(chunk)
          yield chunk
        }
      },
      outStream
    )

    const finalHash = tempHash.digest('hex')
    return { hash: finalHash, path: tempPath, originalName: filename }
  } catch (err) {
    console.error('Failed to store media stream:', err)
    throw err
  }
}

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }
  return types[ext] || 'application/octet-stream'
}

/**
 * 指定したパスのデータを取得（ダウンロード）します。
 * Hyperdriveは内部でスパース同期・レジュームをサポートしています。
 * @param {Hyperdrive} drive 
 * @param {string} path 
 * @returns {ReadableStream}
 */
export function fetchMediaStream(drive, path) {
  return drive.createReadStream(path)
}

/**
 * データを一括で取得します（小サイズファイル用）。
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
 * @param {Buffer|ReadableStream} data 
 * @param {string} expectedHash 
 * @returns {Promise<boolean>}
 */
export async function verifyHash(data, expectedHash) {
  const hash = createHash('sha256')
  if (Buffer.isBuffer(data)) {
    hash.update(data)
    return hash.digest('hex') === expectedHash
  } else {
    // ストリームの場合
    for await (const chunk of data) {
      hash.update(chunk)
    }
    return hash.digest('hex') === expectedHash
  }
}
