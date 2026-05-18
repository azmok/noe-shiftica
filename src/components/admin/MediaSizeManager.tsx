'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useForm, useFormFields, useDocumentInfo } from '@payloadcms/ui'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

export const MediaSizeManager: React.FC = () => {
  const { id } = useDocumentInfo()
  const sizesField = useFormFields(([fields]) => fields.sizes)
  const sizes = sizesField?.value as Record<string, any>
  const urlField = useFormFields(([fields]) => fields.url)
  const originalUrl = urlField?.value as string

  const { dispatchFields } = useForm()

  const [loadingSize, setLoadingSize] = useState<string | null>(null)
  
  // Crop state
  const [cropSize, setCropSize] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleDelete = async (sizeName: string) => {
    if (!id || !confirm(`Are you sure you want to delete the "${sizeName}" size?`)) return
    
    setLoadingSize(sizeName)
    try {
      const res = await fetch(`/api/media/${id}/sizes/${sizeName}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete size')
      
      // Update local form state to remove the size
      const newSizes = { ...sizes }
      delete newSizes[sizeName]
      dispatchFields({
        type: 'UPDATE',
        path: 'sizes',
        value: newSizes,
      })
    } catch (err) {
      console.error(err)
      alert('Error deleting size')
    } finally {
      setLoadingSize(null)
    }
  }

  const handleCropSave = async () => {
    if (!id || !cropSize || !completedCrop || !imgRef.current) return
    
    setLoadingSize(cropSize)
    try {
      // Get cropped image blob
      const canvas = document.createElement('canvas')
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height
      canvas.width = completedCrop.width
      canvas.height = completedCrop.height
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('No 2d context')

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      )

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
      if (!blob) throw new Error('Canvas is empty')

      const formData = new FormData()
      formData.append('file', blob, `${cropSize}.webp`)

      const res = await fetch(`/api/media/${id}/sizes/${cropSize}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload cropped image')

      const updatedSizeData = await res.json()

      // Update local form state
      const newSizes = {
        ...sizes,
        [cropSize]: updatedSizeData,
      }
      dispatchFields({
        type: 'UPDATE',
        path: 'sizes',
        value: newSizes,
      })

      setCropSize(null)
      setCrop(undefined)
      setCompletedCrop(null)
    } catch (err) {
      console.error(err)
      alert('Error saving cropped image')
    } finally {
      setLoadingSize(null)
    }
  }

  if (!sizes || Object.keys(sizes).length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--theme-elevation-150)', paddingBottom: '0.5rem' }}>
        Generated Sizes
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {Object.entries(sizes).map(([sizeName, sizeData]) => (
          <div key={sizeName} style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: '4px', padding: '1rem', position: 'relative' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{sizeName}</h4>
            <div style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', marginBottom: '1rem' }}>
              {sizeData.width}x{sizeData.height} • {(sizeData.filesize / 1024).toFixed(1)} KB
            </div>
            
            {sizeData.url ? (
              <div style={{ marginBottom: '1rem', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-elevation-50)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={sizeData.url} 
                  alt={sizeName} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCropSize(sizeName);
                }}
                disabled={loadingSize === sizeName || !originalUrl}
                style={{ flex: 1, padding: '0.25rem', background: 'var(--theme-elevation-150)', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                Crop
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(sizeName);
                }}
                disabled={loadingSize === sizeName}
                style={{ flex: 1, padding: '0.25rem', background: 'var(--theme-error-100)', color: 'var(--theme-error-600)', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {cropSize && originalUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'var(--theme-bg)', padding: '2rem', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Crop Image for &quot;{cropSize}&quot;</h3>
            <p style={{ fontSize: '13px', marginBottom: '1rem' }}>Select the area to crop from the original image.</p>
            
            <div style={{ maxWidth: '100%', maxHeight: '60vh', overflow: 'hidden' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={originalUrl}
                  alt="Original to crop"
                  style={{ maxWidth: '100%', maxHeight: '60vh' }}
                  crossOrigin="anonymous" // needed for canvas toBlob if original is from external URL
                />
              </ReactCrop>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="button"
                onClick={() => { setCropSize(null); setCrop(undefined); setCompletedCrop(null); }}
                style={{ padding: '0.5rem 1rem', background: 'var(--theme-elevation-150)', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleCropSave}
                disabled={!completedCrop?.width || !completedCrop?.height || loadingSize === cropSize}
                style={{ padding: '0.5rem 1rem', background: 'var(--theme-success-400)', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                {loadingSize === cropSize ? 'Saving...' : 'Save Crop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
