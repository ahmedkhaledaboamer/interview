import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Live speech-to-text (Web Speech API, Chrome/Edge/Safari) plus an optional audio recording
 * of the same answer so the user can listen to themselves afterwards.
 */
export function useSpeech({ lang = 'en-US' } = {}) {
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null); // 'mic' | 'network' | 'other'
  const [audioUrl, setAudioUrl] = useState(null);

  const recRef = useRef(null);
  const wantRef = useRef(false);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const urlRef = useRef(null);

  const cleanupAudio = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!wantRef.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })) : null;
        setAudioUrl(urlRef.current);
        cleanupAudio();
      };
      recorder.start();
      recorderRef.current = recorder;
    } catch {
      // No recording is fine; the transcript still works.
    }
  };

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    finalRef.current = '';
    interimRef.current = '';
    setFinalText('');
    setInterim('');
    setError(null);
    setAudioUrl(null);
    wantRef.current = true;
    setListening(true);
    startRecording();
    if (!SR) return;

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current = `${finalRef.current} ${text}`.replace(/\s+/g, ' ').trim();
        else live += text;
      }
      interimRef.current = live;
      setFinalText(finalRef.current);
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('mic');
        wantRef.current = false;
      } else if (e.error === 'network') setError('network');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError('other');
    };
    // Chrome ends recognition after a pause; restart while the user is still answering.
    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setInterim('');
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('other');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    if (!recRef.current) setListening(false);
    recRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    recorderRef.current = null;
    // Keep whatever was still "interim" when the user stopped.
    if (interimRef.current) {
      finalRef.current = `${finalRef.current} ${interimRef.current}`.trim();
      interimRef.current = '';
      setFinalText(finalRef.current);
    }
    setInterim('');
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      recRef.current?.abort?.();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      cleanupAudio();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return { listening, finalText, interim, error, audioUrl, start, stop, setFinalText };
}

/** Reads text aloud with an English voice. */
export function speak(text, { lang = 'en-US', rate = 0.95 } = {}) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('en') && /Google|Natural|Samantha|Aria|Jenny/i.test(v.name))
    ?? window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('en'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
