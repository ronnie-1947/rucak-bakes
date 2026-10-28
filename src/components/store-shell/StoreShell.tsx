import type { ReactNode } from "react"
import { Container } from "@/components/ui/Container"
import type { StoreShellData } from "@/lib/storefront/shell"
import { CartBar } from "./CartBar"
import { CartProvider } from "./CartProvider"
import type { StoreCopy } from "./copy"
import { PageTitleProvider } from "./PageTitleProvider"
import { StoreBannerStrip } from "./StoreBannerStrip"
import { StoreHeader } from "./StoreHeader"
import { StoreInfoProvider } from "./StoreInfoProvider"

type StoreShellProps = {
  data: StoreShellData
  dict: StoreCopy
  children: ReactNode
}

/**
 * The frame of every customer screen: pause / announcement strip, sticky header with the cart, the page in
 * the one Container, and the View cart bar. Provides the cart, the header's page title and the bakery's StoreInfo to everything inside.
 */
export function StoreShell({ data, dict, children }: StoreShellProps) {
  return (
    <StoreInfoProvider info={data.info}>
      <CartProvider timeZone={data.info.timeZone} dict={{ shell: dict.shell, switchDay: dict.switchDay, days: dict.days }}>
        <PageTitleProvider>
          {data.banner ? <StoreBannerStrip banner={data.banner} dict={dict.shell} /> : null}
          <StoreHeader bakeryName={data.bakeryName} place={data.place} dict={dict.shell} />
          <Container as="main" className="flex flex-1 flex-col gap-8 pt-4 pb-8 md:gap-12 md:pt-6 md:pb-12 lg:pt-8">
            {children}
          </Container>
          <CartBar dict={dict.shell} />
        </PageTitleProvider>
      </CartProvider>
    </StoreInfoProvider>
  )
}
