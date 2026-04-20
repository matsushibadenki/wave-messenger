/*
File Path: wave-messenger/backend/chat.js
File Name: chat.js
Description: Hypercore/Autobase を利用したメッセージの送受信と履歴管理を行います。
各ユーザーの発言ログを統合してチャットルームを構成します。
*/

import Autobase from 'autobase'
import crypto from 'hypercore-crypto'

/**
 * 参加者公開鍵から一意のルームIDを生成します。
 * @param {string[]} participantKeys
 * @returns {string}
 */
export function createRoomId(participantKeys) {
  const normalized = [...participantKeys].map((key) => key.toLowerCase()).sort()
  const seed = Buffer.from(normalized.join(':'))
  return crypto.discoveryKey(seed).toString('hex')
}

/**
 * チャットセッション（Autobase）を構成します。
 * @param {Corestore} store - Corestoreインスタンス
 * @param {Buffer} localKey - 自分の公開鍵
 * @param {Array<Buffer>} participants - 参加者の公開鍵リスト
 * @returns {Promise<{ base: Autobase, view: any, roomId: string }>}
 */
export async function createChatSession(store, localKey, participants) {
  const localKeyHex = localKey.toString('hex')
  const participantHex = participants.map((pubKey) => pubKey.toString('hex'))
  const roomId = createRoomId([localKeyHex, ...participantHex])

  const localCore = store.get({ name: `chat-room-${roomId}` })
  await localCore.ready()

  const base = new Autobase(localCore)

  // NOTE:
  // 本来は各参加者の writer key を共有して addInput する必要があるが、
  // 現段階では participant 公開鍵をもとに入力コアを解決する簡易実装とする。
  for (const pubKey of participants) {
    if (pubKey.equals(localKey)) continue
    const remoteCore = store.get({ key: pubKey })
    await remoteCore.ready()
    await base.addInput(remoteCore)
  }

  const view = base.view({
    apply (batch, view) {
      for (const node of batch) {
        if (node.value) view.append(node.value)
      }
    }
  })

  await view.ready()
  return { base, view, roomId }
}

function createMessageId(roomId) {
  return `${roomId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * メッセージレコードのハッシュを計算します。
 * @param {object} record 
 * @returns {string}
 */
export function calculateMessageHash(record) {
  const { senderPublicKey, timestamp, text, fileHash, prevHash, type } = record
  // 決定論的なJSON文字列化（簡易版）
  const payload = JSON.stringify({ senderPublicKey, timestamp, text, fileHash, prevHash, type })
  return crypto.data(Buffer.from(payload)).toString('hex')
}


/**
 * メッセージを送信します。
 * @param {Autobase} base
 * @param {any} view - メッセージ確認用のビュー
 * @param {object} message { type, text, fileHash, ... }
 * @param {string} senderPublicKey
 * @param {string} roomId
 */
export async function sendMessage(base, view, message, senderPublicKey, roomId) {
  // 直前のメッセージのハッシュを取得してチェーンを形成
  let prevHash = null
  const len = view.length
  if (len > 0) {
    const lastMsg = await view.get(len - 1)
    if (lastMsg) prevHash = lastMsg.hash
  }

  const record = {
    type: message.type || 'text',
    text: message.text || '',
    fileHash: message.fileHash || null,
    messageId: message.messageId || createMessageId(roomId),
    senderPublicKey,
    timestamp: message.timestamp || Date.now(),
    prevHash
  }

  // 自身のハッシュを計算
  const hash = calculateMessageHash(record)
  
  await base.append({
    ...record,
    hash
  })
}

/**
 * メッセージ履歴を取得します。
 * @param {any} view
 * @param {string} localPublicKey
 * @returns {Promise<Array>}
 */
export async function getMessages(view, localPublicKey) {
  const messages = []
  const len = view.length

  for (let i = 0; i < len; i++) {
    const msg = await view.get(i)
    if (!msg) continue

    messages.push({
      ...msg,
      self: msg.senderPublicKey === localPublicKey
    })
  }

  return messages
}
