/*
File Path: wave-messenger/src/hooks/useMessenger.js
File Name: useMessenger.js
Description: レンダラー環境でも安全に動作するように調整されたメッセンジャーフックです。
ブラウザ側でのインポートエラーを回避し、UIの表示を優先します。
*/

import { useState, useEffect, useCallback } from '../../vendor/react-shim.js'

export function useMessenger() {
  const [profile, setProfile] = useState({ publicKey: 'Generating...', name: '' })
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function setup() {
      console.log("useMessenger: Starting setup...");
      
      try {
        // 動的インポートを試みる（ブラウザ側でのエラー回避のため）
        // ※ 本来は Main Process (Bridge) 経由が望ましい
        let keys, corestore, swarm;
        
        try {
          const { getOrGenerateKeys, encodePublicKey } = await import('../../backend/keys.js');
          keys = await getOrGenerateKeys();
          console.log("useMessenger: Keys loaded.");
          
          setProfile({
            publicKey: encodePublicKey(keys.publicKey),
            name: localStorage.getItem('user_name') || ''
          });
        } catch (e) {
          console.warn("useMessenger: Failed to load backend/keys.js. Using mock.", e);
          setProfile({
            publicKey: 'MOCK_KEY_RENDERER_ONLY',
            name: localStorage.getItem('user_name') || ''
          });
        }

        // 開発用にモックデータを追加
        if (localStorage.getItem('user_name')) {
           setContacts([
             { publicKey: 'dummy1', name: 'サンプル友達', addedAt: Date.now() }
           ]);
        }

        console.log("useMessenger: Setup complete.");
        setLoading(false);

      } catch (err) {
        console.error("useMessenger: Critical setup error:", err);
        setLoading(false); // エラーでもUIは表示させる
      }
    }
    
    setup()
  }, [])

  const addContact = useCallback(async (pubKey, name) => {
    console.log("useMessenger: Adding contact (Mock):", name);
    setContacts(prev => [...prev, { publicKey: pubKey, name, addedAt: Date.now() }]);
  }, [])

  const updateProfileName = useCallback((name) => {
    console.log("useMessenger: Updating name to:", name);
    localStorage.setItem('user_name', name);
    setProfile(prev => ({ ...prev, name }));
  }, [])

  return {
    profile,
    contacts,
    loading,
    addContact,
    updateProfileName
  }
}
