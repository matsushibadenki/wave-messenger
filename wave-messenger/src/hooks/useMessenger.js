/*
File Path: wave-messenger/src/hooks/useMessenger.js
File Name: useMessenger.js
Description: Pear.messages を介してメインプロセスのP2Pバックエンドと通信するフックです。
*/

import { useState, useEffect, useCallback } from '../../vendor/react-shim.js'

// --- RPC Bridge Client for Renderer ---
if (typeof window !== 'undefined' && !window.bridge) {
  const pending = new Map()
  
  // Pear v2 のメッセージ受信 (Pear.on を使用)
  if (typeof Pear !== 'undefined' && Pear.on) {
    Pear.on('message', (data) => {
      try {
        const msg = typeof data === 'string' || Buffer.isBuffer(data) 
          ? JSON.parse(data.toString()) 
          : data
        const { id, result, error } = msg
        if (pending.has(id)) {
          const { resolve, reject } = pending.get(id)
          pending.delete(id)
          if (error) reject(new Error(error))
          else resolve(result)
        }
      } catch (e) {
        // RPC以外のメッセージは無視
      }
    })
  }

  window.bridge = {
    invoke: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2)
        pending.set(id, { resolve, reject })
        const msg = JSON.stringify({ id, method, params })
        if (typeof Pear !== 'undefined' && Pear.send) {
          Pear.send(msg)
        } else {
          reject(new Error("Pear IPC (send/on) not available"))
        }
      })
    }
  }
}

export function useMessenger() {
  const [profile, setProfile] = useState({ publicKey: '', name: '' })
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  const bridge = window.bridge

  const refreshContacts = useCallback(async () => {
    try {
      if (!bridge) return
      const list = await bridge.invoke('get-contacts')
      setContacts(list || [])
    } catch (err) {
      console.error("Failed to refresh contacts:", err)
    }
  }, [bridge])

  useEffect(() => {
    async function setup() {
      if (!bridge) {
         console.warn("Bridge not available yet. Waiting...")
         return
      }
      
      try {
        const p = await bridge.invoke('get-profile')
        const storedName = localStorage.getItem('user_name') || p.name
        setProfile({ ...p, name: storedName })

        await refreshContacts()
        setLoading(false)
      } catch (err) {
        console.error("useMessenger: Setup error:", err)
        setLoading(false)
      }
    }
    
    setup()
  }, [bridge, refreshContacts])

  const addContact = useCallback(async (pubKey, name) => {
    try {
      await bridge.invoke('add-contact', { publicKey: pubKey, name })
      await refreshContacts()
    } catch (err) {
      console.error("Failed to add contact:", err)
    }
  }, [bridge, refreshContacts])

  const updateProfileName = useCallback((name) => {
    localStorage.setItem('user_name', name)
    setProfile(prev => ({ ...prev, name }))
  }, [])

  const getChatMessages = useCallback(async (targetKey) => {
    try {
      return await bridge.invoke('chat-action', { action: 'get', targetKey })
    } catch (err) {
      console.error("Failed to get messages:", err)
      return []
    }
  }, [bridge])

  const sendChatMessage = useCallback(async (targetKey, text) => {
    try {
      await bridge.invoke('chat-action', { 
        action: 'send', 
        targetKey, 
        payload: { type: 'text', text } 
      })
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }, [bridge])

  return {
    profile,
    contacts,
    loading,
    addContact,
    updateProfileName,
    getChatMessages,
    sendChatMessage
  }
}
