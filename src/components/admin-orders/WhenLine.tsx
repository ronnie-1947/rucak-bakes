import type { FulfilmentType } from "@/generated/prisma/enums"
import { fill } from "@/lib/template"
import type { OrdersCopy } from "./types"

type WhenLineProps = {
  fulfilmentType: FulfilmentType
  pickupTime: string | null
  dict: OrdersCopy
}

/** "Pickup 11:30", or just "Pickup" when the customer didn't choose a time. */
export function WhenLine({ fulfilmentType, pickupTime, dict }: WhenLineProps) {
  if (fulfilmentType === "DELIVERY") return <>{pickupTime ? fill(dict.deliveryAt, { time: pickupTime }) : dict.deliveryAny}</>
  return <>{pickupTime ? fill(dict.pickupAt, { time: pickupTime }) : dict.pickupAny}</>
}
