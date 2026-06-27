'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  date: string
  track: 'chinese' | 'swedish' | 'french'
  onSaved: (entry: unknown, points: number) => void
}

type Stage =
  | 'loading'      // fetching AI text
  | 'ready'        // text shown, waiting for user to start
  | 'recording'    // MediaRecorder is active
  | 'uploading'    // audio blob is being uploaded to R2
  | 'done'         // saved — show re-record option

export default function ReadingForm({ date, track, onSaved }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [level, setLevel] = useState<number>(5)
  const [stage, setStage] = useState<Stage>('loading')
  const [error, setError] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null) // local preview URL

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    fetch(`/api/entries/${track}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.text) { setText(d.text); setLevel(d.level); setStage('ready') }
        else setError(d.error ?? 'Could not load reading text')
      })
      .catch(() => setError('Could not load reading text'))
  }, [track])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      // Prefer webm/opus; fall back to whatever the browser supports
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = handleRecordingStopped

      mr.start(250) // collect chunks every 250 ms
      setStage('recording')
    } catch (e) {
      setError('Microphone access denied. Please allow microphone and try again.')
    }
  }

  function stopRecording() {
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

    // Local preview
    setAudioUrl(URL.createObjectURL(blob))

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
      // Non-fatal — still save the entry without audio
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

  function reRecord() {
    setAudioUrl(null)
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
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-600 font-bold text-sm">Recording… read the passage aloud</span>
          </div>
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
        <div className="text-center py-4 text-amber-600 font-semibold text-sm animate-pulse">
          Saving your recording…
        </div>
      )}

      {/* Stage: done */}
      {stage === 'done' && (
        <div className="space-y-3">
          <div style={{ background: '#D1FAE5', borderRadius: 18, padding: '16px', textAlign: 'center' }}>
            <p style={{ color: '#065F46', fontWeight: 800, fontSize: 15, margin: 0 }}>✓ Quest complete! Great reading!</p>
          </div>

          {audioUrl && (
            <div>
              <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Your recording</p>
              <audio controls src={audioUrl} className="w-full" style={{ borderRadius: 12 }} />
            </div>
          )}

          <button
            onClick={reRecord}
            style={{ width: '100%', background: '#F9FAFB', color: '#374151', border: '2px solid #E5E7EB', borderRadius: 18, padding: '16px', fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
          >
            🔄 Re-record again
          </button>
        </div>
      )}
    </div>
  )
}
