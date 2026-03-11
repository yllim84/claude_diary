import { useRef, useCallback, useState } from 'react'
import './App.css'
import { analyzeEmotion } from './emotionAnalyzer.js'

type EmotionKey =
  | 'joy'
  | 'sad'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'neutral'
  | 'anxiety'

interface EmotionConfidence {
  emotion: EmotionKey
  label: string
  confidence: number
}

interface AIResult {
  primaryEmotion: EmotionKey
  emotionLabel: string
  emotionIcon: string
  message: string
  confidences: EmotionConfidence[]
}

interface DiaryEntry {
  id: string
  text: string
  time: string
  result: AIResult
}

const EMOTION_ICON_MAP: Record<EmotionKey, string> = {
  joy:      '😊',
  sad:      '🥺',
  anger:    '😤',
  fear:     '😨',
  surprise: '😲',
  disgust:  '😣',
  neutral:  '😐',
  anxiety:  '😟',
}

function useTypingAnimation() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startTyping = useCallback(
    (text: string, onChar: (partial: string, done: boolean) => void, speedMs = 30) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      let index = 0
      const tick = () => {
        index += 1
        const partial = text.slice(0, index)
        const done = index >= text.length
        onChar(partial, done)
        if (!done) timerRef.current = setTimeout(tick, speedMs)
      }
      timerRef.current = setTimeout(tick, speedMs)
    },
    [],
  )

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { startTyping, cancel }
}

const KOREAN_TO_EMOTION_KEY: Record<string, EmotionKey> = {
  '기쁨':   'joy',
  '슬픔':   'sad',
  '분노':   'anger',
  '불안':   'anxiety',
  '피로':   'neutral',
  '외로움': 'sad',
  '감사':   'joy',
  '설렘':   'surprise',
  '무기력': 'neutral',
  '후회':   'disgust',
}

async function handleSubmit(text: string): Promise<AIResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (analyzeEmotion as any)(text, apiKey) as {
    emotion: string
    confidence: number
    top3: Array<{ emotion: string; confidence: number }>
    message: string
  }

  const primaryKey: EmotionKey = KOREAN_TO_EMOTION_KEY[raw.emotion] ?? 'neutral'

  return {
    primaryEmotion: primaryKey,
    emotionLabel:   raw.emotion,
    emotionIcon:    EMOTION_ICON_MAP[primaryKey],
    message:        raw.message,
    confidences:    raw.top3.map(item => ({
      emotion:    KOREAN_TO_EMOTION_KEY[item.emotion] ?? 'neutral',
      label:      item.emotion,
      confidence: Math.round(item.confidence * 100),
    })),
  }
}

function displayResult(_result: AIResult, _text: string): void { /* no-op */ }
function addToDiaryList(_text: string, _result: AIResult): void { /* no-op */ }

interface EmotionBadgeProps {
  emotion: EmotionKey
  label: string
  icon?: string
}

function EmotionBadge({ emotion, label, icon }: EmotionBadgeProps) {
  return (
    <span className={`emotion-badge emotion-badge--${emotion}`} aria-label={`감정: ${label}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  )
}

interface ConfidenceBarProps {
  item: EmotionConfidence
}

function ConfidenceBar({ item }: ConfidenceBarProps) {
  return (
    <li className="confidence-item">
      <span className="confidence-item__label">{item.label}</span>
      <div
        className="confidence-bar-track"
        role="progressbar"
        aria-valuenow={item.confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${item.label} 신뢰도`}
      >
        <div className="confidence-bar-fill" style={{ width: `${item.confidence}%` }} />
      </div>
      <span className="confidence-item__pct" aria-hidden="true">{item.confidence}%</span>
    </li>
  )
}

interface DiaryEntryCardProps {
  entry: DiaryEntry
}

function DiaryEntryCard({ entry }: DiaryEntryCardProps) {
  return (
    <li className="diary-entry" aria-label={`일기 항목: ${entry.time}`}>
      <header className="diary-entry__header">
        <EmotionBadge
          emotion={entry.result.primaryEmotion}
          label={entry.result.emotionLabel}
          icon={EMOTION_ICON_MAP[entry.result.primaryEmotion]}
        />
        <time className="diary-entry__time" dateTime={entry.id}>{entry.time}</time>
      </header>
      <p className="diary-entry__text">{entry.text}</p>
      <p className="diary-entry__ai-reply">{entry.result.message}</p>
    </li>
  )
}

export default function App() {
  const [inputText, setInputText]       = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [aiResult, setAiResult]         = useState<AIResult | null>(null)
  const [typedMessage, setTypedMessage] = useState('')
  const [isTyping, setIsTyping]         = useState(false)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { startTyping, cancel } = useTypingAnimation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const today = new Date()
  const dateLabel = today.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
  }, [])

  const onSubmitRef = useRef<(() => Promise<void>) | undefined>(undefined)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void onSubmitRef.current?.()
    }
  }, [])

  const onSubmit = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) return

    cancel()
    setIsLoading(true)
    setAiResult(null)
    setTypedMessage('')
    setIsTyping(false)
    setErrorMessage(null)

    try {
      const result = await handleSubmit(trimmed)
      displayResult(result, trimmed)
      setAiResult(result)
      setIsTyping(true)
      startTyping(result.message, (partial, done) => {
        setTypedMessage(partial)
        if (done) setIsTyping(false)
      })
      addToDiaryList(trimmed, result)
      const entry: DiaryEntry = {
        id:   new Date().toISOString(),
        text: trimmed,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        result,
      }
      setDiaryEntries(prev => [entry, ...prev])
      setInputText('')
      textareaRef.current?.focus()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, cancel, startTyping])

  onSubmitRef.current = onSubmit

  return (
    <div className="app">
      <a href="#main-content" className="sr-only"
        style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
        onFocus={e => { const el = e.currentTarget; el.style.left = '1rem'; el.style.width = 'auto'; el.style.height = 'auto'; }}
        onBlur={e => { const el = e.currentTarget; el.style.left = '-9999px'; el.style.width = '1px'; el.style.height = '1px'; }}
      >
        본문으로 건너뛰기
      </a>

      <header className="app-header" role="banner">
        <h1 className="app-header__title">
          오늘의 일기
          <span className="app-header__title-emoji" role="img" aria-label="연필">✏️</span>
        </h1>
        <time className="app-header__date" dateTime={today.toISOString()}>{dateLabel}</time>
      </header>

      <main id="main-content" className="app-main">
        <section className="card input-section" aria-labelledby="input-section-label">
          <label id="input-section-label" className="input-section__label" htmlFor="diary-input">
            오늘의 이야기
          </label>
          <textarea
            id="diary-input"
            ref={textareaRef}
            className="diary-textarea"
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="오늘 어떤 일이 있었나요? 편하게 써보세요 :)"
            rows={3}
            maxLength={500}
            aria-describedby="input-hint"
            disabled={isLoading}
          />
          <p id="input-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '-0.5rem' }}>
            {inputText.length}/500 · Ctrl+Enter로 전송
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={() => void onSubmit()}
            disabled={isLoading || inputText.trim().length === 0}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <><span className="spinner" aria-hidden="true" />분석 중...</>
            ) : (
              <><span className="submit-btn__icon" aria-hidden="true">💌</span>AI에게 보내기</>
            )}
          </button>
        </section>

        <div className={`card loading-card${isLoading ? ' is-visible' : ''}`}
          role="status" aria-live="polite" aria-label="AI가 감정을 분석하고 있습니다">
          <div className="loading-card__spinner" aria-hidden="true" />
          <p className="loading-card__text">AI가 감정을 분석하고 있어요...</p>
        </div>

        {errorMessage && (
          <div role="alert" className="card"
            style={{ color: 'var(--color-text)', borderLeft: '3px solid #e57373', padding: 'var(--space-md)' }}>
            <p>⚠️ {errorMessage}</p>
          </div>
        )}

        <section
          id="response-area"
          className={`card response-area${aiResult ? ' is-visible' : ''}`}
          aria-labelledby="response-heading"
          aria-live="polite"
        >
          {aiResult && (
            <>
              <p className="section-label" id="response-heading">AI의 공감 메시지</p>
              <div className="response-area__emotion-row">
                <span className="emotion-icon" role="img" aria-label={aiResult.emotionLabel}>
                  {aiResult.emotionIcon}
                </span>
                <EmotionBadge emotion={aiResult.primaryEmotion} label={aiResult.emotionLabel} />
              </div>
              <p className={`ai-message${isTyping ? ' is-typing' : ''}`} aria-label={`AI 메시지: ${aiResult.message}`}>
                {typedMessage}
              </p>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <p className="section-label">감정 분석 결과</p>
                <ul className="confidence-list" aria-label="감정 신뢰도 목록">
                  {aiResult.confidences.map(item => (
                    <ConfidenceBar key={item.emotion} item={item} />
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="diary-list-heading">
          <div className="diary-section__heading">
            <h2 id="diary-list-heading">오늘 쓴 일기</h2>
            {diaryEntries.length > 0 && (
              <span className="diary-section__count" aria-label={`총 ${diaryEntries.length}개`}>
                {diaryEntries.length}
              </span>
            )}
          </div>
          {diaryEntries.length === 0 ? (
            <div className="diary-list__empty" role="status">
              <span className="diary-list__empty-icon" role="img" aria-label="공책">📓</span>
              아직 쓴 일기가 없어요.<br />오늘 있었던 일을 위에 적어보세요.
            </div>
          ) : (
            <ul id="diary-list" className="diary-list" aria-label="오늘의 일기 목록">
              {diaryEntries.map(entry => (
                <DiaryEntryCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>오늘도 수고했어요 &nbsp;🤍</p>
      </footer>
    </div>
  )
}
