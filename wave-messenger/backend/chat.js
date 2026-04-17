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
 * @param {Buffer} localSecret - 自分の秘密鍵（署名用）
 * @param {Array<Buffer>} participants - 参加者の公開鍵リスト
 * @returns {Autobase}
 */
export async function createChatSession(store, localSecret, participants) {
  const localCore = store.get({ name: 'my-chat-log' })
  await localCore.ready()

  const base = new Autobase(localCore, {
    /* Autobaseの構成: 参加者のコアを追加 */
  })

  for (const pubKey of participants) {
    const remoteCore = store.get({ key: pubKey })
    await base.addInput(remoteCore)
  }

  return base
}

/**
 * メッセージを送信します。
 * @param {Autobase} base 
 * @param {string} text 
 */
export async function sendMessage(base, text) {
  await base.append({
    type: 'text',
    text,
    timestamp: Date.now()
  })
}

/**
 * メッセージ履歴を時系列順に取得します。
 * @param {Autobase} base 
 * @returns {AsyncIterable}
 */
export async function createMessageStream(base) {
  return base.createCausalStream()
}
