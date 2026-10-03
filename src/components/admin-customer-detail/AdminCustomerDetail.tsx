import { CustomerActionsProvider } from "@/components/customer-actions/CustomerActionsProvider"
import type { CustomerDetailData } from "@/lib/customers/detail"
import { CustomerDetail } from "./CustomerDetail"
import type { AdminCopy } from "./types"

type AdminCustomerDetailProps = {
  dict: AdminCopy
  customer: CustomerDetailData
}

/** /admin/customers/[id]. Its own flag provider; the undo strip shows inside the trust / block card. */
export function AdminCustomerDetail({ dict, customer }: AdminCustomerDetailProps) {
  return (
    <CustomerActionsProvider dict={dict.customerActions} autoVerifyTrusted={customer.autoVerifyTrusted} statusPlacement="manual">
      <CustomerDetail customer={customer} dict={dict} variant="page" />
    </CustomerActionsProvider>
  )
}
