/*
File Path: wave-messenger/index.js
File Name: index.js
Description: Pear Runtime v2 (Bare) のメインエントリーポイント。
P2Pバックエンド（Corestore, Hyperswarm, Hyperbee）を管理し、ブリッジ経由でGUIに機能を提供します。
*/

import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'
import Corestore from 'corestore'
import Stream from 'bare-stream'
const { Readable } = Stream

import { getOrGenerateKeys, encodePublicKey } from './backend/keys.js'
import { initContactDB, getAllContacts, upsertContact, resetUnread } from './backend/contacts.js'
import { startSwarm } from './backend/swarm.js'
import { createChatSession, sendMessage, getMessages } from './backend/chat.js'
import { initMediaDrive, storeMedia, fetchMedia } from './backend/media.js'
import { startCallSession, pushSignal, updateCallState, getCallSession, endCallSession } from './backend/call.js'
import { sendPushSignal } from './backend/push.js'

async function init() {
  console.log('Wave Messenger: Initializing P2P Backend...')

  const storagePath = Pear.config.storage
  const store = new Corestore(storagePath)

  const { publicKey } = await getOrGenerateKeys()
  const pubKeyHex = encodePublicKey(publicKey)
  console.log('My User ID:', pubKeyHex)

  const contactDB = await initContactDB(store)
  const mediaDrive = await initMediaDrive(store)
  const swarm = await startSwarm(store, publicKey)

  const sessionCache = new Map()

  async function getSessionByTarget(targetKeyHex) {
    if (sessionCache.has(targetKeyHex)) return sessionCache.get(targetKeyHex)

    const targetPubKey = Buffer.from(targetKeyHex, 'hex')
    const session = await createChatSession(store, publicKey, [targetPubKey])
    sessionCache.set(targetKeyHex, session)
    return session
  }

  async function listRooms() {
    const contacts = await getAllContacts(contactDB)
    const rooms = []

    for (const contact of contacts) {
      const session = await getSessionByTarget(contact.publicKey)
      const messages = await getMessages(session.view, pubKeyHex)
      const lastMessage = messages[messages.length - 1] || null

      rooms.push({
        roomId: session.roomId,
        contact,
        lastMessage,
        unreadCount: contact.unreadCount || 0,
        updatedAt: lastMessage?.timestamp || contact.updatedAt || contact.addedAt || 0
      })
    }

    return rooms.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }


  // RPCハンドラー関数
  async function handleRPC(data, responder) {
    let id = null
    try {
      // データの正規化（String, Buffer, Object のいずれにも対応）
      let raw = data
      if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
        if (typeof data === 'object') raw = JSON.stringify(data)
        else raw = String(data)
      }
      const str = raw.toString()
      console.log('Main Process: Received request:', str.slice(0, 200))

      const incoming = JSON.parse(str)
      id = incoming.id
      const { method, params = {} } = incoming
      let result = null

      switch (method) {
        case 'get-profile':
          result = { publicKey: pubKeyHex, name: '' }
          break

        case 'get-contacts':
          result = await getAllContacts(contactDB)
          break

        case 'add-contact':
          await upsertContact(contactDB, params.publicKey, { name: params.name })
          await swarm.join(Buffer.from(params.publicKey, 'hex')).flushed()
          result = { success: true }
          break

        case 'get-rooms':
          result = await listRooms()
          break

        case 'chat-action': {
          const { action, targetKey, payload } = params
          const session = await getSessionByTarget(targetKey)
          if (action === 'send') {
            await sendMessage(session.base, session.view, payload || {}, pubKeyHex, session.roomId)
            await upsertContact(contactDB, targetKey, { updatedAt: Date.now() })
            result = { success: true, roomId: session.roomId }
          } else if (action === 'mark-read') {
            await resetUnread(contactDB, targetKey)
            result = { success: true }
          } else {
            result = await getMessages(session.view, pubKeyHex)
          }
          break
        }

        case 'media-action': {
          const { action, filename, data: mediaData, messageId, path: mediaPath } = params
          if (action === 'upload') {
            // Buffer から Stream へ変換して保存（GBクラス対応の土台）
            const stream = Readable.from(mediaData)
            result = await storeMedia(mediaDrive, filename, stream, messageId)
            console.log('Main Process: Media stored with hash:', result.hash)
          } else {
            result = await fetchMedia(mediaDrive, mediaPath)
          }
          break
        }

        case 'call-action': {
          const { action, targetPublicKey, sessionId, signal, state, media } = params
          if (action === 'start') result = startCallSession(pubKeyHex, targetPublicKey, media || 'video')
          else if (action === 'signal') result = pushSignal(sessionId, signal, pubKeyHex)
          else if (action === 'state') result = updateCallState(sessionId, state)
          else if (action === 'get') result = getCallSession(sessionId)
          else if (action === 'end') result = endCallSession(sessionId)
          else result = { success: false, reason: 'Unknown call action' }
          break
        }

        default:
          result = { success: false, reason: `Unknown RPC method: ${method}` }
          break
      }

      console.log(`Main Process: Sending response for ID ${id}: ${method}`)
      const response = JSON.stringify({ id, result })
      responder(response)
    } catch (err) {
      console.error('RPC Error:', err)
      if (id) responder(JSON.stringify({ id, error: err.message }))
    }
  }

  const bridge = new Bridge()
  await bridge.ready()

  const runtime = new Runtime()
  const pipe = await runtime.start({ bridge })

  // 1. Pipe (Stream-based) 経由のリクエスト待機
  pipe.on('data', (data) => {
    handleRPC(data, (resp) => pipe.write(resp))
  })

  // 2. Pear.messages (IPC-based) 経由のリクエスト待機
  if (typeof Pear !== 'undefined' && typeof Pear.messages === 'function') {
    console.log('Main Process: Pear.messages listener initialized');
    Pear.messages((data) => {
      // データの正規化
      let msg = data;
      if (typeof data !== 'object') {
        try { msg = JSON.parse(data.toString()); } catch { return; }
      }

      // 重要: 自分が送信したレスポンス（result/errorを持つ）のエコーを無視する
      if (msg.result !== undefined || msg.error !== undefined) return;

      console.log('Main Process: Received Pear message:', msg.method || 'unknown');
      handleRPC(msg, (resp) => {
        if (typeof Pear.message === 'function') {
          console.log('Main Process: Sending Pear message response for ID:', msg.id);
          // 文字列ではなくオブジェクトを送信（レンダラーの親切な設計に合わせる）
          try {
            Pear.message(JSON.parse(resp));
          } catch {
            Pear.message({ id: msg.id, error: 'Serialization error' });
          }
        }
      })
    })
  }

  pipe.on('close', () => {
    console.log('GUI process closed. Exiting...')
    Pear.exit()
  })

  Pear.teardown(async () => {
    console.log('Shutting down P2P nodes...')
    await swarm.destroy()
    await store.close()
    await bridge.close()
  })
}

init().catch((err) => {
  console.error('Critical error during Pear v2 initialization:', err)
  Pear.exit(1)
})
