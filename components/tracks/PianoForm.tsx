'use client'

import { useState, useEffect, useRef } from 'react'

const PIECE_SUGGESTIONS = [
  'Scales & arpeggios', 'Bach Minuet', 'Für Elise', 'Moonlight Sonata',
  'Chopin Nocturne', 'Canon in D', 'Free improvisation', 'Sight-reading',
]

interface Props {
  date: string
  onSaved: (entry: unknown, points: number) => void
  // When re-opening a saved entry
  savedEntry?: Record<string, unknown> | null
  canEdit?: boolean
}

type Stage = 'form' | 'recording' | 'uploading' | 'done'

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

export default function PianoForm({ date, onSaved, savedEntry, canEdit = true }: Props) {
  const [piece, setPiece] = useState((savedEntry?.piece as string) ?? '')
  const [duration, setDuration] = useState(savedEntry ? String(savedEntry.duration_minutes) : '')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // After entry is saved, we have an entry id to PATCH with audio_key
  const [entryId, setEntryId] = useState<number | null>((savedEntry?.id as number) ?? null)
  const [pointsAwarded, setPointsAwarded] = useState<number>((savedEntry?.points_awarded as number) ?? 0)
  const savedKeyRef = useRef<string | null>((savedEntry?.audio_key as string | null) ?? null)

  const [stage, setStage] = useState<Stage>(savedEntry ? 'done' : 'form')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recDuration, setRecDuration] = useState(0)
  const [blobSize, setBlobSize] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recError, setRecError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const levelRafRef = useRef<number | null>(null)

  // Fetch presigned URL for existing saved audio
  useEffect(() => {
    const key = savedEntry?.audio_key as string | null
    if (!key) return
    fetch(`/api/audio-url?key=${encodeURIComponent(key)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setAudioUrl(d.url) })
      .catch(() => {})
  }, [savedEntry])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
  }, [])

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    const res = await fetch('/api/entries/piano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, piece, duration_minutes: parseInt(duration) }),
    })
    const data = await res.json()
    setFormLoading(false)
    if (!res.ok) { setFormError(data.error ?? 'Something went wrong'); return }
    setEntryId((data.entry as Record<string, unknown>).id as number)
    setPointsAwarded(data.points_awarded as number)
    onSaved(data.entry, data.points_awarded)
    setStage('recording')
  }

  function startLevelMeter(stream: MediaStream) {
    try {
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      function tick() {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)))
        levelRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { /* non-critical */ }
  }

  function stopLevelMeter() {
    if (levelRafRef.current) { cancelAnimationFrame(levelRafRef.current); levelRafRef.current = null }
    setAudioLevel(0)
  }

  async function startRecording() {
    setRecError('')
    setRecDuration(0)
    setBlobSize(0)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const mimeType = [
        'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { chunksRef.current.push(e.data) }
      mr.onstop = handleRecordingStopped
      mr.start(500)
      startLevelMeter(stream)
      timerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000)
    } catch {
      setRecError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    stopLevelMeter()
    mediaRecorderRef.current?.stop()
    setTimeout(() => streamRef.current?.getTracks().forEach(t => t.stop()), 300)
  }

  async function handleRecordingStopped() {
    setStage('uploading')
    setRecError('')
    const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    setBlobSize(blob.size)

    if (blob.size < 500) {
      setRecError('Recording appears empty — check your microphone settings.')
      setStage('recording')
      return
    }

    const localUrl = URL.createObjectURL(blob)
    setAudioUrl(localUrl)

    // Upload to R2
    let audioKey: string | null = null
    try {
      const res = await fetch(`/api/upload/audio?track=piano&date=${date}`, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error((data.error as string) ?? `Upload error ${res.status}`)
      audioKey = data.key as string
      savedKeyRef.current = audioKey
    } catch (e) {
      setRecError((e instanceof Error ? e.message : 'Upload failed') + ' — saved without audio.')
    }

    // PATCH entry with audio_key
    if (entryId && audioKey) {
      try {
        await fetch('/api/entries/piano', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: entryId, audio_key: audioKey }),
        })
      } catch { /* non-critical */ }
    }

    setStage('done')
  }

  async function deleteAndReRecord() {
    const keyToDelete = savedKeyRef.current
    if (keyToDelete) {
      savedKeyRef.current = null
      fetch(`/api/upload/audio?key=${encodeURIComponent(keyToDelete)}`, { method: 'DELETE' }).catch(() => {})
      // Clear audio_key from DB
      if (entryId) {
        fetch('/api/entries/piano', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: entryId, audio_key: null }),
        }).catch(() => {})
      }
    }
    if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setRecDuration(0)
    setBlobSize(0)
    setRecError('')
    setStage('recording')
  }

  async function safeJson(res: Response): Promise<Record<string, unknown>> {
    try { return await res.json() } catch { return {} }
  }

  // ── FORM stage ──
  if (stage === 'form') {
    return (
      <form onSubmit={handleFormSubmit} className="pt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Piece / what you practiced</label>
          <input
            type="text"
            value={piece}
            onChange={e => setPiece(e.target.value)}
            placeholder="e.g. Für Elise, Scales…"
            list="piece-suggestions"
            className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300"
            required
          />
          <datalist id="piece-suggestions">
            {PIECE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min={1} max={480}
            placeholder="30"
            className="w-full border border-[rgba(255,255,255,0.12)] bg-[#1A2136] rounded-lg px-3 py-2 text-sm text-[#EDEFF5] placeholder:text-[#6B7793] focus:outline-none focus:ring-2 focus:ring-amber-300"
            required
          />
        </div>
        {formError && <p className="text-red-500 text-xs">{formError}</p>}
        <button
          type="submit"
          disabled={formLoading}
          style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.6 : 1 }}
        >
          {formLoading ? 'Saving…' : '🎹 Log practice — then record a clip!'}
        </button>
      </form>
    )
  }

  // ── RECORDING stage ──
  if (stage === 'recording') {
    const hasStarted = recDuration > 0 || audioLevel > 0
    return (
      <div className="pt-3 space-y-3">
        <div style={{ background: '#F0FDF4', borderRadius: 18, padding: '14px 18px' }}>
          <p style={{ color: '#065F46', fontWeight: 800, fontSize: 14, margin: 0 }}>
            🎹 {piece} · {duration} min logged ✓
          </p>
        </div>

        {recError && <p className="text-red-500 text-sm font-medium">{recError}</p>}

        {!hasStarted ? (
          <button
            onClick={startRecording}
            style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: 'pointer' }}
          >
            🎙️ Record a clip of your playing
          </button>
        ) : (
          <>
            <div style={{ background: '#FEF2F2', borderRadius: 18, padding: '16px 20px' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                  <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 14 }}>Recording…</span>
                </div>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, color: '#DC2626' }}>
                  {formatDuration(recDuration)}
                </span>
              </div>
              <div style={{ height: 8, background: '#FEE2E2', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${audioLevel}%`, background: audioLevel > 20 ? '#10B981' : '#EF4444', borderRadius: 999, transition: 'width 0.1s' }} />
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
          </>
        )}

        <button
          onClick={() => setStage('done')}
          style={{ width: '100%', background: 'transparent', color: '#9CA3AF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px' }}
        >
          Skip recording
        </button>
      </div>
    )
  }

  // ── UPLOADING stage ──
  if (stage === 'uploading') {
    return (
      <div className="pt-3 text-center py-8">
        <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
        <p style={{ color: '#F59E0B', fontWeight: 800, fontSize: 15 }}>Saving your recording…</p>
      </div>
    )
  }

  // ── DONE stage ──
  return (
    <div className="pt-3 space-y-3">
      {/* Summary */}
      <div style={{ background: '#D1FAE5', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#065F46', fontWeight: 800, fontSize: 15, margin: 0 }}>✓ Practice logged!</p>
          <p style={{ color: '#059669', fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>
            🎹 {piece} · {duration} min · +{pointsAwarded} pts
            {blobSize > 0 && ` · ${formatDuration(recDuration)} clip (${formatSize(blobSize)})`}
          </p>
        </div>
        <span style={{ fontSize: 28 }}>🎉</span>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
            🎧 Your recording
          </p>
          <audio key={audioUrl} controls src={audioUrl} style={{ width: '100%', borderRadius: 10 }} />
        </div>
      )}

      {!audioUrl && (
        <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '14px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, margin: 0 }}>No recording saved</p>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <>
          <button
            onClick={() => setStage('recording')}
            style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '16px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
          >
            🎙️ {audioUrl ? 'Record another clip' : 'Add a recording'}
          </button>

          {audioUrl && (
            <button
              onClick={deleteAndReRecord}
              style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '2px solid #FECACA', borderRadius: 18, padding: '16px', fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
            >
              🗑️ Delete and record again
            </button>
          )}
        </>
      )}
    </div>
  )
}
