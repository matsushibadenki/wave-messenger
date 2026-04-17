/*
File Path: server/server.js
File Name: server.js
Description: Push通知用リレーサーバーの最小実装。
デバイストークン登録と通知トリガーを受け取り、実配信部分を抽象化します。
*/

import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const tokenMap = new Map()

function sendJSON(res, statusCode, body) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readJSON(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function relayToProvider({ deviceToken, type, sourcePublicKey }) {
  // TODO: APNs / FCM 送信処理を実装
  return {
    delivered: true,
    provider: 'stub',
    deviceToken,
    type,
    sourcePublicKey
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJSON(res, 200, { ok: true, service: 'wave-relay' })
    }

    if (req.method === 'POST' && req.url === '/register-device') {
      const body = await readJSON(req)
      const { publicKey, deviceToken, platform } = body

      if (!publicKey || !deviceToken) {
        return sendJSON(res, 400, { ok: false, error: 'publicKey and deviceToken are required' })
      }

      tokenMap.set(publicKey, {
        publicKey,
        deviceToken,
        platform: platform || 'unknown',
        updatedAt: Date.now()
      })

      return sendJSON(res, 200, { ok: true })
    }

    if (req.method === 'POST' && req.url === '/notify') {
      const body = await readJSON(req)
      const { targetPublicKey, type = 'message', sourcePublicKey = null } = body

      if (!targetPublicKey) {
        return sendJSON(res, 400, { ok: false, error: 'targetPublicKey is required' })
      }

      const target = tokenMap.get(targetPublicKey)
      if (!target) {
        return sendJSON(res, 404, { ok: false, error: 'target device is not registered' })
      }

      const relayResult = await relayToProvider({
        deviceToken: target.deviceToken,
        type,
        sourcePublicKey
      })

      return sendJSON(res, 200, { ok: true, relayResult })
    }

    return sendJSON(res, 404, { ok: false, error: 'Not found' })
  } catch (error) {
    return sendJSON(res, 500, { ok: false, error: error.message })
  }
})

server.listen(PORT, () => {
  console.log(`Wave relay server is listening on http://localhost:${PORT}`)
})
