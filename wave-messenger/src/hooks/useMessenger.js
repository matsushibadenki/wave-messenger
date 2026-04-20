/*
File Path: wave-messenger/src/hooks/useMessenger.js
File Name: useMessenger.js
Description: Pear.messages を介してメインプロセスのP2Pバックエンドと通信するフックです。
*/

import { useState, useEffect, useCallback } from '/vendor/react-shim.js'

if (typeof window !== 'undefined' && !window.bridge) {
  const pending = new Map()

  if (typeof Pear !== 'undefined' && typeof Pear.messages === 'function') {
    console.log('Pear.messages listener initialized');
    // Pear.messages(callback) を使用してメインプロセスからのメッセージを購読
    Pear.messages((data) => {
      try {
        console.log('IPC Response received (raw):', data);
        let msg;
        if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data) && !(data instanceof Uint8Array)) {
          msg = data; // Already an object
        } else {
          const str = (typeof data === 'string')
            ? data
            : (data instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)))
              ? new TextDecoder().decode(data)
              : String(data)
          msg = JSON.parse(str)
        }

        const { id, result, error, method: msgMethod } = msg

        // 重要: 自分が送信したリクエスト（methodプロパティを持つ）のエコーを無視する
        if (msgMethod && !result && !error) {
          console.log('IPC Ignore self-echoed request:', msgMethod);
          return;
        }

        console.log('IPC Response processed:', { id, hasResult: typeof result !== 'undefined', error });

        if (pending.has(id)) {
          const { resolve, reject } = pending.get(id)
          pending.delete(id)
          if (error) reject(new Error(error))
          else resolve(result)
        }
      } catch (err) {
        console.warn('IPC Response parse error or unexpected format:', err, data);
      }
    })
  } else {
    console.warn('Pear.messages is NOT available in this environment');
  }

  window.bridge = {
    invoke: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2)
        pending.set(id, { resolve, reject })
        // オブジェクトとして送信（Pear.message は自動的にシリアライズする場合がある）
        const payload = { id, method, params }

        if (typeof Pear !== 'undefined' && typeof Pear.message === 'function') {
          console.log(`IPC Request sent: ${method} (ID: ${id})`, payload);
          Pear.message(payload)
        } else {
          console.error('Pear message method not found. Available keys:', typeof Pear !== 'undefined' ? Object.keys(Pear) : 'undefined')
          reject(new Error('Pear IPC (message) not available'))
        }
      })
    }
  }
}

export function useMessenger() {
  const [profile, setProfile] = useState({ publicKey: '', name: '' })
  const [contacts, setContacts] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const bridge = window.bridge

  const refreshContacts = useCallback(async () => {
    if (!bridge) return
    const list = await bridge.invoke('get-contacts')
    setContacts(list || [])
  }, [bridge])

  const refreshRooms = useCallback(async () => {
    if (!bridge) return
    const list = await bridge.invoke('get-rooms')
    setRooms(list || [])
  }, [bridge])

  useEffect(() => {
    async function setup() {
      if (!bridge) {
        console.warn('Bridge not available yet. Waiting...')
        return
      }

      try {
        const p = await bridge.invoke('get-profile')
        const storedName = localStorage.getItem('user_name') || p.name
        setProfile({ ...p, name: storedName })

        await Promise.all([refreshContacts(), refreshRooms()])
      } catch (err) {
        console.error('useMessenger: Setup error:', err)
      } finally {
        setLoading(false)
      }
    }

    setup()
  }, [bridge, refreshContacts, refreshRooms])

  const addContact = useCallback(async (pubKey, name) => {
    await bridge.invoke('add-contact', { publicKey: pubKey, name })
    await Promise.all([refreshContacts(), refreshRooms()])
  }, [bridge, refreshContacts, refreshRooms])

  const updateProfileName = useCallback((name) => {
    localStorage.setItem('user_name', name)
    setProfile((prev) => ({ ...prev, name }))
  }, [])

  const getChatMessages = useCallback(async (targetKey) => {
    return bridge.invoke('chat-action', { action: 'get', targetKey })
  }, [bridge])

  const sendChatMessage = useCallback(async (targetKey, text) => {
    await bridge.invoke('chat-action', {
      action: 'send',
      targetKey,
      payload: { type: 'text', text }
    })
    await refreshRooms()
  }, [bridge, refreshRooms])

  const markChatRead = useCallback(async (targetKey) => {
    await bridge.invoke('chat-action', {
      action: 'mark-read',
      targetKey
    })
    await Promise.all([refreshContacts(), refreshRooms()])
  }, [bridge, refreshContacts, refreshRooms])

  const callAction = useCallback((params) => bridge.invoke('call-action', params), [bridge])
  const pushAction = useCallback((params) => bridge.invoke('push-action', params), [bridge])
  const mediaAction = useCallback((params) => bridge.invoke('media-action', params), [bridge])

  return {
    profile,
    contacts,
    rooms,
    loading,
    addContact,
    updateProfileName,
    refreshContacts,
    refreshRooms,
    getChatMessages,
    sendChatMessage,
    markChatRead,
    callAction,
    pushAction,
    mediaAction
  }
}
