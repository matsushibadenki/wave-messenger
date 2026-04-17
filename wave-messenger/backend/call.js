/*
File Path: wave-messenger/backend/call.js
File Name: call.js
Description: Hyperswarm 経由の WebRTC シグナリング情報を扱う最小実装。
*/

const sessions = new Map()

function buildSessionId(localPublicKey, targetPublicKey) {
  const sorted = [localPublicKey, targetPublicKey].sort().join(':')
  return `call-${sorted}`
}

export function startCallSession(localPublicKey, targetPublicKey, media = 'video') {
  const sessionId = buildSessionId(localPublicKey, targetPublicKey)
  const now = Date.now()

  const session = {
    sessionId,
    localPublicKey,
    targetPublicKey,
    media,
    state: 'ringing',
    startedAt: now,
    updatedAt: now,
    signals: []
  }

  sessions.set(sessionId, session)
  return session
}

export function pushSignal(sessionId, signal, from) {
  const session = sessions.get(sessionId)
  if (!session) return null

  session.signals.push({
    from,
    signal,
    timestamp: Date.now()
  })
  session.updatedAt = Date.now()

  return session
}

export function updateCallState(sessionId, state) {
  const session = sessions.get(sessionId)
  if (!session) return null

  session.state = state
  session.updatedAt = Date.now()

  return session
}

export function getCallSession(sessionId) {
  return sessions.get(sessionId) || null
}

export function endCallSession(sessionId) {
  const session = sessions.get(sessionId) || null
  sessions.delete(sessionId)
  return session
}
