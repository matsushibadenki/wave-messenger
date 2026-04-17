/*
File Path: wave-messenger/src/index.js
File Name: index.js
Description: React アプリケーションのエントリーポイントです。
ホーム、トーク、通話の3つの主要セクションを持つ新しいUIレイアウトを管理します。
*/

import React, { useState, useEffect, useRef } from '../vendor/react-shim.js'
import { createRoot } from '../vendor/react-dom-shim.js'
import './src/i18n.js'
import { useTranslation } from '../vendor/react-i18next-shim.js'
import { useMessenger } from './src/hooks/useMessenger.js'

// --- Custom Matte & Flat Icons (Inline SVGs) ---

const IconHome = ({ size = 24, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-green-600" : "text-gray-400"}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const IconMessage = ({ size = 24, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-green-600" : "text-gray-400"}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)

const IconPhone = ({ size = 24, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-green-600" : "text-gray-400"}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
)

const IconSettings = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
)

const IconUser = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const IconBell = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
)

const IconInfo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
)

// --- Components (Integrated to support Babel Standalone JSX transformation) ---

function ContactList({ contacts, onAddContact, onSelectContact }) {
  const [newKey, setNewKey] = useState('')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (newKey && newName) {
      await onAddContact(newKey, newName)
      setNewKey('')
      setNewName('')
      setShowAdd(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 新規追加ボタン */}
      <button 
        onClick={() => setShowAdd(!showAdd)}
        className="mb-4 w-full py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition-all text-sm"
      >
        {showAdd ? 'キャンセル' : '+ 友達追加'}
      </button>

      {/* 追加フォーム */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-white rounded-xl shadow-inner border border-gray-100 animate-slide-down">
          <input
            type="text"
            placeholder="公開鍵 (Public Key)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full mb-2 p-2 border-b outline-none focus:border-green-400 font-mono text-xs"
          />
          <input
            type="text"
            placeholder="表示名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full mb-3 p-2 border-b outline-none focus:border-green-400"
          />
          <button type="submit" className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold">
            追加
          </button>
        </form>
      )}

      {/* リスト表示 */}
      <div className="flex-grow space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            まだ連絡先がありません
          </div>
        ) : (
          contacts.map((contact) => (
            <div 
              key={contact.publicKey}
              onClick={() => onSelectContact(contact)}
              className="flex items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold text-xl shadow-inner border border-[#3a5a40]">
                {contact.name[0]}
              </div>
              <div className="ml-4 flex-grow">
                <div className="font-bold text-gray-800">{contact.name}</div>
                <div className="text-[10px] text-gray-400 font-mono truncate w-32">
                  {contact.publicKey}
                </div>
              </div>
              <div className="text-xs text-gray-300">
                {new Date(contact.addedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ChatRoom({ contact, messages, onSendMessage, onBack }) {
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    // メッセージが追加された時にスクロール
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (text.trim()) {
      onSendMessage(text)
      setText('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b flex items-center glass sticky top-0 z-10">
        <button onClick={onBack} className="mr-4 text-xl p-1 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold shadow-inner border border-[#3a5a40]">
          {contact.name[0]}
        </div>
        <div className="ml-3">
          <div className="font-bold text-gray-800">{contact.name}</div>
          <div className="text-[10px] text-green-500 flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-300 mt-20 text-sm">
            メッセージはまだありません。<br/>会話を始めましょう。
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] p-3 rounded-2xl text-sm shadow-sm
                ${msg.self ? 'bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}
              `}>
                <div>{msg.text}</div>
                <div className={`text-[9px] mt-1 opacity-60 ${msg.self ? 'text-right' : ''}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow p-3 rounded-full border border-gray-200 outline-none focus:border-green-400 bg-white transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white flex items-center justify-center shadow-md transform active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const { t } = useTranslation()
  const { profile, contacts, loading, addContact, updateProfileName } = useMessenger()

  const [activeTab, setActiveTab] = useState('home')
  const [selectedContact, setSelectedContact] = useState(null)
  const [tempName, setTempName] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    console.log("App: Component mounted. Loading state:", loading);
    if (!loading) {
      console.log("App: Initial setup complete. Removing splash screen...");
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('opacity-0');
        setTimeout(() => {
          splash.remove();
          console.log("App: Splash screen removed from DOM.");
        }, 1000);
      } else {
        console.warn("App: Splash screen element not found.");
      }
    }
  }, [loading])

  if (loading) return null

  if (!profile.name) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-white animate-fade-in text-center">
        <img src="./assets/icon.png" className="w-32 h-32 mb-8" alt="Logo" />
        <h2 className="text-2xl font-bold mb-2">{t('setup.title')}</h2>
        <p className="text-gray-400 mb-8 text-sm">{t('app.tagline')}</p>
        <input 
          type="text" 
          placeholder={t('setup.name_placeholder')}
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 outline-none focus:border-green-400 mb-6 transition-colors text-center text-xl"
        />
        <button 
          onClick={() => updateProfileName(tempName)}
          disabled={!tempName.trim()}
          className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50"
        >
          {t('setup.start')}
        </button>
      </div>
    )
  }

  if (selectedContact) {
    return (
      <ChatRoom 
        contact={selectedContact}
        messages={messages}
        onBack={() => setSelectedContact(null)}
        onSendMessage={(text) => {
          setMessages(prev => [...prev, { text, self: true, timestamp: Date.now() }])
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in bg-gray-50">
      {/* Header - 新レイアウト: 右側に 環境設定、ユーザー登録、お知らせ */}
      <header className="p-4 bg-white border-b flex justify-between items-center glass sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-xl font-black bg-gradient-to-br from-green-600 to-blue-700 bg-clip-text text-transparent tracking-tighter">
            WAVE
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative" title="お知らせ">
            <IconBell />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button onClick={() => updateProfileName('')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="アカウント">
            <IconUser />
          </button>
          <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="設定">
            <IconSettings />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* ユーザーサマリー */}
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl shadow-sm border border-white">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-3xl bg-[#344e41] flex items-center justify-center text-[#a3b18a] text-3xl font-bold shadow-lg">
                  {profile.name[0]}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
                  <p className="text-xs text-green-500 font-bold">● ONLINE</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl text-[10px] font-mono text-gray-400 border border-gray-100 break-all select-all">
                {profile.publicKey}
              </div>
            </div>

            {/* お知らせ / お知らせセクション */}
            <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden">
               <div className="absolute -right-2 -top-2 opacity-10">
                 <IconInfo size={64} />
               </div>
               <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center">
                 <IconInfo size={14} className="mr-1" /> Announcements
               </h3>
               <p className="text-sm text-blue-800 font-bold">Wave Messenger へようこそ！</p>
               <p className="text-[10px] text-blue-400 mt-1">P2Pネットワークの安定性を向上させました。</p>
            </section>

            {/* 最近の連絡（簡易表示） */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 mb-3 ml-2 uppercase tracking-widest">Recent Activity</h3>
              <div className="space-y-3">
                {contacts.slice(0, 3).map(c => (
                  <div key={c.publicKey} onClick={() => { setSelectedContact(c); setActiveTab('chats'); }} className="bg-white p-4 rounded-2xl flex items-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold">{c.name[0]}</div>
                    <div className="ml-3 flex-grow">
                      <div className="text-sm font-bold">{c.name}</div>
                      <div className="text-[10px] text-gray-400">タップしてメッセージを送る</div>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && <p className="text-center text-gray-300 text-sm py-8">アクティビティはありません</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="p-4">
            <h2 className="text-sm font-bold text-gray-400 mb-4 ml-2 uppercase tracking-widest">Messages</h2>
            <ContactList 
              contacts={contacts} 
              onAddContact={addContact}
              onSelectContact={(c) => {
                setSelectedContact(c)
              }}
            />
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 p-8 text-center">
            <div className="mb-4 opacity-10">
              <IconPhone size={80} />
            </div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">音声・ビデオ通話</h3>
            <p className="text-sm">通話履歴はまだありません。<br/>Phase 2 で実実装予定です。</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="font-bold border-b pb-2 flex items-center">
                <IconSettings size={18} className="mr-2" /> 環境設定
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">通知設定</span>
                  <div className="w-10 h-5 bg-green-400 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ダークモード</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                </div>
                <div className="pt-4 border-t">
                  <button onClick={() => updateProfileName('')} className="text-red-500 text-sm font-bold flex items-center">
                    <IconUser size={14} className="mr-1" /> ログアウト（情報のクリア）
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer - 新レイアウト: ホーム、トーク、通話 */}
      <footer className="p-4 bg-white border-t flex justify-around items-center glass sticky bottom-0">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400'}`}
        >
          <IconHome active={activeTab === 'home'} />
          <span className="text-[10px] mt-1 font-bold">ホーム</span>
        </button>
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'chats' ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400'}`}
        >
          <IconMessage active={activeTab === 'chats'} />
          <span className="text-[10px] mt-1 font-bold">トーク</span>
        </button>
        <button 
          onClick={() => setActiveTab('calls')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'calls' ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400'}`}
        >
          <span className="text-xl">📞</span>
          <span className="text-[10px] mt-1 font-bold">通話</span>
        </button>
      </footer>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
