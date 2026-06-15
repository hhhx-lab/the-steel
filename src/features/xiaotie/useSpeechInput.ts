import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionResultItem;
  isFinal?: boolean;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
};

export function useSpeechInput(onTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string>();
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const supported = typeof window !== "undefined" && Boolean(getSpeechRecognition());

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stop = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const start = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceMessage("当前浏览器不支持语音识别，可以先用打字输入。");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    setVoiceMessage("正在听你说。");
    setRecording(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("")
        .trim();
      if (transcript) {
        setLastInputWasVoice(true);
        onTranscript(transcript);
        setVoiceMessage("已转成文字，你可以再改一下。");
      }
    };

    recognition.onerror = (event) => {
      setRecording(false);
      const message = event.error === "not-allowed"
        ? "没有拿到麦克风权限，可以先用打字输入。"
        : "语音识别没有成功，可以再试一次或直接打字。";
      setVoiceMessage(message);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    try {
      recognition.start();
    } catch {
      setRecording(false);
      setVoiceMessage("语音识别启动失败，可以先用打字输入。");
    }
  };

  const toggle = () => {
    if (recording) {
      stop();
      return;
    }
    start();
  };

  return {
    recording,
    supported,
    voiceMessage,
    lastInputWasVoice,
    markTextEdited: () => setLastInputWasVoice(false),
    toggle,
    stop
  };
}
