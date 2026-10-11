"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { saveMenuItem } from "@/app/actions/menu"
import { useImageUpload } from "@/hooks/useImageUpload"
import { BLANK, type ChangeKey, changedFields, LIMITS, type MenuItemValues, PHOTO_MAX_BYTES, PHOTO_TYPES, slugify, validate } from "@/lib/menu/form"

/** One photo in the form — saved, uploading, or failed. Index 0 is the cover. */
export type PhotoDraft = {
  key: string
  publicId: string | null
  alt: string
  status: "done" | "uploading" | "failed"
  /** 0–1 while uploading. */
  progress: number
  /** A blob: URL for a photo picked in this session — shown until the page reloads. */
  localUrl: string | null
  error: "wrongType" | "tooBig" | "failed" | null
  /** Kept for Retry. */
  file: File | null
}

export type Fields = Omit<MenuItemValues, "photos">

/** A problem the error summary lists. `code` is a key of dict.admin.menuItem.errors. */
export type Problem = { section: "basics" | "photos"; code: string; values?: Record<string, string | number> }

export type SaveState = "saved" | "created" | "fix" | "unsaved" | "createPrompt" | "clean"

const FLASH_MS = 1800

function fieldsOf(values: MenuItemValues): Fields {
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription,
    category: values.category,
    price: values.price,
    priceUnit: values.priceUnit,
    isActive: values.isActive,
    about: values.about,
    ingredients: values.ingredients,
    allergens: values.allergens,
    orderable: values.orderable,
    noticeDays: values.noticeDays,
    bakeSeparately: values.bakeSeparately,
    defaultQuantity: values.defaultQuantity,
    sizeNote: values.sizeNote,
    storageNote: values.storageNote,
  }
}

function draftsOf(values: MenuItemValues): PhotoDraft[] {
  return values.photos.map((photo) => ({ ...photo, key: photo.publicId, status: "done", progress: 1, localUrl: null, error: null, file: null }))
}

function photoError(file: File): PhotoDraft["error"] {
  if (!PHOTO_TYPES.includes(file.type)) return "wrongType"
  if (file.size > PHOTO_MAX_BYTES) return "tooBig"
  return null
}

type Options = {
  id: string | null
  initial: MenuItemValues
  /** Just created — the status reads "Item created" until the first edit. */
  justCreated: boolean
}

/**
 * Everything the item form holds: the typed fields, the photos (with their uploads), what changed since
 * the last save, what's wrong, and Save / Discard. Uploads go straight from the browser to Cloudinary
 * under a server-issued signature; the form only ever stores public_ids.
 */
export function useItemForm({ id, initial, justCreated }: Options) {
  const router = useRouter()
  const [fields, setFields] = useState<Fields>(() => fieldsOf(initial))
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => draftsOf(initial))
  const [saved, setSaved] = useState<MenuItemValues>(initial)
  const [slugTouched, setSlugTouched] = useState(id !== null)
  const [tried, setTried] = useState(false)
  const [flash, setFlash] = useState<"saved" | "created" | null>(justCreated ? "created" : null)
  const [note, setNote] = useState<string | null>(null)
  const [slugTaken, setSlugTaken] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const images = useImageUpload()
  const uploads = useRef(new Map<string, AbortController>())
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  // Leaving the page: stop uploads and free the blob URLs.
  useEffect(() => {
    const active = uploads.current
    return () => {
      active.forEach((controller) => controller.abort())
      photosRef.current.forEach((photo) => photo.localUrl && URL.revokeObjectURL(photo.localUrl))
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [])

  const touched = useCallback(() => {
    setFlash(null)
    setNote(null)
    setSaveFailed(false)
  }, [])

  const set = useCallback(
    <K extends keyof Fields>(key: K, value: Fields[K]) => {
      touched()
      setFields((current) => {
        const next = { ...current, [key]: value }
        if (key === "name" && !slugTouched) next.slug = slugify(String(value))
        return next
      })
      if (key === "slug") {
        setSlugTouched(true)
        setSlugTaken(null)
      }
    },
    [slugTouched, touched],
  )

  // ── Photos ────────────────────────────────────────────────────────────────

  const patchPhoto = useCallback((key: string, patch: Partial<PhotoDraft>) => {
    setPhotos((current) => current.map((photo) => (photo.key === key ? { ...photo, ...patch } : photo)))
  }, [])

  const upload = useCallback(
    (key: string, file: File) => {
      const controller = new AbortController()
      uploads.current.set(key, controller)
      void (async () => {
        try {
          const publicId = await images.upload(file, {
            signal: controller.signal,
            onProgress: (progress) => patchPhoto(key, { progress }),
          })
          patchPhoto(key, { publicId, status: "done", progress: 1, error: null })
        } catch {
          if (!controller.signal.aborted) patchPhoto(key, { status: "failed", error: "failed" })
        } finally {
          uploads.current.delete(key)
        }
      })()
    },
    [images, patchPhoto],
  )

  /** Adds picked or dropped files. `cover` puts the first file in front; the rest join the gallery, up to 6 in all. */
  const addFiles = useCallback(
    (files: File[], target: "cover" | "gallery") => {
      if (files.length === 0) return
      touched()
      const room = LIMITS.photos - photosRef.current.length
      const drafts: PhotoDraft[] = files.slice(0, Math.max(0, room)).map((file) => {
        const error = photoError(file)
        return {
          key: crypto.randomUUID(),
          publicId: null,
          alt: "",
          status: error ? "failed" : "uploading",
          progress: 0,
          localUrl: URL.createObjectURL(file),
          error,
          file,
        }
      })
      if (drafts.length === 0) return
      setPhotos((current) => (target === "cover" ? [drafts[0], ...current, ...drafts.slice(1)] : [...current, ...drafts]))
      drafts.filter((draft) => draft.status === "uploading").forEach((draft) => upload(draft.key, draft.file as File))
    },
    [touched, upload],
  )

  const savedIds = useMemo(() => new Set(saved.photos.map((photo) => photo.publicId)), [saved])

  /** Drops a photo from the form. One uploaded in this session and never saved is destroyed on Cloudinary too. */
  const removePhoto = useCallback(
    (key: string) => {
      touched()
      const photo = photosRef.current.find((candidate) => candidate.key === key)
      if (!photo) return
      uploads.current.get(key)?.abort()
      if (photo.localUrl) URL.revokeObjectURL(photo.localUrl)
      if (photo.publicId && !savedIds.has(photo.publicId)) images.discard(photo.publicId)
      setPhotos((current) => current.filter((candidate) => candidate.key !== key))
    },
    [images, savedIds, touched],
  )

  /** Replace the cover: the new file takes its place, the old cover leaves the form. */
  const replaceCover = useCallback(
    (file: File) => {
      const cover = photosRef.current[0]
      if (cover) removePhoto(cover.key)
      addFiles([file], "cover")
    },
    [addFiles, removePhoto],
  )

  const setCover = useCallback(
    (key: string) => {
      touched()
      setPhotos((current) => {
        const index = current.findIndex((photo) => photo.key === key)
        if (index <= 0) return current
        const next = [...current]
        ;[next[0], next[index]] = [next[index], next[0]]
        return next
      })
    },
    [touched],
  )

  /** Moves a gallery photo to another gallery position (the cover keeps index 0). */
  const movePhoto = useCallback(
    (key: string, to: number) => {
      touched()
      setPhotos((current) => {
        const from = current.findIndex((photo) => photo.key === key)
        const target = Math.min(Math.max(1, to), current.length - 1)
        if (from <= 0 || from === target) return current
        const next = [...current]
        const [moved] = next.splice(from, 1)
        next.splice(target, 0, moved)
        return next
      })
    },
    [touched],
  )

  const setAlt = useCallback(
    (key: string, alt: string) => {
      touched()
      patchPhoto(key, { alt: alt.slice(0, LIMITS.alt) })
    },
    [patchPhoto, touched],
  )

  const retry = useCallback(
    (key: string) => {
      const photo = photosRef.current.find((candidate) => candidate.key === key)
      if (!photo?.file || photoError(photo.file)) return
      patchPhoto(key, { status: "uploading", progress: 0, error: null })
      upload(key, photo.file)
    },
    [patchPhoto, upload],
  )

  // ── Derived ───────────────────────────────────────────────────────────────

  const current: MenuItemValues = useMemo(
    () => ({
      ...fields,
      photos: photos
        .filter((photo) => photo.status === "done" && photo.publicId)
        .map((photo) => ({ publicId: photo.publicId as string, alt: photo.alt })),
    }),
    [fields, photos],
  )

  const changes: ChangeKey[] = useMemo(() => {
    const keys = changedFields(current, saved)
    if (photos.some((photo) => photo.status !== "done") && !keys.includes("photos")) keys.push("photos")
    return keys
  }, [current, saved, photos])

  const fieldErrors = useMemo(() => validate(current), [current])
  const failedCount = photos.filter((photo) => photo.status === "failed").length
  const uploadingCount = photos.filter((photo) => photo.status === "uploading").length

  const problems: Problem[] = useMemo(() => {
    const list: Problem[] = []
    if (tried) {
      if (fieldErrors.name) list.push({ section: "basics", code: fieldErrors.name })
      if (fieldErrors.slug) list.push({ section: "basics", code: fieldErrors.slug })
      else if (slugTaken !== null) list.push({ section: "basics", code: slugTaken ? "slugTaken" : "slugTakenUnknown", values: { name: slugTaken } })
      if (fieldErrors.shortDescription)
        list.push({ section: "basics", code: fieldErrors.shortDescription, values: { count: fields.shortDescription.trim().length } })
      if (fieldErrors.category) list.push({ section: "basics", code: fieldErrors.category })
      if (fieldErrors.price) list.push({ section: "basics", code: fieldErrors.price })
    }
    if (failedCount > 0)
      list.push({ section: "photos", code: failedCount === 1 ? "photosFailedOne" : "photosFailed", values: { count: failedCount } })
    else if (uploadingCount > 0 && tried)
      list.push({ section: "photos", code: uploadingCount === 1 ? "photosUploadingOne" : "photosUploading", values: { count: uploadingCount } })
    return list
  }, [tried, fieldErrors, slugTaken, fields.shortDescription, failedCount, uploadingCount])

  const creating = id === null
  const dirty = changes.length > 0
  const blocked = Object.keys(fieldErrors).length > 0 || slugTaken !== null || failedCount > 0 || uploadingCount > 0

  const saveState: SaveState = flash ? flash : problems.length > 0 ? "fix" : dirty ? "unsaved" : creating ? "createPrompt" : "clean"

  const canSave = !pending && flash === null && (problems.length === 0 || !tried) && (dirty || creating)

  // Unsaved work survives an accidental tab close or reload as a browser prompt.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // ── Save / discard ────────────────────────────────────────────────────────

  const reset = useCallback((values: MenuItemValues, touchedSlug: boolean) => {
    uploads.current.forEach((controller) => controller.abort())
    photosRef.current.forEach((photo) => photo.localUrl && URL.revokeObjectURL(photo.localUrl))
    setFields(fieldsOf(values))
    setPhotos(draftsOf(values))
    setSaved(values)
    setSlugTouched(touchedSlug)
    setTried(false)
    setSlugTaken(null)
  }, [])

  const discard = useCallback(() => {
    photosRef.current
      .filter((photo) => photo.publicId && !savedIds.has(photo.publicId))
      .forEach((photo) => images.discard(photo.publicId as string))
    reset(saved, id !== null)
    touched()
  }, [id, images, reset, saved, savedIds, touched])

  const save = useCallback(
    (andAnother = false) => {
      setTried(true)
      setSaveFailed(false)
      const category = current.category
      if (blocked || !category) return
      startTransition(async () => {
        const result = await saveMenuItem({ id, ...current, category })
        if (!result.ok) {
          if (result.reason === "SLUG_TAKEN") setSlugTaken(result.takenBy)
          else setSaveFailed(true)
          return
        }
        if (creating) {
          if (andAnother) {
            reset(BLANK, false)
            setNote(current.name)
            router.refresh()
          } else {
            router.replace(`/admin/menu/${result.id}?created=1`)
          }
          return
        }
        const values = { ...current, category: { slug: result.categorySlug } }
        setFields((now) => ({ ...now, category: values.category }))
        setSaved(values)
        setTried(false)
        setFlash("saved")
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlash((value) => (value === "saved" ? null : value)), FLASH_MS)
        router.refresh()
      })
    },
    [blocked, creating, current, id, reset, router],
  )

  return {
    fields,
    set,
    photos,
    addFiles,
    replaceCover,
    removePhoto,
    setCover,
    movePhoto,
    setAlt,
    retry,
    saved,
    changes,
    dirty,
    tried,
    fieldErrors,
    slugTaken,
    problems,
    saveState,
    canSave,
    pending,
    save,
    discard,
    /** The name of the item just created by "Save and add another". */
    createdName: note,
    saveFailed,
  }
}

export type ItemForm = ReturnType<typeof useItemForm>
