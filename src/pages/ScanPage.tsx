import { Images, RotateCcw, Zap } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { scanEquipment, type ScanScenario } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";

export function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraError, setCameraError] = useState<string>();
  const status = useScanStore((state) => state.status);
  const imagePreview = useScanStore((state) => state.imagePreview);
  const setStatus = useScanStore((state) => state.setStatus);
  const setImagePreview = useScanStore((state) => state.setImagePreview);
  const setResult = useScanStore((state) => state.setResult);
  const setError = useScanStore((state) => state.setError);
  const resetScan = useScanStore((state) => state.resetScan);

  useEffect(() => {
    let mounted = true;
    resetScan();

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("当前浏览器不支持直接打开相机，可以先用相册上传或 mock 场景体验流程。");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("cameraReady");
      } catch {
        setCameraError("没有拿到相机权限。你也可以从相册上传，或者用下面的 mock 场景体验流程。");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [resetScan, setStatus]);

  const runScan = async (source: Blob | string, scenario: ScanScenario = "high") => {
    setStatus("recognizing");
    try {
      const result = await scanEquipment(source, scenario);
      setResult(result);
      navigate("/scan/result");
    } catch {
      setError("识别失败了，可以换个角度再拍一次。");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      await runScan("mock-camera", "high");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImagePreview(canvas.toDataURL("image/jpeg", 0.82));
    canvas.toBlob((blob) => {
      void runScan(blob ?? "mock-camera", "high");
    }, "image/jpeg");
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    void runScan(file, "high");
  };

  return (
    <AppShell showNav={false} className="camera-screen">
      <div className="camera-top">
        <button className="icon-button" onClick={() => navigate("/home")} aria-label="关闭" type="button">×</button>
        <strong>拍一下器械</strong>
        <button className="icon-button !w-auto px-3 text-xs font-bold" onClick={() => fileInputRef.current?.click()} aria-label="相册" type="button">相册</button>
      </div>

      <section className="viewfinder" aria-label="相机取景框">
        {imagePreview ? (
          <img src={imagePreview} alt="已选择的器械图片" className="camera-feed" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="camera-feed" />
        )}

        <div className="coach-pill">
          <img className="avatar" src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="小铁" />
          <div><b>小铁会看器械结构</b><span>把座椅、把手和重量片一起拍进来</span></div>
        </div>
        <span className="target-label">器械主体放进框内</span>
        <div className="scan-box" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="camera-copy">
          <h1>对准器械拍一下</h1>
          <p>尽量拍出器械正面、座椅和把手</p>
        </div>

        {status === "recognizing" ? (
          <div className="recognition-overlay">
            <div>
              <div className="spinner" />
              <p className="m-0 text-sm font-black">小铁正在识别器械</p>
              <p className="mt-1 text-xs text-white/70">正在看座椅、把手和重量区域</p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="controls">
        <button className="icon-button" aria-label="手电筒" type="button" onClick={() => setCameraError("补光控制会在原生 App 或 HTTPS 设备能力里接入。")}>
          <Zap size={17} />
        </button>
        <button className="shutter" aria-label="拍照" type="button" onClick={() => void capture()} disabled={status === "recognizing"} />
        <button className="icon-button" aria-label="相册上传" type="button" onClick={() => fileInputRef.current?.click()}>
          <Images size={17} />
        </button>
      </div>

      <p className="tipline">拍得越清楚，小铁识别得越准</p>
      {cameraError ? <p className="camera-error">{cameraError}</p> : null}

      <div className="scenario-row" aria-label="Mock 场景">
        <button className="scenario-chip" type="button" onClick={() => void runScan("mock-high", "high")}>高置信度</button>
        <button className="scenario-chip" type="button" onClick={() => void runScan("mock-medium", "medium")}>可能是</button>
        <button className="scenario-chip" type="button" onClick={() => void runScan("mock-low", "low")}>
          <RotateCcw size={13} className="mr-1 inline align-[-2px]" />
          需补拍
        </button>
      </div>

      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={upload} />
    </AppShell>
  );
}
