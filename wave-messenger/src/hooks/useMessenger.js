/*
File Path: wave-messenger/src/hooks/useMessenger.js
File Name: useMessenger.js
Description: Pear.messages を介してメインプロセスのP2Pバックエンドと通信するフックです。
*/

import { useState, useEffect, useCallback } from '../../vendor/react-shim.js'

if (typeof window !== 'undefined' && !window.bridge) {
  const pending = new Map()

  if (typeof Pear !== 'undefined' && Pear.on) {
    Pear.on('data', (data) => {
      try {
        const str = (typeof data === 'string')
          ? data
          : (data instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)))
            ? new TextDecoder().decode(data)
            : JSON.stringify(data)

        const msg = JSON.parse(str)
        const { id, result, error } = msg

        if (pending.has(id)) {
          const { resolve, reject } = pending.get(id)
          pending.delete(id)
          if (error) reject(new Error(error))
          else resolve(result)
        }
      } catch {
        // RPC以外のメッセージ、またはパースエラーは無視
      }
    })
  }

  window.bridge = {
    invoke: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2)
        pending.set(id, { resolve, reject })
        const msg = JSON.stringify({ id, method, params })

        if (typeof Pear !== 'undefined') {
          if (Pear.write) {
            Pear.write(msg)
          } else if (Pear.send) {
            Pear.send(msg)
          } else {
            reject(new Error('Pear IPC (write/send) available but no method found'))
          }
        } else {
          reject(new Error('Pear IPC not available'))
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
    pushAction
  }
}
