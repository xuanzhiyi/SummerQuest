'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  date: string
  track: 'chinese' | 'swedish' | 'french' | 'english-reading' | 'finnish-reading'
  onSaved: (entry: unknown, points: number) => void
  initialText?: string
  initialLevel?: number
  savedAudioKey?: string | null
  savedEntryId?: number | null  // when set, PATCH the existing entry instead of POSTing a new one
}

type Stage = 'loading' | 'ready' | 'recording' | 'uploading' | 'done'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ReadingForm({ date, track, onSaved, initialText, initialLevel, savedAudioKey, savedEntryId }: Props) {
  const [text, setText] = useState<string | null>(initialText ?? null)
  const [level, setLevel] = useState<number>(initialLevel ?? 5)
  const [stage, setStage] = useState<Stage>(initialText ? 'ready' : 'loading')
  // Track the R2 key of the most recently saved recording so we can delete it
  const savedKeyRef = useRef<string | null>(savedAudioKey ?? null)
  const [error, setError] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [blobSize, setBlobSize] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0) // 0–100 for the meter

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const levelRafRef = useRef<number | null>(null)

  useEffect(() => {
    if (initialText) return // already have text — skip fetch
    fetch(`/api/entries/${track}`)
      .then(r => r.json())
      .then(d => {
        if (d.text) { setText(d.text); setLevel(d.level); setStage('ready') }
        else setError(d.error ?? 'Could not load reading text')
      })
      .catch(() => setError('Could not load reading text'))
  }, [track, initialText])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
  }, [])

  function startLevelMeter(stream: MediaStream) {
    try {
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)

      function tick() {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)))
        levelRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // AnalyserNode not critical — ignore
    }
  }

  function stopLevelMeter() {
    if (levelRafRef.current) { cancelAnimationFrame(levelRafRef.current); levelRafRef.current = null }
    setAudioLevel(0)
  }

  async function startRecording() {
    setError('')
    setDuration(0)
    setBlobSize(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      // Pick a supported mimeType
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? ''

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      // Collect every chunk unconditionally — don't filter by size
      mr.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }
      mr.onstop = handleRecordingStopped

      mr.start(500) // one chunk every 500 ms
      setStage('recording')

      startLevelMeter(stream)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    stopLevelMeter()
    // Stop the recorder first; onstop fires after the final ondataavailable
    mediaRecorderRef.current?.stop()
    // Stop mic tracks AFTER a short delay so the last chunk is flushed
    setTimeout(() => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }, 300)
  }

  async function safeJson(res: Response): Promise<Record<string, unknown>> {
    try { return await res.json() } catch { return {} }
  }

  async function handleRecordingStopped() {
    setStage('uploading')
    setError('')

    // Use the recorder's actual mimeType (may differ from what we requested)
    const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    setBlobSize(blob.size)

    if (blob.size < 500) {
      setError('Recording appears to be empty — microphone may not be working. Please check your system microphone settings.')
      setStage('ready')
      return
    }

    const localUrl = URL.createObjectURL(blob)
    setAudioUrl(localUrl)

    // Upload to R2
    let audioKey: string | null = null
    try {
      const res = await fetch(`/api/upload/audio?track=${track}&date=${date}`, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error((data.error as string) ?? `Upload error ${res.status}`)
      audioKey = data.key as string
      savedKeyRef.current = audioKey
    } catch (e) {
      setError((e instanceof Error ? e.message : 'Upload failed') + ' — saving without audio.')
    }

    // Re-recording an existing entry: PATCH audio_key only (no new XP)
    if (savedEntryId) {
      try {
        const res = await fetch(`/api/entries/${track}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedEntryId, audio_key: audioKey }),
        })
        const data = await safeJson(res)
        if (!res.ok) {
          setError((data.error as string) ?? `Save error ${res.status}`)
          setStage('ready')
          return
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
        setStage('ready')
        return
      }
      setStage('done')
      return
    }

    // First recording: POST new entry and award XP
    try {
      const res = await fetch(`/api/entries/${track}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ai_generated_text: text, level_at_time: level, audio_key: audioKey }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        setError((data.error as string) ?? `Save error ${res.status}`)
        setStage('ready')
        return
      }
      setStage('done')
      onSaved(data.entry as unknown, data.points_awarded as number)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setStage('ready')
    }
  }

  async function deleteAndReRecord() {
    // Delete the R2 object in the background (fire-and-forget — don't block the UI)
    const keyToDelete = savedKeyRef.current
    if (keyToDelete) {
      savedKeyRef.current = null
      fetch(`/api/upload/audio?key=${encodeURIComponent(keyToDelete)}`, { method: 'DELETE' })
        .catch(() => {}) // ignore errors — R2 delete is best-effort
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuration(0)
    setBlobSize(0)
    setError('')
    setStage('ready')
  }

  if (stage === 'loading') {
    return <p className="pt-3 text-sm text-gray-400 animate-pulse">Loading reading text…</p>
  }
  if (error && !text) {
    return <p className="pt-3 text-sm text-red-500">{error}</p>
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Reading passage */}
      <div className="bg-blue-50 rounded-xl p-4 text-base leading-relaxed whitespace-pre-wrap font-medium text-gray-800">
        {text}
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      {/* ready */}
      {stage === 'ready' && (
        <button
          onClick={startRecording}
          style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: 'pointer' }}
        >
          🎙️ I&apos;m ready — let&apos;s start!
        </button>
      )}

      {/* recording */}
      {stage === 'recording' && (
        <div className="space-y-3">
          <div style={{ background: '#FEF2F2', borderRadius: 18, padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 14 }}>Recording…</span>
              </div>
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, color: '#DC2626' }}>
                {formatDuration(duration)}
              </span>
            </div>
            {/* Audio level meter */}
            <div style={{ height: 8, background: '#FEE2E2', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${audioLevel}%`,
                background: audioLevel > 20 ? '#10B981' : '#EF4444',
                borderRadius: 999,
                transition: 'width 0.1s',
              }} />
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 4, textAlign: 'center' }}>
              {audioLevel > 20 ? '🎙️ Mic is picking up sound' : '⚠️ No sound detected — check your mic'}
            </p>
          </div>
          <button
            onClick={stopRecording}
            style={{ width: '100%', background: '#EF4444', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: 'pointer' }}
          >
            ⏹ I&apos;m finished
          </button>
        </div>
      )}

      {/* uploading */}
      {stage === 'uploading' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
          <p style={{ color: '#F59E0B', fontWeight: 800, fontSize: 15 }}>Saving your recording…</p>
        </div>
      )}

      {/* done */}
      {stage === 'done' && (
        <div className="space-y-3">
          <div style={{ background: '#D1FAE5', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#065F46', fontWeight: 800, fontSize: 15, margin: 0 }}>✓ Quest complete!</p>
              <p style={{ color: '#059669', fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>
                {formatDuration(duration)} · {formatSize(blobSize)}
              </p>
            </div>
            <span style={{ fontSize: 28 }}>🎉</span>
          </div>

          {audioUrl && (
            <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
                🎧 Your recording
              </p>
              <audio key={audioUrl} controls src={audioUrl} style={{ width: '100%', borderRadius: 10 }} />
            </div>
          )}

          <button
            onClick={deleteAndReRecord}
            style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '2px solid #FECACA', borderRadius: 18, padding: '16px', fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
          >
            🗑️ Delete and record again
          </button>
        </div>
      )}
    </div>
  )
}
