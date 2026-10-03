"use client"

import { saveBakeryDetails } from "@/app/actions/settings"
import { Field } from "@/components/ui/Field"
import { Icon } from "@/components/ui/icons/Icon"
import { inputClasses, TextInput } from "@/components/ui/TextInput"
import type { BakeryValues } from "@/lib/settings/form"
import { bakeryChanges, bakeryProblems, SETTINGS_LIMITS, tidyBakery } from "@/lib/settings/form"
import type { SettingsPageData } from "@/lib/settings/queries"
import { errorText, landingBanner } from "./copy"
import { FormFrame } from "./FormFrame"
import { HoursField } from "./HoursField"
import { InlinePreview } from "./InlinePreview"
import { LandingPreview } from "./LandingPreview"
import { fullRow } from "./layout"
import { PaneGrid } from "./PaneGrid"
import { PhoneField } from "./PhoneField"
import type { SettingsCopy } from "./types"
import { useSectionForm } from "./useSectionForm"

type BakerySectionProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

const submit = (values: BakeryValues) => saveBakeryDetails(values)

/**
 * Name, tagline, phone, pickup address and opening hours — what customers see about the shop. Below 1280px
 * small previews sit under the fields they show; from 1280px the landing page preview has its own column.
 */
export function BakerySection({ data, dict }: BakerySectionProps) {
  const d = dict.bakery
  const form = useSectionForm({
    saved: data.bakery,
    problems: bakeryProblems,
    changes: bakeryChanges,
    tidy: tidyBakery,
    submit,
    timezone: data.timezone,
  })
  const { values, problems, set } = form
  const error = (key: keyof typeof problems) => errorText(problems[key], dict.errors)
  const address = values.pickupAddress.trim()
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\n+/g, ", "))}`

  return (
    <FormFrame form={form} canEdit={data.canEdit} dict={dict.save}>
      <PaneGrid
        canEdit={data.canEdit}
        where="landing"
        dict={dict.preview}
        preview={
          <LandingPreview
            name={values.bakeryName.trim()}
            tagline={values.tagline.trim()}
            phone={values.phone.trim() ? `${d.phonePrefix} ${values.phone.trim()}` : ""}
            address={address}
            hours={values.hours}
            heroImage={data.appearance.heroImage}
            banner={landingBanner(data.pause, data.appearance.announcementOn, data.appearance.announcement, dict)}
            today={data.today}
            dict={dict}
          />
        }
      >
        <Field
          id="bakery-name"
          label={d.name}
          hint={d.nameHint}
          error={error("bakeryName")}
          className={fullRow}
        >
          <TextInput
            id="bakery-name"
            value={values.bakeryName}
            maxLength={SETTINGS_LIMITS.bakeryName}
            invalid={Boolean(problems.bakeryName)}
            aria-describedby="bakery-name-message"
            onChange={(event) => set({ bakeryName: event.target.value })}
          />
        </Field>
        <Field
          id="bakery-tagline"
          label={d.tagline}
          hint={d.taglineHint}
          error={error("tagline")}
          counter={`${values.tagline.trim().length} / ${SETTINGS_LIMITS.tagline}`}
          counterOver={values.tagline.trim().length > SETTINGS_LIMITS.tagline}
          className={fullRow}
        >
          <TextInput
            id="bakery-tagline"
            value={values.tagline}
            placeholder={d.taglinePlaceholder}
            invalid={Boolean(problems.tagline)}
            aria-describedby="bakery-tagline-message"
            onChange={(event) => set({ tagline: event.target.value })}
          />
        </Field>
        <InlinePreview label={d.preview} className={fullRow}>
          <span className="font-display text-h2 font-semibold wrap-break-word">{values.bakeryName.trim() || d.previewName}</span>
          <span className="self-start rounded-pill border border-o200 bg-o50 px-3 text-small-admin text-pretty">
            {values.tagline.trim() || d.previewTagline}
          </span>
        </InlinePreview>
        <PhoneField value={values.phone} onChange={(phone) => set({ phone })} error={error("phone")} dict={d} />
        <Field id="bakery-address" label={d.address} hint={d.addressHint} error={error("pickupAddress")} className={fullRow}>
          <textarea
            id="bakery-address"
            value={values.pickupAddress}
            rows={3}
            maxLength={SETTINGS_LIMITS.pickupAddress}
            aria-describedby="bakery-address-message"
            onChange={(event) => set({ pickupAddress: event.target.value })}
            className={inputClasses(Boolean(problems.pickupAddress), "min-h-24 resize-y py-3")}
          />
        </Field>
        {address ? (
          <InlinePreview label={d.preview} className={fullRow}>
            <span className="text-small-admin whitespace-pre-line">{address}</span>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener"
              className="flex min-h-11 items-center gap-2 self-start text-small-admin font-semibold text-o700 hover:underline"
            >
              <Icon name="map" className="size-4" />
              {d.openInMaps}
            </a>
          </InlinePreview>
        ) : null}
        <HoursField hours={values.hours} onChange={(hours) => set({ hours })} unsaved={!data.hoursSet} error={error("hours")} dict={d} />
      </PaneGrid>
    </FormFrame>
  )
}
