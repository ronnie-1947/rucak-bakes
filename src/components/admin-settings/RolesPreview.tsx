import type { SettingsCopy } from "./types"

type RolesPreviewProps = {
  dict: SettingsCopy["preview"]
}

type Answer = "yes" | "no"

const answers: Record<Answer, string> = {
  yes: "text-green",
  no: "text-red",
}

/** What each role can do — as the app actually enforces it: staff can do everything but settings and staff. */
export function RolesPreview({ dict }: RolesPreviewProps) {
  return (
    <table className="w-full rounded-card border border-separate border-spacing-0 border-border text-small-admin">
      <thead>
        <tr>
          <th scope="col" className="px-4 pt-3 pb-2 text-left">
            <span className="sr-only">{dict.where.roles}</span>
          </th>
          <th scope="col" className="w-14 px-2 pt-3 pb-2 font-sans font-semibold">
            {dict.owner}
          </th>
          <th scope="col" className="w-14 px-2 pt-3 pr-4 pb-2 font-sans font-semibold">
            {dict.staff}
          </th>
        </tr>
      </thead>
      <tbody>
        {dict.permissions.map((permission) => {
          const staff: Answer = permission.staff ? "yes" : "no"
          return (
            <tr key={permission.label}>
              <th scope="row" className="border-t border-border px-4 py-2 text-left font-sans font-normal text-pretty">
                {permission.label}
              </th>
              <td className={`border-t border-border px-2 py-2 text-center font-semibold ${answers.yes}`}>{dict.yes}</td>
              <td className={`border-t border-border px-2 py-2 pr-4 text-center font-semibold ${answers[staff]}`}>{dict[staff]}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
