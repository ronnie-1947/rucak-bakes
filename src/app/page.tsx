import { Container } from "@/components/ui/Container"
import { htmlLang } from "@/lib/content"
import { getDictionary, type Locale } from "@/lib/i18n"

const locale: Locale = "en"

export default async function Home() {
  const dict = await getDictionary(locale)

  return (
    <div lang={htmlLang(locale)} className="contents">
      <Container as="main" className="flex flex-1 flex-col justify-center gap-4 py-16">
        <h1 className="text-3xl font-semibold">{dict.meta.home.title}</h1>
        <p className="max-w-prose text-base">{dict.meta.home.description}</p>
      </Container>
    </div>
  )
}
