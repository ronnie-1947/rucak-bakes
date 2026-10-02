"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { MenuActionsStatus } from "@/components/menu-actions/MenuActionsStatus"
import { Container } from "@/components/ui/Container"
import { Dialog } from "@/components/ui/Dialog"
import { Notice } from "@/components/ui/Notice"
import type { ItemTarget } from "@/hooks/useMenuActions"
import type { MenuItemPage } from "@/lib/menu/item"
import { fill } from "@/lib/template"
import { ArchiveCard } from "./ArchiveCard"
import { ArchivedNotice } from "./ArchivedNotice"
import { BasicsSection } from "./BasicsSection"
import { DetailsSection } from "./DetailsSection"
import { ErrorSummary } from "./ErrorSummary"
import { FulfilmentSection } from "./FulfilmentSection"
import { ItemFormHeader } from "./ItemFormHeader"
import { ItemFormMenu } from "./ItemFormMenu"
import { ItemPerformance } from "./ItemPerformance"
import { ItemPreview } from "./ItemPreview"
import { LeaveDialog } from "./LeaveDialog"
import { PhotosSection } from "./PhotosSection"
import { SaveBar } from "./SaveBar"
import { SaveCard } from "./SaveCard"
import type { AdminCopy } from "./types"
import { useItemForm } from "./useItemForm"

type MenuItemFormProps = {
  page: MenuItemPage
  /** Arrived from Create — "“Name” created." and the green status until the first edit. */
  justCreated: boolean
  dict: AdminCopy
}

type Layout = "withPerformance" | "plain"

/** From 1024px the form takes 5/8 beside the sticky preview; from 1600px a saved item adds a performance column. */
const formSpans: Record<Layout, string> = {
  withPerformance: "lg:col-span-5 2xl:col-span-9",
  plain: "lg:col-span-5 2xl:col-span-12",
}

const sideSpans: Record<Layout, string> = {
  withPerformance: "lg:col-span-3 2xl:col-span-6",
  plain: "lg:col-span-3 2xl:col-span-8",
}

/**
 * /admin/menu/new and /admin/menu/[id] — one form. Phones and the 820px tablet get a single column
 * (capped at 720px, fields paired from 768px), a Preview sheet and a sticky save bar; laptops add the
 * sticky save card and live preview; 1600px+ adds recent performance.
 */
export function MenuItemForm({ page, justCreated, dict }: MenuItemFormProps) {
  const router = useRouter()
  const d = dict.menuItem
  const creating = page.id === null
  const form = useItemForm({ id: page.id, initial: page.values, justCreated })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const layout: Layout = page.performance ? "withPerformance" : "plain"
  const target: ItemTarget | null = page.id ? { id: page.id, name: form.saved.name, upcoming: page.upcoming } : null
  const leave = () => router.push("/admin/menu")
  const showBar = form.dirty || form.saveState === "saved" || form.saveState === "created" || form.saveFailed
  const created = justCreated && form.saveState === "created" ? fill(d.created, { name: form.saved.name }) : null
  const createdNext = form.createdName ? fill(d.createdNext, { name: form.createdName }) : null

  return (
    <div className="flex min-h-full flex-col">
      <Container className="flex flex-1 flex-col gap-6 pt-4 pb-12 md:pt-6 lg:gap-8 lg:pt-8">
        <ItemFormHeader
          title={creating ? d.newTitle : form.saved.name || d.untitled}
          status={creating ? null : form.saved.isActive ? "active" : "inactive"}
          onBack={() => (form.dirty ? setLeaving(true) : leave())}
          onPreview={() => setPreviewOpen(true)}
          menu={target && !page.archivedLabel ? <ItemFormMenu target={target} dict={d} /> : null}
          dict={d}
        />

        <div className="grid items-start gap-8 lg:grid-cols-8 2xl:grid-cols-20">
          <div className={`mx-auto flex w-full max-w-180 min-w-0 flex-col gap-4 lg:max-w-none ${formSpans[layout]}`}>
            <MenuActionsStatus dict={dict.menu} />
            {(created ?? createdNext) ? <Notice tone="success" title={created ?? createdNext} /> : null}
            {page.id && page.archivedLabel ? (
              <ArchivedNotice id={page.id} name={form.saved.name} archivedLabel={page.archivedLabel} dict={d} />
            ) : null}
            {form.problems.length > 0 ? <ErrorSummary problems={form.problems} dict={d} /> : null}
            <BasicsSection
              form={form}
              categories={page.categories}
              savedSlug={page.id ? form.saved.slug : null}
              upcomingCount={page.upcoming.length}
              dict={dict}
            />
            <PhotosSection form={form} dict={d} />
            <DetailsSection form={form} ingredientSuggestions={page.ingredientSuggestions} dict={dict} />
            <FulfilmentSection form={form} dict={d} />
            {target && !page.archivedLabel ? <ArchiveCard target={target} dict={d.archiveCard} /> : null}
          </div>

          <aside className={`sticky top-6 hidden min-w-0 flex-col gap-4 lg:flex ${sideSpans[layout]}`}>
            <SaveCard form={form} creating={creating} dict={d} />
            <h2 className="font-sans text-micro font-semibold text-muted uppercase">{d.previewPanel.title}</h2>
            <ItemPreview fields={form.fields} cover={form.photos[0] ?? null} dict={dict} />
          </aside>

          {page.performance ? (
            <aside className="sticky top-6 hidden min-w-0 2xl:col-span-5 2xl:block">
              <ItemPerformance performance={page.performance} upcoming={page.upcoming} dict={d.performance} />
            </aside>
          ) : null}
        </div>
      </Container>

      {showBar ? <SaveBar form={form} creating={creating} dict={d} /> : null}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={d.previewPanel.title} closeLabel={d.previewPanel.close}>
        <ItemPreview fields={form.fields} cover={form.photos[0] ?? null} dict={dict} />
      </Dialog>

      {leaving ? <LeaveDialog changes={form.changes} dict={d} onClose={() => setLeaving(false)} onLeave={leave} /> : null}
    </div>
  )
}
