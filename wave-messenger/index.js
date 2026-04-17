/*
File Path: wave-messenger/index.js
File Name: index.js
Description: Pear Runtime v2 (Bare) の新しいメインエントリーポイントです。
pear-electron と pear-bridge を使用して、P2PメインプロセスとGUIプロセスを橋渡しします。
*/

import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

async function init() {
  console.log("Wave Messenger: Initializing Pear v2 Bridge...")

  const bridge = new Bridge()
  await bridge.ready()

  const runtime = new Runtime()
  
  // GUIプロセスの起動。
  // v2では package.json の設定に基づき、デフォルトでルートの index.html を使用します。
  const pipe = await runtime.start({ bridge })

  pipe.on('close', () => {
    console.log("GUI process closed. Exiting...")
    Pear.exit()
  })

  // バックエンドロジックの開始（必要に応じてここで初期化）
}

init().catch(err => {
  console.error("Critical error during Pear v2 initialization:", err)
  Pear.exit(1)
})
