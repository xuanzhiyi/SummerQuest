'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  date: string
  track: 'chinese' | 'swedish' | 'french'
  onSaved: (entry: unknown, points: number) => void
}

type Stage = 'loading' | 'ready' | 'recording' | 'uploading' | 'done'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ReadingForm({ date, track, onSaved }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [level, setLevel] = useState<number>(5)
  const [stage, setStage] = useState<Stage>('loading')
  const [error, setError] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0) // seconds elapsed while recording

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/entries/${track}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.text) { setText(d.text); setLevel(d.level); setStage('ready') }
        else setError(d.error ?? 'Could not load reading text')
      })
      .catch(() => setError('Could not load reading text'))
  }, [track])

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function startRecording() {
    setError('')
    setDuration(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = handleRecordingStopped

      mr.start(250)
      setStage('recording')

      // Duration counter
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone and try again.')
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  async function safeJson(res: Response): Promise<Record<string, unknown>> {
    try { return await res.json() } catch { return {} }
  }

  async function handleRecordingStopped() {
    setStage('uploading')
    setError('')

    const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
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
    } catch (e) {
      setError((e instanceof Error ? e.message : 'Upload failed') + ' — saving without audio.')
    }

    // Save entry
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

  function deleteAndReRecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuration(0)
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

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Stage: ready */}
      {stage === 'ready' && (
        <button
          onClick={startRecording}
          style={{ width: '100%', background: '#F59E0B', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: 'pointer' }}
        >
          🎙️ I&apos;m ready — let&apos;s start!
        </button>
      )}

      {/* Stage: recording */}
      {stage === 'recording' && (
        <div className="space-y-3">
          {/* Recording indicator + timer */}
          <div style={{ background: '#FEF2F2', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 14 }}>Recording…</span>
            </div>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, color: '#DC2626' }}>
              {formatDuration(duration)}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', fontWeight: 600 }}>
            Read the passage aloud, then tap finished
          </p>
          <button
            onClick={stopRecording}
            style={{ width: '100%', background: '#EF4444', color: '#fff', borderRadius: 18, padding: '20px', border: 'none', fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: 'pointer' }}
          >
            ⏹ I&apos;m finished
          </button>
        </div>
      )}

      {/* Stage: uploading */}
      {stage === 'uploading' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
          <p style={{ color: '#F59E0B', fontWeight: 800, fontSize: 15 }}>Saving your recording…</p>
        </div>
      )}

      {/* Stage: done */}
      {stage === 'done' && (
        <div className="space-y-3">
          {/* Success banner */}
          <div style={{ background: '#D1FAE5', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#065F46', fontWeight: 800, fontSize: 15, margin: 0 }}>✓ Quest complete!</p>
              {duration > 0 && (
                <p style={{ color: '#059669', fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>
                  Recording: {formatDuration(duration)}
                </p>
              )}
            </div>
            <span style={{ fontSize: 28 }}>🎉</span>
          </div>

          {/* Audio player */}
          {audioUrl && (
            <div style={{ background: '#F9FAFB', borderRadius: 18, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
                🎧 Your recording
              </p>
              <audio
                controls
                src={audioUrl}
                style={{ width: '100%', borderRadius: 10 }}
              />
            </div>
          )}

          {/* Delete and re-record */}
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
