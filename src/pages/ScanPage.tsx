import { Camera, Images, RotateCcw, Zap } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
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
        setCameraError("当前浏览器不支持直接打开相机，可以先用相册上传或模拟识别。");
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
    <AppShell showNav={false}>
      <TopBar title="拍一下器械" backTo="/home" right={<button className="text-xs font-bold text-ocean" onClick={() => fileInputRef.current?.click()} type="button">相册</button>} />

      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-[8px] border border-ink bg-ink">
          <div className="camera-grid aspect-[3/4]">
            {imagePreview ? (
              <img src={imagePreview} alt="已选择的器械图片" className="h-full w-full object-cover opacity-85" />
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover opacity-80" />
            )}
            <div className="pointer-events-none absolute inset-6 rounded-[8px] border-2 border-acid/80">
              <span className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-acid" />
              <span className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-acid" />
              <span className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-acid" />
              <span className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-acid" />
            </div>
          </div>
          {status === "recognizing" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/82 text-white">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-acid" />
              <p className="text-sm font-black">小铁正在识别器械</p>
              <p className="mt-1 text-xs text-white/70">正在看座椅、把手和重量区域</p>
            </div>
          ) : null}
        </div>

        <Card className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Tag tone="green">拍正面</Tag>
            <Tag tone="blue">带上座椅</Tag>
            <Tag tone="orange">看清把手</Tag>
          </div>
          <h1 className="text-xl font-black">对准器械拍一下</h1>
          <p className="text-sm font-semibold leading-6 text-muted">尽量拍出器械正面、座椅、把手和重量区域。拍得越清楚，小铁识别得越准。</p>
          {cameraError ? <p className="rounded-[8px] bg-coral/10 p-3 text-sm font-semibold leading-6 text-coral">{cameraError}</p> : null}
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" icon={<Images size={18} />} onClick={() => fileInputRef.current?.click()}>
            相册
          </Button>
          <Button className="min-h-16" icon={<Camera size={22} />} onClick={() => void capture()} disabled={status === "recognizing"}>
            拍照
          </Button>
          <Button variant="secondary" icon={<Zap size={18} />} onClick={() => setCameraError("手电筒控制会在原生 App 或 HTTPS 设备能力里接入。")}>
            补光
          </Button>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">Mock 场景</p>
              <p className="text-xs font-semibold text-muted">方便无后端时演示完整流程</p>
            </div>
            <RotateCcw size={18} className="text-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-[8px] bg-mint/15 px-3 py-2 text-xs font-black text-ocean" type="button" onClick={() => void runScan("mock-high", "high")}>
              高置信度
            </button>
            <button className="rounded-[8px] bg-yellow-100 px-3 py-2 text-xs font-black text-yellow-900" type="button" onClick={() => void runScan("mock-medium", "medium")}>
              可能是
            </button>
            <button className="rounded-[8px] bg-coral/10 px-3 py-2 text-xs font-black text-coral" type="button" onClick={() => void runScan("mock-low", "low")}>
              需补拍
            </button>
          </div>
        </Card>

        <XiaotieTip>别担心拍得不够专业。能看到器械整体、座椅和把手，小铁就更容易判断。</XiaotieTip>
      </section>

      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={upload} />
    </AppShell>
  );
}
