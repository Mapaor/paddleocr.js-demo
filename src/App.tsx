import { useEffect, useRef, useState } from 'react'
import { PaddleOCR } from '@paddleocr/paddleocr-js'
import type { OcrResult } from '@paddleocr/paddleocr-js'
import './App.css'

type OcrEngine = Awaited<ReturnType<typeof PaddleOCR.create>>

const wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/'

function App() {
  const engine = useRef<OcrEngine | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [result, setResult] = useState<OcrResult | null>(null)
  const [status, setStatus] = useState('Loading OCR engine...')
  const [isReady, setIsReady] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let active = true

    void PaddleOCR.create({
      worker: false,
      textDetectionModelName: 'PP-OCRv5_mobile_det',
      textRecognitionModelName: 'PP-OCRv5_mobile_rec',
      ortOptions: {
        backend: 'wasm',
        wasmPaths,
        numThreads: 1,
        simd: true,
      },
    })
      .then((ocr) => {
        if (!active) {
          void ocr.dispose()
          return
        }
        engine.current = ocr
        setIsReady(true)
        setStatus('Ready. Choose an image to begin.')
      })
      .catch((error: unknown) => {
        setStatus(`Could not load OCR: ${error instanceof Error ? error.message : String(error)}`)
      })

    return () => {
      active = false
      if (engine.current) void engine.current.dispose()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [])

  function selectImage(file: File | undefined) {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setStatus('Image selected. Click Run OCR.')
  }

  async function runOcr() {
    if (!engine.current || !image) return
    setIsRunning(true)
    setStatus('Recognizing text...')
    try {
      const [nextResult] = await engine.current.predict(image)
      setResult(nextResult)
      setStatus(`Done. Found ${nextResult.items.length} text line${nextResult.items.length === 1 ? '' : 's'}.`)
    } catch (error: unknown) {
      setStatus(`OCR failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">PADDLEOCR.JS</p>
        <h1>Read text from any image.</h1>
        <p className="subtitle">A tiny browser OCR demo powered by PaddleOCR and WebAssembly.</p>
      </header>

      <section className="workspace">
        <div className="controls">
          <label className="upload">
            <span>{image ? image.name : 'Choose an image'}</span>
            <input type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} />
          </label>
          <button type="button" onClick={() => void runOcr()} disabled={!isReady || !image || isRunning}>
            {isRunning ? 'Reading...' : 'Run OCR'}
          </button>
        </div>

        <p className="status" role="status">{status}</p>

        <div className="results">
          <div className="preview">
            {previewUrl ? <img src={previewUrl} alt="Selected document" /> : <div className="empty">Your image preview will appear here.</div>}
          </div>
          <div className="recognized">
            <div className="section-heading">
              <span>Recognized text</span>
              {result && <small>{result.metrics.totalMs.toFixed(0)} ms</small>}
            </div>
            {result ? (
              result.items.length ? (
                <ol>{result.items.map((item, index) => <li key={`${item.text}-${index}`}>{item.text}</li>)}</ol>
              ) : <p className="empty">No text was found.</p>
            ) : <p className="empty">Run OCR to see the result.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
