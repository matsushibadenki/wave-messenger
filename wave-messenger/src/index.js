/*
File Path: wave-messenger/src/index.js
File Name: index.js
Description: React アプリケーションのエントリーポイント。
実機P2P通信との統合、およびQRコード等によるアドレス交換UIを含みます。
*/

import React, { useState, useEffect, useRef, useCallback } from '/vendor/react-shim.js'
import { createRoot } from '/vendor/react-dom-shim.js'
import '/src/i18n.js'
import { useTranslation } from '/vendor/react-i18next-shim.js'
import { useMessenger } from '/src/hooks/useMessenger.js'

const IconCall = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.88 12.88 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.24-1.24a2 2 0 0 1 2.11-.45 12.88 12.88 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'></path>
  </svg>
)

const IconSticker = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='12' cy='12' r='10'></circle>
    <path d='M8 14s1.5 2 4 2 4-2 4-2'></path>
    <line x1='9' y1='9' x2='9.01' y2='9'></line>
    <line x1='15' y1='9' x2='15.01' y2='9'></line>
  </svg>
)

const IconScan = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
    <path d="M7 12h10"></path>
    <path d="M12 7v10"></path>
  </svg>
)

const IconHome = ({ size = 20, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const IconMessage = ({ size = 20, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)

const IconSettings = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
)

function StickerPanel({ onSelect }) {
  const stickers = [
    { id: 's1', emoji: '🍈', name: 'Pear' },
    { id: 's2', emoji: '🌊', name: 'Wave' },
    { id: 's3', emoji: '🔥', name: 'Fire' },
    { id: 's4', emoji: '💎', name: 'Diamond' },
    { id: 's5', emoji: '🚀', name: 'Rocket' },
    { id: 's6', emoji: '🦄', name: 'Magic' },
    { id: 's7', emoji: '🍕', name: 'Pizza' },
    { id: 's8', emoji: '🎮', name: 'Game' }
  ]

  return (
    <div className='p-4 bg-white grid grid-cols-4 gap-4 animate-slide-up border-t'>
      {stickers.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className='w-16 h-16 flex flex-col items-center justify-center rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors group'
        >
          <span className='text-3xl group-hover:scale-125 transition-transform'>{s.emoji}</span>
          <span className='text-[8px] text-gray-400 mt-1 uppercase font-bold'>{s.name}</span>
        </button>
      ))}
    </div>
  )
}

function CallView({ contact, onEnd, mediaType = 'video' }) {
  const { t } = useTranslation()
  return (
    <div className='fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between p-12 text-white animate-fade-in'>
      <div className='text-center mt-12'>
        <div className='w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 mx-auto mb-6 flex items-center justify-center text-4xl font-bold shadow-2xl'>
          {contact.name?.[0]}
        </div>
        <h2 className='text-2xl font-bold mb-2'>{contact.name}</h2>
        <p className='text-green-400 text-sm animate-pulse uppercase tracking-widest'>Calling via P2P...</p>
      </div>

      <div className='w-full max-w-xs aspect-video bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl'>
        {mediaType === 'video' ? (
          <div className='relative w-full h-full flex items-center justify-center'>
            <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent'></div>
            <span className='text-gray-500 text-xs font-mono uppercase'>Waiting for camera...</span>
          </div>
        ) : (
          <div className='flex space-x-1'>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className='w-1 h-8 bg-green-500 rounded-full animate-bounce' style={{ animationDelay: `${i * 0.1}s` }}></div>)}
          </div>
        )}
      </div>

      <div className='flex space-x-8 mb-12'>
        <button className='w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z'></path><path d='M19 10v2a7 7 0 0 1-14 0v-2'></path><line x1='12' y1='19' x2='12' y2='23'></line><line x1='8' y1='23' x2='16' y2='23'></line></svg>
        </button>
        <button onClick={onEnd} className='w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/50 transform active:scale-90'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91'></path><line x1='23' y1='1' x2='1' y2='23'></line></svg>
        </button>
        <button className='w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M23 7l-7 5 7 5V7z'></path><rect x='1' y='5' width='15' height='14' rx='2' ry='2'></rect></svg>
        </button>
      </div>
    </div>
  )
}

function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream = null
    let animationId = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', true)
          videoRef.current.play()
          requestAnimationFrame(tick)
        }
      } catch (err) {
        console.error('Camera Error:', err)
        setError('Camera access denied or not found.')
      }
    }

    function tick() {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })

        if (code) {
          const data = code.data
          if (data.startsWith('wave://join/')) {
            const pubKey = data.split('/').pop()
            onScan(pubKey)
            return
          } else if (data.length === 64) {
            onScan(data)
            return
          }
        }
      }
      animationId = requestAnimationFrame(tick)
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [onScan])

  return (
    <div className='fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 animate-fade-in'>
      <div className='relative w-full max-w-sm aspect-square bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20'>
        {error ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center p-8 text-center'>
            <span className='text-4xl mb-4'>⚠️</span>
            <p className='text-white font-bold'>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className='w-full h-full object-cover' />
            <canvas ref={canvasRef} className='hidden' />
            <div className='absolute inset-0 border-[60px] border-black/40'>
              <div className='w-full h-full border-2 border-green-400 rounded-2xl animate-pulse-soft shadow-[0_0_20px_rgba(74,222,128,0.5)]'></div>
            </div>
          </>
        )}
      </div>

      <div className='mt-12 text-center text-white'>
        <h3 className='text-xl font-black mb-2 uppercase tracking-tight'>Scanning QR Code</h3>
        <p className='text-white/40 text-xs font-bold tracking-widest'>ALIGN THE WAVE ID WITHIN THE FRAME</p>
      </div>

      <button onClick={onClose} className='mt-16 py-4 px-12 bg-white/10 hover:bg-white/20 text-white rounded-full font-black text-sm uppercase tracking-widest backdrop-blur-xl border border-white/10 transition-all'>
        CLOSE SCANNER
      </button>
    </div>
  )
}

function QRModal({ publicKey, onClose }) {
  const { t } = useTranslation()
  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in' onClick={onClose}>
      <div className='bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl animate-slide-up relative' onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className='absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>
        </button>
        
        <div className='text-center mb-8'>
          <h3 className='text-xl font-black mb-1'>{t('qr.my_id')}</h3>
          <p className='text-xs text-gray-400'>Scan to add me on Wave</p>
        </div>

        <div className='aspect-square bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl border-4 border-white shadow-inner flex items-center justify-center mb-8 p-4 relative overflow-hidden'>
          {/* Simulated QR Code with Dots */}
          <div className='w-full h-full grid grid-cols-10 gap-1 opacity-20'>
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className={`rounded-full ${Math.random() > 0.4 ? 'bg-green-600' : 'bg-transparent'}`}></div>
            ))}
          </div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center'>
               <span className='text-2xl'>🍐</span>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
           <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
             <p className='text-[9px] text-gray-400 font-mono break-all leading-tight'>{publicKey}</p>
           </div>
           <button 
             onClick={() => { navigator.clipboard.writeText(publicKey); alert('Copied!') }}
             className='w-full py-4 btn-primary rounded-2xl font-bold text-sm shadow-xl'
           >
             {t('qr.copy')}
           </button>
        </div>
      </div>
    </div>
  )
}

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
      <button onClick={() => setShowAdd(!showAdd)} className='mb-6 w-full py-4 btn-primary rounded-2xl font-black shadow-lg transform active:scale-95 transition-all text-sm uppercase tracking-widest'>
        {showAdd ? 'CANCEL' : '+ ADD CONTACT'}
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className='mb-8 p-6 bg-white rounded-3xl shadow-xl border border-gray-50 animate-slide-up'>
          <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block'>Public Key</label>
          <input
            type='text'
            placeholder='ed25519:...'
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className='w-full mb-4 p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-green-400 font-mono text-xs transition-all'
          />
          <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block'>Display Name</label>
          <input
            type='text'
            placeholder='e.g. Satoshi'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className='w-full mb-6 p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-green-400 font-bold transition-all'
          />
          <button type='submit' className='w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-colors'>
            CONFIRM ADD
          </button>
        </form>
      )}

      <div className='flex-grow space-y-4'>
        {contacts.length === 0 ? (
          <div className='text-center py-20'>
            <div className='text-4xl mb-4'>📭</div>
            <div className='text-gray-400 text-xs font-bold uppercase tracking-widest'>{t('contacts.empty')}</div>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.publicKey} onClick={() => onSelectContact(contact)} className='flex items-center p-4 bg-white rounded-[1.5rem] shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer border border-transparent hover:border-green-100 group'>
              <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:rotate-3 transition-transform'>
                {contact.name?.[0] || '?'}
              </div>
              <div className='ml-4 flex-grow'>
                <div className='font-black text-gray-800 text-lg'>{contact.name || 'Unknown'}</div>
                <div className='text-[10px] text-gray-400 font-mono truncate w-40 opacity-60'>{contact.publicKey}</div>
              </div>
              <div className='flex flex-col items-end'>
                 {(contact.unreadCount || 0) > 0 && (
                   <div className='min-w-6 h-6 px-2 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black shadow-lg shadow-red-500/40 mb-1 animate-bounce'>
                     {contact.unreadCount}
                   </div>
                 )}
                 <div className='w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50'></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ChatRoom({ profile, contact, onBack, getMessages, sendMessage, markRead, onCall }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showStickers, setShowStickers] = useState(false)
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
    if (e) e.preventDefault()
    const value = text.trim()
    if (!value) return
    await sendMessage(contact.publicKey, value)
    setText('')
    refreshMessages()
  }

  const sendSticker = async (sticker) => {
    await sendMessage(contact.publicKey, sticker.emoji, 'sticker')
    setShowStickers(false)
    refreshMessages()
  }

  return (
    <div className='flex flex-col h-full bg-[#f8faf8] relative'>
      <header className='p-4 pt-6 border-b flex items-center glass sticky top-0 z-20'>
        <button onClick={onBack} className='mr-4 p-2 hover:bg-white/50 rounded-2xl transition-colors shadow-sm'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' className='text-gray-800'><path d='M19 12H5'></path><polyline points='12 19 5 12 12 5'></polyline></svg>
        </button>
        <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center font-black text-xl shadow-lg'>{contact.name?.[0] || '?'}</div>
        <div className='ml-4 flex-grow'>
          <div className='font-black text-gray-900 leading-tight'>{contact.name}</div>
          <div className='text-[10px] text-green-500 font-black flex items-center uppercase tracking-widest'>
            <span className='w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse'></span>
            Online
          </div>
        </div>
        <button onClick={() => onCall('voice')} className='p-3 hover:bg-white/50 rounded-2xl transition-colors text-gray-600'><IconCall /></button>
        <button onClick={() => onCall('video')} className='p-3 hover:bg-white/50 rounded-2xl transition-colors text-gray-600'><IconScan /></button>
      </header>

      <div className='flex-grow overflow-y-auto p-6 space-y-6'>
        {messages.map((msg, idx) => {
          const showTime = idx === 0 || Math.abs(msg.timestamp - messages[idx-1].timestamp) > 300000
          return (
            <div key={msg.messageId || `${msg.timestamp}-${msg.text}`} className='animate-fade-in'>
              {showTime && (
                <div className='text-center mb-6'>
                  <span className='px-3 py-1 bg-white/50 text-[9px] font-black text-gray-400 rounded-full uppercase tracking-widest border border-white'>{new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              <div className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'sticker' ? (
                  <div className='text-6xl animate-bounce-slow h-24 flex items-center justify-center select-none'>
                    {msg.text}
                  </div>
                ) : (
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-md leading-relaxed ${msg.self ? 'bg-gradient-to-br from-green-500 to-blue-700 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    <div className='font-medium'>{msg.text}</div>
                    <div className={`text-[8px] mt-2 font-black uppercase opacity-50 tracking-tighter ${msg.self ? 'text-right' : ''}`}>
                      {msg.self ? 'Sent • Verified' : 'Received • E2EE'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      <div className='p-4 pb-8 bg-white/80 backdrop-blur-xl border-t'>
        {showStickers && <StickerPanel onSelect={sendSticker} />}
        <form onSubmit={handleSend} className='flex items-center space-x-3'>
          <button type='button' onClick={() => setShowStickers(!showStickers)} className={`p-3 rounded-2xl transition-all ${showStickers ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
            <IconSticker />
          </button>
          <div className='flex-grow relative'>
            <input
              type='text'
              placeholder='Type encrypted message...'
              value={text}
              onChange={(e) => setText(e.target.value)}
              className='w-full p-4 pr-12 rounded-2xl border-none outline-none focus:ring-2 ring-green-400 bg-gray-50 transition-all font-medium shadow-inner'
            />
          </div>
          <button type='submit' disabled={!text.trim()} className='w-14 h-14 rounded-2xl btn-primary flex items-center justify-center shadow-lg transform active:scale-90 transition-all disabled:opacity-30 disabled:grayscale'>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'><path d='M22 2L11 13'></path><polygon points='22 2 15 22 11 13 2 9 22 2'></polygon></svg>
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
  const [showQR, setShowQR] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [activeCall, setActiveCall] = useState(null)

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
      <div className='flex flex-col items-center justify-center h-full p-10 bg-white animate-fade-in text-center'>
        <div className='w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-2xl animate-pulse'>🍐</div>
        <h2 className='text-3xl font-black mb-2 tracking-tighter uppercase'>{t('setup.title')}</h2>
        <p className='text-gray-400 text-xs font-bold tracking-[0.2em] mb-10'>DECENTRALIZED IDENTITY SETUP</p>
        
        <div className='w-full space-y-6'>
          <div className='relative'>
            <input
              type='text'
              placeholder={t('setup.name_placeholder')}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className='w-full p-6 bg-gray-50 rounded-3xl border-none outline-none focus:ring-4 ring-green-100 transition-all text-center text-xl font-bold placeholder:text-gray-200'
            />
          </div>
          <button onClick={() => updateProfileName(tempName)} disabled={!tempName.trim()} className='w-full py-6 btn-primary rounded-3xl font-black text-lg shadow-2xl disabled:opacity-30 transform active:scale-95 transition-all tracking-widest uppercase'>
            {t('setup.start')}
          </button>
        </div>
        <p className='mt-12 text-[9px] text-gray-300 font-mono max-w-[200px]'>Your Ed25519 keys will be generated locally and never leave your device.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full animate-fade-in bg-[#f8faf8] overflow-hidden'>
      {showQR && <QRModal publicKey={profile.publicKey} onClose={() => setShowQR(false)} />}
      {showScanner && <QRScanner onScan={(key) => { addContact(key, `Peer-${key.slice(0,4)}`); setShowScanner(false) }} onClose={() => setShowScanner(false)} />}
      {activeCall && <CallView contact={activeCall.contact} mediaType={activeCall.type} onEnd={() => setActiveCall(null)} />}
      
      {selectedContact ? (
        <ChatRoom
          profile={profile}
          contact={selectedContact}
          onBack={() => setSelectedContact(null)}
          getMessages={getChatMessages}
          sendMessage={sendChatMessage}
          markRead={markChatRead}
          onCall={(type) => setActiveCall({ contact: selectedContact, type })}
        />
      ) : (
        <>
          <header className='p-6 bg-white/80 backdrop-blur-xl border-b flex justify-between items-center sticky top-0 z-10'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-xs shadow-lg shadow-green-500/30'>🍐</div>
              <h1 className='text-2xl font-black bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tighter uppercase'>Wave</h1>
            </div>
            <div className='flex items-center space-x-3'>
              <button onClick={() => setShowScanner(true)} className='p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors shadow-sm' title='Scan QR Code'><IconScan size={22} /></button>
              <button className='text-[10px] font-black px-3 py-2 bg-gray-900 text-white rounded-xl shadow-lg transform active:scale-90 transition-all tracking-widest' onClick={() => i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')}>
                {i18n.language === 'ja' ? 'EN' : 'JP'}
              </button>
            </div>
          </header>

          <main className='flex-grow overflow-y-auto custom-scrollbar pt-4'>
            {activeTab === 'home' && (
              <div className='p-6 space-y-10'>
                <section className='animate-slide-up'>
                  <div className='bg-gradient-to-br from-gray-900 to-black p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group'>
                    <div className='absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-3xl'></div>
                    <div className='absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl'></div>
                    
                    <div className='flex items-center mb-8 relative z-10'>
                      <div className='w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-white text-4xl font-black shadow-inner border border-white/10 transform group-hover:rotate-6 transition-transform duration-500'>
                        {profile.name?.[0]}
                      </div>
                      <div className='ml-5'>
                        <h2 className='text-2xl font-black text-white tracking-tight'>{profile.name}</h2>
                        <div className='flex items-center space-x-2 mt-1'>
                          <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50'></span>
                          <p className='text-[10px] text-green-400 font-black uppercase tracking-[0.2em]'>Network Online</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-2 gap-4 relative z-10'>
                       <button onClick={() => setShowQR(true)} className='p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 flex flex-col items-center justify-center group/btn'>
                         <IconScan size={24} className='text-white mb-2' />
                         <span className='text-[10px] text-white/60 font-black uppercase tracking-widest'>{t('qr.my_id')}</span>
                       </button>
                       <button onClick={() => setActiveTab('chats')} className='p-4 bg-green-500 hover:bg-green-400 rounded-2xl transition-all shadow-lg shadow-green-500/20 flex flex-col items-center justify-center group/btn'>
                         <IconMessage size={24} className='text-white mb-2' />
                         <span className='text-[10px] text-white font-black uppercase tracking-widest'>{t('tabs.chats')}</span>
                       </button>
                    </div>
                  </div>
                </section>

                <section className='animate-slide-up' style={{ animationDelay: '0.1s' }}>
                  <div className='flex items-center justify-between mb-6 px-2'>
                    <h3 className='text-xs font-black text-gray-400 uppercase tracking-[0.2em]'>{t('home.recent')}</h3>
                    <button onClick={() => setActiveTab('chats')} className='text-[10px] font-black text-green-600 uppercase tracking-widest'>View All</button>
                  </div>
                  <div className='space-y-4'>
                    {rooms.slice(0, 3).map((room) => (
                      <div key={room.contact.publicKey} onClick={() => { setSelectedContact(room.contact) }} className='bg-white p-5 rounded-3xl flex items-center shadow-sm hover:shadow-xl hover:translate-x-2 transition-all cursor-pointer border border-transparent hover:border-green-50'>
                        <div className='w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xl'>{room.contact.name?.[0]}</div>
                        <div className='ml-4 flex-grow'>
                          <div className='text-sm font-black text-gray-800'>{room.contact.name}</div>
                          <div className='text-[11px] text-gray-400 font-medium truncate w-40'>{room.lastMessage?.text || 'Start conversation...'}</div>
                        </div>
                        <div className='text-[9px] font-black text-gray-300 uppercase'>{room.lastMessage ? new Date(room.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                    ))}
                    {rooms.length === 0 && (
                      <div className='text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200'>
                         <p className='text-gray-300 text-[10px] font-black uppercase tracking-widest'>{t('home.empty')}</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'chats' && (
              <div className='p-6 animate-slide-up'>
                <div className='flex items-center justify-between mb-8 px-2'>
                  <h2 className='text-sm font-black text-gray-400 uppercase tracking-[0.2em]'>{t('tabs.contacts')}</h2>
                  <div className='w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50'></div>
                </div>
                <ContactList contacts={contacts} onAddContact={addContact} onSelectContact={setSelectedContact} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className='p-6 animate-slide-up'>
                 <div className='bg-white p-8 rounded-[3rem] shadow-xl space-y-8'>
                    <div className='text-center border-b pb-8'>
                       <div className='w-24 h-24 rounded-[2.5rem] bg-gray-100 mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner'>⚙️</div>
                       <h3 className='text-xl font-black text-gray-900 uppercase tracking-tighter'>{t('tabs.settings')}</h3>
                       <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1'>Core Configuration</p>
                    </div>
                    
                    <div className='space-y-4'>
                       <button onClick={() => updateProfileName('')} className='w-full p-5 bg-red-50 hover:bg-red-100 text-red-500 rounded-3xl text-xs font-black uppercase tracking-widest transition-all text-center'>
                        ⚠️ {t('settings.reset_profile')}
                      </button>
                      <div className='p-5 bg-gray-50 rounded-3xl'>
                         <label className='text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block'>API Relay Endpoint</label>
                         <p className='text-[10px] font-mono text-gray-600 truncate'>https://relay.wave-messenger.io/v1</p>
                      </div>
                    </div>

                    <div className='pt-4 text-center'>
                       <p className='text-[8px] text-gray-300 font-mono'>WAVE PROTOCOL v1.0.0-BETA</p>
                       <p className='text-[8px] text-gray-300 font-mono mt-1'>PEAR RUNTIME v2.0.42</p>
                    </div>
                 </div>
              </div>
            )}
          </main>

          <footer className='p-4 pb-8 bg-white/90 backdrop-blur-xl border-t flex justify-around items-center sticky bottom-0 z-10'>
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-3 rounded-2xl transition-all transform active:scale-90 ${activeTab === 'home' ? 'text-green-600 bg-green-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <IconHome active={activeTab === 'home'} size={24} />
              <span className='text-[9px] mt-1 font-black uppercase tracking-widest'>{t('tabs.home')}</span>
            </button>
            <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center p-3 rounded-2xl transition-all transform active:scale-90 ${activeTab === 'chats' ? 'text-green-600 bg-green-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <IconMessage active={activeTab === 'chats'} size={24} />
              <span className='text-[9px] mt-1 font-black uppercase tracking-widest'>{t('tabs.contacts')}</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-3 rounded-2xl transition-all transform active:scale-90 ${activeTab === 'settings' ? 'text-green-600 bg-green-50 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <IconSettings size={24} />
              <span className='text-[9px] mt-1 font-black uppercase tracking-widest'>{t('tabs.settings')}</span>
            </button>
          </footer>
        </>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
