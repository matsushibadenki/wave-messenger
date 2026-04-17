/*
File Path: wave-messenger/src/index.js
File Name: index.js
Description: React アプリケーションのエントリーポイント。
実機P2P通信との統合、およびQRコード等によるアドレス交換UIを含みます。
*/

import React, { useState, useEffect, useRef, useCallback } from '../vendor/react-shim.js'
import { createRoot } from '../vendor/react-dom-shim.js'
import './i18n.js'
import { useTranslation } from '../vendor/react-i18next-shim.js'
import { useMessenger } from './hooks/useMessenger.js'

const IconHome = ({ size = 24, active }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={active ? 'text-green-600' : 'text-gray-400'}>
    <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
    <polyline points='9 22 9 12 15 12 15 22'></polyline>
  </svg>
)

const IconMessage = ({ size = 24, active }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={active ? 'text-green-600' : 'text-gray-400'}>
    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
  </svg>
)

const IconSettings = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-gray-500'>
    <circle cx='12' cy='12' r='3'></circle>
    <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
  </svg>
)

const IconScan = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-gray-500'>
    <path d='M3 7V5a2 2 0 0 1 2-2h2'></path>
    <path d='M17 3h2a2 2 0 0 1 2 2v2'></path>
    <path d='M21 17v2a2 2 0 0 1-2 2h-2'></path>
    <path d='M3 17v2a2 2 0 0 1 2 2h2'></path>
    <line x1='8' y1='12' x2='16' y2='12'></line>
  </svg>
)

function ContactList({ contacts, onAddContact, onSelectContact }) {
  const { t } = useTranslation()
  const [newKey, setNewKey] = useState('')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newKey || !newName) return
    await onAddContact(newKey, newName)
    setNewKey('')
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className='flex flex-col h-full'>
      <button onClick={() => setShowAdd(!showAdd)} className='mb-4 w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition-all text-sm'>
        {showAdd ? 'キャンセル' : '+ 友達追加'}
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className='mb-6 p-4 bg-white rounded-xl shadow-inner border border-gray-100 animate-slide-down'>
          <input
            type='text'
            placeholder='公開鍵 (Public Key)'
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className='w-full mb-2 p-2 border-b outline-none focus:border-green-400 font-mono text-xs'
          />
          <input
            type='text'
            placeholder='表示名'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className='w-full mb-3 p-2 border-b outline-none focus:border-green-400'
          />
          <button type='submit' className='w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold'>
            追加
          </button>
        </form>
      )}

      <div className='flex-grow space-y-3'>
        {contacts.length === 0 ? (
          <div className='text-center text-gray-400 mt-10'>{t('contacts.empty')}</div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.publicKey} onClick={() => onSelectContact(contact)} className='flex items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gray-100'>
              <div className='w-12 h-12 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold text-xl shadow-inner border border-[#3a5a40]'>
                {contact.name?.[0] || '?'}
              </div>
              <div className='ml-4 flex-grow'>
                <div className='font-bold text-gray-800'>{contact.name || 'Unknown'}</div>
                <div className='text-[10px] text-gray-400 font-mono truncate w-32'>{contact.publicKey}</div>
              </div>
              {(contact.unreadCount || 0) > 0 && (
                <div className='min-w-6 h-6 px-2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold'>
                  {contact.unreadCount}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ChatRoom({ profile, contact, onBack, getMessages, sendMessage, markRead }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  const refreshMessages = useCallback(async () => {
    const list = await getMessages(contact.publicKey)
    if (Array.isArray(list)) setMessages(list)
  }, [contact.publicKey, getMessages])

  useEffect(() => {
    markRead(contact.publicKey).catch(() => {})
    refreshMessages()
    const timer = setInterval(refreshMessages, 2000)
    return () => clearInterval(timer)
  }, [contact.publicKey, markRead, refreshMessages])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    await sendMessage(contact.publicKey, value)
    setText('')
    refreshMessages()
  }

  return (
    <div className='flex flex-col h-full bg-white relative'>
      <div className='p-4 border-b flex items-center glass sticky top-0 z-10'>
        <button onClick={onBack} className='mr-4 text-xl p-1 hover:bg-gray-100 rounded-full transition-colors'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M19 12H5'></path><polyline points='12 19 5 12 12 5'></polyline></svg>
        </button>
        <div className='w-10 h-10 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold'>{contact.name?.[0] || '?'}</div>
        <div className='ml-3'>
          <div className='font-bold text-gray-800'>{contact.name}</div>
          <div className='text-[10px] text-green-500 flex items-center'>
            <span className='w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse'></span>
            {profile.publicKey ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className='flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50'>
        {messages.map((msg) => (
          <div key={msg.messageId || `${msg.timestamp}-${msg.text}`} className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.self ? 'bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
              <div>{msg.text}</div>
              <div className={`text-[9px] mt-1 opacity-60 ${msg.self ? 'text-right' : ''}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className='p-4 border-t bg-white'>
        <form onSubmit={handleSend} className='flex items-center space-x-2'>
          <input
            type='text'
            placeholder={t('chat.input_placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className='flex-grow p-3 rounded-full border border-gray-100 outline-none focus:border-green-400 bg-gray-50 transition-all shadow-inner'
          />
          <button type='submit' disabled={!text.trim()} className='w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 text-white flex items-center justify-center shadow-md transform active:scale-90 transition-all disabled:opacity-50'>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><line x1='22' y1='2' x2='11' y2='13'></line><polygon points='22 2 15 22 11 13 2 9 22 2'></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const { t, i18n } = useTranslation()
  const {
    profile,
    contacts,
    rooms,
    loading,
    addContact,
    updateProfileName,
    getChatMessages,
    sendChatMessage,
    markChatRead
  } = useMessenger()

  const [activeTab, setActiveTab] = useState('home')
  const [selectedContact, setSelectedContact] = useState(null)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    if (!loading) {
      const splash = document.getElementById('splash')
      if (splash) {
        splash.classList.add('opacity-0')
        setTimeout(() => splash.remove(), 1000)
      }
    }
  }, [loading])

  if (loading) return null

  if (!profile.name) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-8 bg-white animate-fade-in text-center'>
        <h2 className='text-2xl font-bold mb-2'>{t('setup.title')}</h2>
        <input
          type='text'
          placeholder={t('setup.name_placeholder')}
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          className='w-full p-4 bg-gray-50 border-b-2 border-gray-100 outline-none focus:border-green-400 mb-6 transition-colors text-center text-xl'
        />
        <button onClick={() => updateProfileName(tempName)} disabled={!tempName.trim()} className='w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50'>
          {t('setup.start')}
        </button>
      </div>
    )
  }

  if (selectedContact) {
    return (
      <ChatRoom
        profile={profile}
        contact={selectedContact}
        onBack={() => setSelectedContact(null)}
        getMessages={getChatMessages}
        sendMessage={sendChatMessage}
        markRead={markChatRead}
      />
    )
  }

  return (
    <div className='flex flex-col h-full animate-fade-in bg-gray-50'>
      <header className='p-4 bg-white border-b flex justify-between items-center glass sticky top-0 z-10'>
        <h1 className='text-xl font-black bg-gradient-to-br from-green-600 to-blue-700 bg-clip-text text-transparent tracking-tighter'>WAVE</h1>
        <div className='flex items-center space-x-2'>
          <button className='p-2 hover:bg-gray-100 rounded-xl transition-colors'><IconScan /></button>
          <button className='p-2 hover:bg-gray-100 rounded-xl transition-colors' title='設定' onClick={() => setActiveTab('settings')}><IconSettings /></button>
          <button className='text-xs px-2 py-1 border rounded-lg' onClick={() => i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')}>
            {i18n.language === 'ja' ? 'EN' : 'JP'}
          </button>
        </div>
      </header>

      <main className='flex-grow overflow-y-auto'>
        {activeTab === 'home' && (
          <div className='p-4 space-y-6'>
            <div className='bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl shadow-sm border border-white'>
              <div className='flex items-center mb-6'>
                <div className='w-16 h-16 rounded-3xl bg-[#344e41] flex items-center justify-center text-[#a3b18a] text-3xl font-bold shadow-lg'>{profile.name?.[0] || '?'}</div>
                <div className='ml-4'>
                  <h2 className='text-xl font-bold text-gray-800'>{profile.name}</h2>
                  <p className='text-xs text-green-500 font-bold'>● ONLINE</p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-inner'>
                  <div className='w-32 h-32 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4 overflow-hidden'>
                    <div className='text-[10px] text-gray-300 text-center p-2'>
                      QR Code<br/>(PublicKey: {profile.publicKey.slice(0, 8)}...)
                    </div>
                  </div>
                  <p className='text-[10px] text-gray-400 font-mono break-all'>{profile.publicKey}</p>
                </div>
                <button className='w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors'>{t('qr.copy')}</button>
              </div>
            </div>

            <section>
              <h3 className='text-xs font-bold text-gray-400 mb-3 ml-2 uppercase tracking-widest'>{t('home.recent')}</h3>
              <div className='space-y-3'>
                {rooms.slice(0, 3).map((room) => (
                  <div key={room.contact.publicKey} onClick={() => { setSelectedContact(room.contact); setActiveTab('chats') }} className='bg-white p-4 rounded-2xl flex items-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors'>
                    <div className='w-10 h-10 rounded-full bg-[#344e41] text-[#a3b18a] flex items-center justify-center font-bold'>{room.contact.name?.[0] || '?'}</div>
                    <div className='ml-3 flex-grow'>
                      <div className='text-sm font-bold'>{room.contact.name}</div>
                      <div className='text-xs text-gray-400 truncate'>{room.lastMessage?.text || '-'}</div>
                    </div>
                    {(room.unreadCount || 0) > 0 && (
                      <span className='ml-2 min-w-6 h-6 px-2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold'>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
                {rooms.length === 0 && <p className='text-center text-gray-300 text-sm py-8'>{t('home.empty')}</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className='p-4'>
            <h2 className='text-sm font-bold text-gray-400 mb-4 ml-2 uppercase tracking-widest'>{t('tabs.chats')}</h2>
            <ContactList contacts={contacts} onAddContact={addContact} onSelectContact={setSelectedContact} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='p-4'>
            <div className='bg-white p-6 rounded-3xl shadow-sm'>
              <h3 className='font-bold border-b pb-2 mb-4'>{t('tabs.settings')}</h3>
              <button onClick={() => updateProfileName('')} className='text-red-500 text-sm font-bold w-full text-left py-2'>
                {t('settings.reset_profile')}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className='p-4 bg-white border-t flex justify-around items-center glass sticky bottom-0'>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400'}`}>
          <IconHome active={activeTab === 'home'} />
          <span className='text-[10px] mt-1 font-bold'>{t('tabs.home')}</span>
        </button>
        <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'chats' ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400'}`}>
          <IconMessage active={activeTab === 'chats'} />
          <span className='text-[10px] mt-1 font-bold'>{t('tabs.chats')}</span>
        </button>
      </footer>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
