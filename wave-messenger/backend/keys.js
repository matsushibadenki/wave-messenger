/*
File Path: wave-messenger/backend/keys.js
File Name: keys.js
Description: アプリケーションのIDとなるEd25519キーペアの生成と管理を行います。
秘密鍵はローカルに保存され、公開鍵がユーザーIDとして公開されます。
*/

import crypto from 'hypercore-crypto'
import fs from 'bare-fs'
import path from 'bare-path'

const KEY_FILE = path.join(Pear.config.storage, 'identity.key')

/**
 * ユーザーのキーペアを読み込む、または新規生成します。
 * @returns {Promise<{publicKey: Buffer, secretKey: Buffer}>}
 */
export async function getOrGenerateKeys() {
  try {
    if (fs.existsSync(KEY_FILE)) {
      const data = fs.readFileSync(KEY_FILE)
      if (data.length === 64) {
        return {
          publicKey: data.slice(0, 32),
          secretKey: data.slice(32)
        }
      }
    }
  } catch (err) {
    console.error('Failed to read key file, generating new one:', err)
  }

  // 新規生成
  const { publicKey, secretKey } = crypto.keyPair()
  const data = Buffer.concat([publicKey, secretKey])
  
  try {
    // ディレクトリ作成（念のため）
    const dir = path.dirname(KEY_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(KEY_FILE, data)
  } catch (err) {
    console.error('Failed to save key file:', err)
  }

  return { publicKey, secretKey }
}

/**
 * 公開鍵を z32 エンコードされた文字列として取得します（ユーザーID）。
 * @param {Buffer} publicKey 
 * @returns {string} 
 */
export function encodePublicKey(publicKey) {
  // z32エンコードはHypercore等の識別子で一般的（z32ライブラリが必要な場合はBuffer.toString('hex')等で代用可）
  return publicKey.toString('hex')
}
