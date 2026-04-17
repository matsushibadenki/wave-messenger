/*
File Path: wave-messenger/backend/push.js
File Name: push.js
Description: 通知リレーサーバーへのメタデータ通知を行う薄いクライアント。
*/

export async function sendPushSignal({ endpoint, targetPublicKey, type, sourcePublicKey = null }) {
  if (!endpoint) {
    return {
      success: false,
      skipped: true,
      reason: 'No relay endpoint configured'
    }
  }

  const payload = {
    targetPublicKey,
    type,
    sourcePublicKey,
    timestamp: Date.now()
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      message: `Relay responded with ${res.status}`
    }
  }

  const json = await res.json().catch(() => ({}))
  return {
    success: true,
    response: json
  }
}
