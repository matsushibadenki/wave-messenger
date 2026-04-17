/*
File Path: wave-messenger/backend/swarm.js
File Name: swarm.js
Description: Hyperswarm を使用したピア同士の発見および接続を管理します。
*/

import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'

/**
 * ネットワークへの接続（Swarmer）を開始します。
 * @param {Corestore} store 
 * @param {Buffer} topicKey - 接続用の共通トピック（またはユーザー公開鍵）
 * @returns {Hyperswarm}
 */
export async function startSwarm(store, topicKey) {
  const swarm = new Hyperswarm()

  swarm.on('connection', (conn, info) => {
    console.log('New connection from:', info.publicKey.toString('hex'))
    // Corestoreをピアに複製
    store.replicate(conn)
    
    conn.on('error', (err) => console.error('Connection error:', err))
  })

  // トピック（自分の公開鍵など）をアナウンス/検索
  const discovery = swarm.join(topicKey, { server: true, client: true })
  await discovery.flushed()
  
  return swarm
}

/**
 * 特定のトピックを生成（ハッシュ化）します。
 * @param {string} name 
 * @returns {Buffer}
 */
export function getTopic(name) {
  return crypto.discoveryKey(Buffer.from(name))
}
