"use client"

import { useState } from "react"
import { saveAppearanceSettings, saveHeroImage } from "@/app/actions/settings"
import { Field } from "@/components/ui/Field"
import { Switch } from "@/components/ui/Switch"
import { TextInput } from "@/components/ui/TextInput"
import { type AppearanceValues, appearanceChanges, appearanceProblems, SETTINGS_LIMITS, tidyAppearance } from "@/lib/settings/form"
import type { SettingsPageData } from "@/lib/settings/queries"
import { fill } from "@/lib/template"
import { errorText, landingBanner } from "./copy"
import { FixedSetting } from "./FixedSetting"
import { FormFrame } from "./FormFrame"
import { HeroPicker } from "./HeroPicker"
import { InlinePreview } from "./InlinePreview"
import { LandingPreview } from "./LandingPreview"
import { fullRow } from "./layout"
import { PaneGrid } from "./PaneGrid"
import type { SettingsCopy } from "./types"
import { useSectionForm } from "./useSectionForm"

type AppearanceSectionProps = {
  data: SettingsPageData
  dict: SettingsCopy
}

const submit = (values: AppearanceValues) => saveAppearanceSettings(values)

/**
 * The landing page photo, saved the moment it's uploaded, and the announcement strip, saved with Save;
 * currency and timezone are shown but fixed. From 1280px the landing page previews beside them — with the pause message in place of the
 * announcement while ordering is paused, as customers would see it.
 */
export function AppearanceSection({ data, dict }: AppearanceSectionProps) {
  const d = dict.appearance
  const form = useSectionForm({
    saved: data.appearance,
    problems: appearanceProblems,
    changes: appearanceChanges,
    tidy: tidyAppearance,
    submit,
    timezone: data.timezone,
  })
  const { values, problems, set } = form
  const [hero, setHero] = useState(data.heroImage)
  const [seenHero, setSeenHero] = useState(data.heroImage)
  const announcement = values.announcement.trim()
  const banner = landingBanner(data.pause, values.announcementOn, values.announcement, dict)

  // Fresh from the server (after a save, or another owner's): the photo shown follows it.
  if (data.heroImage !== seenHero) {
    setSeenHero(data.heroImage)
    setHero(data.heroImage)
  }

  // HeroPicker says when this fails, and discards the upload that didn't save.
  const changeHero = async (heroImage: string | null) => {
    try {
      const result = await saveHeroImage({ heroImage })
      if (result.ok) setHero(heroImage)
      return result.ok
    } catch {
      return false
    }
  }

  return (
    <FormFrame form={form} canEdit={data.canEdit} dict={dict.save}>
      <PaneGrid
        canEdit={data.canEdit}
        where="landing"
        dict={dict.preview}
        preview={
          <LandingPreview
            name={data.bakery.bakeryName}
            tagline={data.bakery.tagline}
            phone={data.bakery.phone ? `${dict.bakery.phonePrefix} ${data.bakery.phone}` : ""}
            address={data.bakery.pickupAddress}
            hours={data.hoursSet ? data.bakery.hours : null}
            heroImage={hero}
            banner={banner}
            today={data.today}
            dict={dict}
          />
        }
      >
        <div className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
          <span className="text-small-admin text-muted">{d.hero}</span>
          <HeroPicker
            value={hero}
            onChange={changeHero}
            overlay={data.bakery.bakeryName}
            dict={d}
          />
          <span className="text-small-admin text-pretty text-muted">{d.heroHint}</span>
        </div>

        <div role="group" aria-labelledby="announcement-label" className={`flex min-w-0 flex-col gap-2 ${fullRow}`}>
          <span id="announcement-label" className="text-small-admin text-muted">
            {d.announcement}
          </span>
          <Switch
            checked={values.announcementOn}
            onChange={() => set({ announcementOn: !values.announcementOn })}
            stateLabel={values.announcementOn ? d.showing : d.off}
            label={d.announcementSwitch}
            className="self-start"
          />
          <span className="text-small-admin text-pretty text-muted">{d.announcementHint}</span>
        </div>
        {values.announcementOn ? (
          <Field
            id="announcement-text"
            label={d.announcementText}
            hint={d.announcementTextHint}
            error={errorText(problems.announcement, dict.errors)}
            counter={`${announcement.length} / ${SETTINGS_LIMITS.announcement}`}
            counterOver={announcement.length > SETTINGS_LIMITS.announcement}
            className={`transition duration-250 ease-sheet starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none ${fullRow}`}
          >
            <TextInput
              id="announcement-text"
              value={values.announcement}
              placeholder={d.announcementPlaceholder}
              invalid={Boolean(problems.announcement)}
              aria-describedby="announcement-text-message"
              onChange={(event) => set({ announcement: event.target.value })}
            />
          </Field>
        ) : null}
        {values.announcementOn ? (
          <InlinePreview label={dict.bakery.preview} className={fullRow}>
            <span className="rounded-chip border border-o200 bg-o50 px-3 py-2 text-small-admin font-semibold text-pretty">
              {announcement || d.bannerPreview}
            </span>
          </InlinePreview>
        ) : null}

        <FixedSetting label={d.currency} value={d.currencyValue} hint={d.currencyHint} fixed={d.fixed} />
        <FixedSetting label={d.timezone} value={fill(d.timezoneValue, { zone: data.timezone })} hint={d.timezoneHint} fixed={d.fixed} />
      </PaneGrid>
    </FormFrame>
  )
}
