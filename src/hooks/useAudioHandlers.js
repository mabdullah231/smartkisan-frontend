import { useState, useRef } from "react";
import axios from "axios";
import Helpers from "../config/Helpers";

/**
 * useAudioHandlers - Custom hook for Speech-to-Text (STT)
 * Handles microphone recording, WAV conversion, and Azure API integration
 */
export const useAudioHandlers = (language, onTextReceived) => {
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ─── WAV encoder helper ───────────────────────────────────────────────────────
  const audioBufferToWav = (buffer) => {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const samples = buffer.getChannelData(0);
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const bufferOut = new ArrayBuffer(44 + dataSize);
    const view = new DataView(bufferOut);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([bufferOut], { type: 'audio/wav' });
  };

  // ─── STT Handler ─────────────────────────────────────────────────────────────────
  const handleStartListening = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const rawBlob = new Blob(audioChunksRef.current, { type: mimeType });

        try {
          // Convert to WAV via AudioContext for Azure compatibility
          const arrayBuffer = await rawBlob.arrayBuffer();
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(decoded);
          await audioCtx.close();

          const formData = new FormData();
          formData.append('audio_file', wavBlob, 'recording.wav');
          formData.append('language', language === "urdu" ? "ur-IN" : "en-US");

          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found. Please login again.');
          }

          const response = await axios.post(
            `${Helpers.apiUrl}azure/stt`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type for FormData - browser will set it with boundary
              }
            }
          );

          if (response.data.text) {
            onTextReceived(response.data.text);
          }
        } catch (error) {
          const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
          const statusCode = error.response?.status || 'N/A';
          console.error(`[STT Error] Status: ${statusCode} | Message: ${errorMsg}`, error);
          Helpers.toast("error", language === "urdu" ? `آواز کی سنی نہیں گئی: ${errorMsg}` : `Could not recognize speech: ${errorMsg}`);
        }

        setIsListening(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);

    } catch (error) {
      console.error("Microphone access error:", error);
      Helpers.toast("error", language === "urdu" ? "مائیکروفون تک رسائی نہیں ملی" : "Could not access microphone");
      setIsListening(false);
    }
  };

  return {
    isListening,
    handleStartListening,
    mediaRecorderRef,
    audioChunksRef
  };
};

export default useAudioHandlers;
