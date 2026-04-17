/*
File Path: wave-messenger/index.js
File Name: index.js
Description: Pear Runtime v2 (Bare) のメインエントリーポイント。
P2Pバックエンド（Corestore, Hyperswarm, Hyperbee）を管理し、ブリッジ経由でGUIに機能を提供します。
*/

import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'
import Corestore from 'corestore'
import path from 'bare-path'

// バックエンドモジュールのインポート
import { getOrGenerateKeys, encodePublicKey } from './backend/keys.js'
import { initContactDB, getAllContacts, upsertContact } from './backend/contacts.js'
import { startSwarm } from './backend/swarm.js'
import { createChatSession, sendMessage, getMessages } from './backend/chat.js'
import { initMediaDrive, storeMedia, fetchMedia } from './backend/media.js'

async function init() {
  console.log("Wave Messenger: Initializing P2P Backend...")

  // 1. ストレージとCorestoreの初期化
  const storagePath = Pear.config.storage
  const store = new Corestore(storagePath)

  // 2. アイデンティティ（キーペア）の取得
  const { publicKey, secretKey } = await getOrGenerateKeys()
  const pubKeyHex = encodePublicKey(publicKey)
  console.log("My User ID:", pubKeyHex)

  // 3. 各種データベース・ドライブの初期化
  const contactDB = await initContactDB(store)
  const mediaDrive = await initMediaDrive(store)

  // 4. ネットワーク（Swarm）の開始
  const swarm = await startSwarm(store, publicKey) 

  // ブリッジの設定
  const bridge = new Bridge()
  await bridge.ready()

  // --- RPC ハンドラーのセットアップ ---

  const runtime = new Runtime()
  const pipe = await runtime.start({ bridge })

  pipe.on('data', async (data) => {
    try {
      const { id, method, params } = JSON.parse(data.toString())
      let result = null

      switch (method) {
        case 'get-profile':
          result = {
            publicKey: pubKeyHex,
            name: Buffer.isBuffer(publicKey) ? pubKeyHex : publicKey
          }
          break
        
        case 'get-contacts':
          result = await getAllContacts(contactDB)
          break
        
        case 'add-contact':
          await upsertContact(contactDB, params.publicKey, { name: params.name })
          swarm.join(Buffer.from(params.publicKey, 'hex'))
          result = { success: true }
          break
        
        case 'chat-action': {
          const { action, targetKey, payload } = params
          const targetPubKey = Buffer.from(targetKey, 'hex')
          const { base, view } = await createChatSession(store, publicKey, [targetPubKey])
          if (action === 'send') {
            await sendMessage(base, { ...payload, self: true })
            result = { success: true }
          } else {
            result = await getMessages(view)
          }
          break
        }

        case 'media-action': {
          const { action, filename, data: mediaData, messageId, path: mediaPath } = params
          if (action === 'upload') {
            result = await storeMedia(mediaDrive, filename, mediaData, messageId)
          } else {
            result = await fetchMedia(mediaDrive, mediaPath)
          }
          break
        }
        
        default:
          console.warn("Unknown RPC method:", method)
      }

      pipe.write(JSON.stringify({ id, result }))
    } catch (err) {
      console.error("RPC Error:", err)
    }
  })

  pipe.on('close', () => {
    console.log("GUI process closed. Exiting...")
    Pear.exit()
  })

  // Pearの終了処理
  Pear.teardown(async () => {
    console.log("Shutting down P2P nodes...")
    await swarm.destroy()
    await store.close()
    await bridge.close()
  })
}

init().catch(err => {
  console.error("Critical error during Pear v2 initialization:", err)
  Pear.exit(1)
})
