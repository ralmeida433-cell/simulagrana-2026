import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  RotateCw,
  Sun,
  Contrast,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  Crop,
  Eraser,
  Scissors,
} from "lucide-react";
import ReactCrop, { type Crop as CropType } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cn } from "../../lib/utils";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (file: File, url: string) => void;
}

interface CensorBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}: ImageEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [sharpness, setSharpness] = useState(0); // 0 to 5
  const [shadows, setShadows] = useState(0); // 0 to 100
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [tab, setTab] = useState<"adjust" | "transform" | "crop" | "censor">(
    "adjust",
  );

  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();

  const [censorBoxes, setCensorBoxes] = useState<CensorBox[]>([]);
  const [isDrawingCensor, setIsDrawingCensor] = useState(false);
  const [currentCensor, setCurrentCensor] = useState<CensorBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  const [corsUrl, setCorsUrl] = useState<string>("");

  useEffect(() => {
    if (imageUrl) {
      if (imageUrl.startsWith("http")) {
        setCorsUrl(
          `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}_cb=${Date.now()}`,
        );
      } else {
        setCorsUrl(imageUrl);
      }
    }
  }, [imageUrl]);

  useEffect(() => {
    if (isOpen) {
      setBrightness(100);
      setContrast(100);
      setSaturate(100);
      setSharpness(0);
      setShadows(0);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setTab("adjust");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCensorBoxes([]);
      setCurrentCensor(null);
    }
  }, [isOpen, imageUrl]);

  const applyChanges = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const img = imageRef.current;

    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0)
      return;

    const MAX_SIZE = 2560;
    let targetWidth = img.naturalWidth;
    let targetHeight = img.naturalHeight;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round(targetHeight * (MAX_SIZE / targetWidth));
        targetWidth = MAX_SIZE;
      } else {
        targetWidth = Math.round(targetWidth * (MAX_SIZE / targetHeight));
        targetHeight = MAX_SIZE;
      }
    }

    if (rotation % 180 === 90 || rotation % 180 === -90) {
      canvas.width = targetHeight;
      canvas.height = targetWidth;
    } else {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Default Canvas Filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

    // We can also apply an SVG filter if sharpness or shadows is active
    if (sharpness > 0 || shadows > 0) {
      ctx.filter += ` url(#custom-image-filter)`;
    }

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight,
    );
    ctx.restore();

    // Draw Censor Boxes (Pixelate)
    const allCensors = [...censorBoxes];
    if (currentCensor) allCensors.push(currentCensor);

    allCensors.forEach((box) => {
      // Get the image data for the boxed area
      const cw = canvas.width;
      const ch = canvas.height;
      const bx = box.x * cw;
      const by = box.y * ch;
      const bw = box.w * cw;
      const bh = box.h * ch;

      if (bw > 0 && bh > 0) {
        // Pixelation effect: calculate average color for chunks
        const pixelSize = Math.max(10, Math.floor(Math.min(bw, bh) / 10)); // chunk size for mosaic
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Draw black rects for now, or true pixelation if possible
        // To keep it performant, we'll draw a heavily blurred/mosaic rectangle
        try {
          const data = ctx.getImageData(bx, by, bw, bh);
          for (let y = 0; y < bh; y += pixelSize) {
            for (let x = 0; x < bw; x += pixelSize) {
              let r = 0,
                g = 0,
                b = 0,
                count = 0;
              for (let py = 0; py < pixelSize; py++) {
                for (let px = 0; px < pixelSize; px++) {
                  if (y + py < bh && x + px < bw) {
                    const i = ((y + py) * Math.floor(bw) + (x + px)) * 4;
                    r += data.data[i];
                    g += data.data[i + 1];
                    b += data.data[i + 2];
                    count++;
                  }
                }
              }
              if (count > 0) {
                ctx.fillStyle = `rgb(${r / count},${g / count},${b / count})`;
                ctx.fillRect(bx + x, by + y, pixelSize, pixelSize);
              }
            }
          }
        } catch (err) {
          console.error("Canvas pixelation failed, likely due to CORS:", err);
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(bx, by, bw, bh);
        }
        ctx.restore();
      }
    });
  }, [
    brightness,
    contrast,
    saturate,
    rotation,
    flipH,
    flipV,
    sharpness,
    shadows,
    censorBoxes,
    currentCensor,
  ]);

  useEffect(() => {
    if (isOpen && imageRef.current && imageRef.current.complete) {
      applyChanges();
    }
  }, [isOpen, tab, applyChanges]);

  // Censor Drawing Logic (pointer events on a transparent overlay)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (tab !== "censor") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setIsDrawingCensor(true);
    setCurrentCensor({ x, y, startX: x, startY: y, w: 0, h: 0 } as any);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingCensor || !currentCensor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const startX = (currentCensor as any).startX;
    const startY = (currentCensor as any).startY;

    const newX = Math.min(startX, x);
    const newY = Math.min(startY, y);
    const w = Math.abs(x - startX);
    const h = Math.abs(y - startY);

    setCurrentCensor((prev) =>
      prev ? { ...prev, x: newX, y: newY, w, h } : null,
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingCensor || !currentCensor) return;
    if (currentCensor.w > 0.01 && currentCensor.h > 0.01) {
      setCensorBoxes((prev) => [...prev, currentCensor]);
    }
    setIsDrawingCensor(false);
    setCurrentCensor(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetState = useCallback(() => {
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setSharpness(0);
    setShadows(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCensorBoxes([]);
    setCurrentCensor(null);
  }, []);

  const handleApplyLocally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tab === "crop" && completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const croppedCanvas = document.createElement("canvas");
      const croppedCtx = croppedCanvas.getContext("2d");
      if (croppedCtx) {
        const scaleX = canvas.width / 100;
        const scaleY = canvas.height / 100;

        const sx = completedCrop.x * scaleX;
        const sy = completedCrop.y * scaleY;
        const sWidth = completedCrop.width * scaleX;
        const sHeight = completedCrop.height * scaleY;

        croppedCanvas.width = sWidth;
        croppedCanvas.height = sHeight;

        croppedCtx.drawImage(
          canvas,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          sWidth,
          sHeight,
        );

        const url = croppedCanvas.toDataURL("image/jpeg", 1.0);
        setCorsUrl(url);
        resetState();
      }
    } else {
      const url = canvas.toDataURL("image/jpeg", 1.0);
      setCorsUrl(url);
      resetState();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If we have a crop active, we need to extract only that part
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const croppedCanvas = document.createElement("canvas");
      const croppedCtx = croppedCanvas.getContext("2d");
      if (croppedCtx) {
        const scaleX = canvas.width / 100;
        const scaleY = canvas.height / 100;

        const sx = completedCrop.x * scaleX;
        const sy = completedCrop.y * scaleY;
        const sWidth = completedCrop.width * scaleX;
        const sHeight = completedCrop.height * scaleY;

        croppedCanvas.width = sWidth;
        croppedCanvas.height = sHeight;

        croppedCtx.drawImage(
          canvas,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          sWidth,
          sHeight,
        );

        croppedCanvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "edited_image.jpg", {
                type: "image/jpeg",
              });
              onSave(file, URL.createObjectURL(file));
              onClose();
            }
          },
          "image/jpeg",
          0.9,
        );
        return;
      }
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "edited_image.jpg", {
            type: "image/jpeg",
          });
          const url = URL.createObjectURL(file);
          onSave(file, url);
          onClose();
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  if (!isOpen) return null;

  const sharpnessKernel = `0 ${-sharpness} 0 ${-sharpness} ${4 * sharpness + 1} ${-sharpness} 0 ${-sharpness} 0`;
  // For shadows, we remap the darker values to intermediate values
  // e.g. 0 remains 0, but 0.1 becomes something higher.
  const shadowBoost = shadows / 100; // 0 to 1
  const shadowTable = `0 ${0.2 + shadowBoost * 0.3} ${0.5 + shadowBoost * 0.2} 0.8 1`;

  // Censor preview bounding box rendering
  const CensorOverlay = () => {
    return (
      <div
        className="absolute inset-0 z-50 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {currentCensor && (
          <div
            className="absolute border-2 border-emerald-500 bg-black/20"
            style={{
              left: `${currentCensor.x * 100}%`,
              top: `${currentCensor.y * 100}%`,
              width: `${currentCensor.w * 100}%`,
              height: `${currentCensor.h * 100}%`,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        {/* SVG Filter Definition */}
        <svg className="hidden">
          <filter id="custom-image-filter">
            {sharpness > 0 && (
              <feConvolveMatrix
                order="3 3"
                preserveAlpha="true"
                kernelMatrix={sharpnessKernel}
              />
            )}
            {shadows > 0 && (
              <feComponentTransfer>
                <feFuncR type="table" tableValues={shadowTable} />
                <feFuncG type="table" tableValues={shadowTable} />
                <feFuncB type="table" tableValues={shadowTable} />
              </feComponentTransfer>
            )}
          </filter>
        </svg>

        {/* Hidden image used for source */}
        <img
          ref={imageRef}
          src={corsUrl || undefined}
          alt="Source"
          crossOrigin={corsUrl?.startsWith("http") ? "anonymous" : undefined}
          className="hidden"
          onLoad={applyChanges}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black text-white z-50 relative">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-semibold">Editar Imagem</div>
          <button
            onClick={handleSave}
            className="py-1 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold text-sm transition-colors cursor-pointer"
          >
            Salvar {tab === "crop" && completedCrop && "Recorte"}
          </button>
        </div>

        {/* Editor Area */}
        <div
          ref={editorAreaRef}
          className="flex-1 flex items-center justify-center p-4 overflow-hidden relative bg-black/90"
        >
          <div className="relative inline-flex items-center justify-center max-w-full max-h-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            {tab === "crop" ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                className="max-h-full"
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
              </ReactCrop>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
                {tab === "censor" && <CensorOverlay />}
              </>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="bg-[#111] text-white rounded-t-2xl z-50 relative border-t border-white/10">
          <div className="flex justify-around p-3 border-b border-white/10">
            <button
              onClick={() => setTab("crop")}
              className={cn(
                "text-[10px] font-bold pb-2 uppercase tracking-wide flex flex-col items-center gap-1",
                tab === "crop"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-gray-400",
              )}
            >
              <Scissors className="w-5 h-5" /> Recortar
            </button>
            <button
              onClick={() => setTab("censor")}
              className={cn(
                "text-[10px] font-bold pb-2 uppercase tracking-wide flex flex-col items-center gap-1",
                tab === "censor"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-gray-400",
              )}
            >
              <Eraser className="w-5 h-5" /> Borrar Placa
            </button>
            <button
              onClick={() => setTab("adjust")}
              className={cn(
                "text-[10px] font-bold pb-2 uppercase tracking-wide flex flex-col items-center gap-1",
                tab === "adjust"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-gray-400",
              )}
            >
              <Sun className="w-5 h-5" /> Ajustes
            </button>
            <button
              onClick={() => setTab("transform")}
              className={cn(
                "text-[10px] font-bold pb-2 uppercase tracking-wide flex flex-col items-center gap-1",
                tab === "transform"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-gray-400",
              )}
            >
              <RotateCw className="w-5 h-5" /> Transformar
            </button>
          </div>

          <div className="p-5 h-48 sm:h-56 overflow-y-auto w-full max-w-md mx-auto">
            {tab === "crop" && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-70">
                <Crop className="w-10 h-10 mx-auto" />
                <p className="text-sm">
                  Arraste sobre a imagem para recortar a área desejada.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }}
                    className="text-xs bg-white/10 px-4 py-2 rounded-lg transition-colors hover:bg-white/20"
                  >
                    Desfazer
                  </button>
                  <button
                    onClick={handleApplyLocally}
                    disabled={!completedCrop || completedCrop.width === 0}
                    className="text-xs bg-emerald-600 px-4 py-2 rounded-lg font-bold transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    Aplicar Recorte
                  </button>
                </div>
              </div>
            )}

            {tab === "censor" && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-70">
                <Eraser className="w-10 h-10 mx-auto" />
                <p className="text-sm tracking-tight px-4 shadow-sm">
                  <strong>
                    Arraste o dedo ou mouse sobre a placa do carro
                  </strong>{" "}
                  para borrar/pixelar (recomendado deixar o último número
                  visível para segurança).
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setCensorBoxes([])}
                    className="text-xs bg-white/10 px-4 py-2 rounded-lg transition-colors hover:bg-white/20"
                  >
                    Desfazer Pixels
                  </button>
                  <button
                    onClick={handleApplyLocally}
                    className="text-xs bg-emerald-600 px-4 py-2 rounded-lg font-bold transition-colors hover:bg-emerald-500 text-white"
                  >
                    Aplicar Borrado
                  </button>
                </div>
              </div>
            )}

            {tab === "adjust" && (
              <div className="space-y-5 pb-8 relative">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Brilho
                    </label>
                    <span className="text-xs font-mono">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Contraste
                    </label>
                    <span className="text-xs font-mono">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Saturação
                    </label>
                    <span className="text-xs font-mono">{saturate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturate}
                    onChange={(e) => setSaturate(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 flex items-center gap-2">
                      Nitidez
                    </label>
                    <span className="text-xs font-mono">{sharpness}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={sharpness}
                    onChange={(e) => setSharpness(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 flex items-center gap-2">
                      Sombras
                    </label>
                    <span className="text-xs font-mono">{shadows}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={shadows}
                    onChange={(e) => setShadows(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                {/* Apply button for adjustments */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleApplyLocally}
                    className="text-xs bg-emerald-600 px-6 py-2 rounded-lg font-bold transition-colors hover:bg-emerald-500 text-white"
                  >
                    Aplicar Ajustes
                  </button>
                </div>
              </div>
            )}

            {tab === "transform" && (
              <div className="flex flex-col gap-6 items-center justify-center h-full">
                <div className="flex gap-4">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex flex-col items-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                      <RotateCw className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Girar 90°
                    </span>
                  </button>
                  <button
                    onClick={() => setFlipH((v) => !v)}
                    className="flex flex-col items-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                      <FlipHorizontal className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Espelhar H
                    </span>
                  </button>
                  <button
                    onClick={() => setFlipV((v) => !v)}
                    className="flex flex-col items-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                      <FlipVertical className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Espelhar V
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleApplyLocally}
                  className="text-xs bg-emerald-600 px-6 py-2 rounded-lg font-bold transition-colors hover:bg-emerald-500 text-white mt-2"
                >
                  Aplicar Transformação
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
