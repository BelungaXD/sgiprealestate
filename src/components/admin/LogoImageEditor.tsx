import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Cropper, { type Area } from 'react-easy-crop'

type LogoImageEditorProps = {
  isOpen: boolean
  imageSrc: string
  filename: string
  onCancel: () => void
  onApply: (editedImageDataUrl: string, outputFilename: string) => Promise<void> | void
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

const getCroppedDataUrl = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  flipX: boolean,
  flipY: boolean
): Promise<string> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const rotRad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rotRad))
  const cos = Math.abs(Math.cos(rotRad))
  const safeArea = Math.max(image.width, image.height) * (sin + cos)

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) throw new Error('Could not get cropped canvas context')

  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x + safeArea / 2 - image.width / 2,
    pixelCrop.y + safeArea / 2 - image.height / 2,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return croppedCanvas.toDataURL('image/webp', 0.9)
}

export default function LogoImageEditor({
  isOpen,
  imageSrc,
  filename,
  onCancel,
  onApply,
}: LogoImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [cropperInstanceKey, setCropperInstanceKey] = useState(0)
  const [workingImageSrc, setWorkingImageSrc] = useState(imageSrc)
  const [baselineImageSrc, setBaselineImageSrc] = useState(imageSrc)

  const cropTransform = useMemo(
    () =>
      `translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
    [crop.x, crop.y, rotation, zoom, flipX, flipY]
  )

  const resetControls = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipX(false)
    setFlipY(false)
    setCroppedAreaPixels(null)
    // Always restore the exact image that editor session started with.
    setWorkingImageSrc(baselineImageSrc)
    setCropperInstanceKey((v) => v + 1)
  }, [baselineImageSrc])

  useEffect(() => {
    if (!isOpen) return
    setBaselineImageSrc(imageSrc)
    setWorkingImageSrc(imageSrc)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipX(false)
    setFlipY(false)
    setCropperInstanceKey((v) => v + 1)
  }, [imageSrc, isOpen])

  const apply = useCallback(async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const edited = await getCroppedDataUrl(
        imageSrc,
        croppedAreaPixels,
        rotation,
        flipX,
        flipY
      )
      const outputFilename = `${filename.replace(/\.[^/.]+$/, '')}.webp`
      await onApply(edited, outputFilename)
      resetControls()
    } finally {
      setSaving(false)
    }
  }, [croppedAreaPixels, filename, flipX, flipY, imageSrc, onApply, resetControls, rotation])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-graphite mb-3">
                Edit Logo
              </Dialog.Title>
              <div className="relative h-96 w-full rounded-lg bg-gray-900 overflow-hidden">
                <Cropper
                  key={cropperInstanceKey}
                  image={workingImageSrc || imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  transform={cropTransform}
                  cropShape="rect"
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <label className="text-sm text-gray-700">
                  Zoom: {zoom.toFixed(1)}x
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Rotate: {rotation}°
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50">
                  Square (1:1)
                </span>
                <button
                  type="button"
                  className={`btn-outline btn-sm ${flipX ? 'bg-champagne/10' : ''}`}
                  onClick={() => setFlipX((v) => !v)}
                >
                  Mirror
                </button>
                <button
                  type="button"
                  className={`btn-outline btn-sm ${flipY ? 'bg-champagne/10' : ''}`}
                  onClick={() => setFlipY((v) => !v)}
                >
                  Flip Vertical
                </button>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setRotation((v) => (v + 90) % 360)}
                >
                  Rotate 90deg
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={(e) => {
                    e.preventDefault()
                    resetControls()
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-filled btn-sm"
                  onClick={apply}
                  disabled={saving}
                >
                  {saving ? 'Applying…' : 'Apply and Upload'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
