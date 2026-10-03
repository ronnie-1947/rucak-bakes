# customer-flags

A customer's flags as tags — **Trusted** (green), **Blocked** (red), **New** (the warm fill: first order in the last week).
Used by the customers list (cards and table rows, `src/components/admin-customers`) and the customer record
(`src/components/admin-customer-detail`). Words, never colour alone.

## Files in this folder

```
customer-flags/
  CustomerFlags.tsx   the tags; nothing for an unflagged customer
  README.md
```

## Props

```ts
CustomerFlags { flags: { isTrusted; isBlocked; isNew }; dict: Dict["admin"]["customerFlags"]; className? }
```

`isNew` is computed by `isNewCustomer` in `src/lib/customers/queries.ts`. Trusted and blocked never appear together — the
database forbids it (`c_trust_exclusive`).
