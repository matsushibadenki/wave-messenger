/*
File Path: wave-messenger/backend/chat.js
File Name: chat.js
Description: Hypercore/Autobase を利用したメッセージの送受信と履歴管理を行います。
各ユーザーの発言ログを統合してチャットルームを構成します。
*/

import Autobase from 'autobase'

/**
 * チャットセッション（Autobase）を構成します。
 * @param {Corestore} store - Corestoreインスタンス
 * @param {Buffer} localKey - 自分の公開鍵
 * @param {Array<Buffer>} participants - 参加者の公開鍵リスト
 * @returns {Autobase}
 */
export async function createChatSession(store, localKey, participants) {
  const localCore = store.get({ name: 'my-chat-log' })
  await localCore.ready()

  // 自分自身と参加者の全ての入力を管理
  const base = new Autobase(localCore)
  
  // 参加者の入力を追加
  for (const pubKey of participants) {
    if (pubKey.equals(localKey)) continue
    const remoteCore = store.get({ key: pubKey })
    await base.addInput(remoteCore)
  }

  // インデックス（ビュー）の定義
  // Autobase 6.x 系では簡約化されたビューモデルを使用可能
  const view = base.view({
    apply (batch, view, base) {
      for (const node of batch) {
        if (node.value) {
          view.append(node.value)
        }
      }
    }
  })

  await view.ready()
  return { base, view }
}

/**
 * メッセージを送信します。
 * @param {Autobase} base 
 * @param {object} message { type, text, fileHash, ... }
 */
export async function sendMessage(base, message) {
  await base.append({
    ...message,
    timestamp: Date.now()
  })
}

/**
 * メッセージ履歴を取得します。
 * @param {AutobaseView} view 
 * @returns {Promise<Array>}
 */
export async function getMessages(view) {
  const messages = []
  const len = view.length
  for (let i = 0; i < len; i++) {
    const msg = await view.get(i)
    messages.push(msg)
  }
  return messages
}
