# Planes y facturación

La Liguita cobra por liga con Stripe. El campo deportivo `tier` (`amateur` / `pro`) no cambia: sigue describiendo el box score. El plan comercial vive en `tournaments/{id}.billing` y en `legacyPro`.

Esta guía asume el endurecimiento de seguridad de la PR #25 (`firebase-admin`, rutas de servidor y custom claims). Despliega esa base antes, o junto con estos cambios.

## Planes

| Plan | Precio | Límites |
| --- | --- | --- |
| Gratis | US$0 | 1 liga activa, 8 equipos, 1 administrador, marca de La Liguita en el portal |
| Liga Pro | US$12/mes, US$49 por temporada (4 meses, un pago), US$99/año | Equipos ilimitados, varios administradores con código de acceso, marcador en vivo, estadísticas y líderes, portal sin marca de La Liguita y con logo de la liga, 3 banners |
| Club | US$29/mes o US$249/año | Hasta 5 ligas en la cuenta, patrocinadores ilimitados (tope de 100 en las reglas), dominio propio listado como próximamente, soporte por WhatsApp |
| Federación | Desde US$79/mes | Contactar a romerofront@gmail.com. No hay Checkout |

Los precios públicos están en `/precios` (español) y `/en/pricing` (inglés). El cobro se inicia en el panel, en **Plan y facturación**.

## Campos

Solo el Admin SDK escribe estos campos. Las reglas rechazan el cambio desde el cliente.

```txt
tournaments/{id}.legacyPro                         boolean
tournaments/{id}.billing.plan                      free | pro | club | federation
tournaments/{id}.billing.status                    none | active | trialing | past_due | canceled | incomplete | unpaid | paused
tournaments/{id}.billing.interval                  month | season | year | null
tournaments/{id}.billing.currentPeriodEnd          ISO-8601
tournaments/{id}.billing.currentPeriodEndMs        número, para las reglas
tournaments/{id}.billing.stripeCustomerId
tournaments/{id}.billing.stripeSubscriptionId
tournaments/{id}.sponsors                          lista { name, href?, imageUrl? }
users/{uid}.ownedTournamentCount                   cupo consumido al crear una liga
users/{uid}.leagueAllowance                        tope de ligas. El cliente no puede subirlo
users/{uid}.accountPlan                            etiqueta. El cliente no puede cambiarla
```

`getPlanLimits()` en `src/lib/plans.mjs` es el helper único. Lo usan el panel, el portal y el servidor de códigos de acceso. En reglas, el tope de equipos del plan Gratis son los ids `1`–`8`. Una liga de pago o con `legacyPro` puede usar cualquier id. El tope de correos en `adminEmails` es 1 en Gratis y 100 en un plan de pago. El portal público sigue mostrando el calendario; la pestaña de líderes queda en Liga Pro.

Una temporada (`interval: season`) no tiene suscripción. `currentPeriodEnd` es la fecha del checkout más 4 meses. Al pasar esa fecha el plan efectivo vuelve a Gratis aunque `status` siga en `active`.

`invoice.payment_failed` deja `status: past_due`. El acceso sigue hasta que termine el periodo. `customer.subscription.deleted` marca `canceled`. Si el periodo no terminó, el plan sigue vigente.

## Ligas que ya existen

Hasta `LEGACY_PRO_UNTIL` (por defecto `2027-01-01T00:00:00.000Z`), un torneo sin `billing` se trata como Liga Pro. El script deja `legacyPro: true`, así que siguen en Pro después de esa fecha. No borra equipos ni administradores.

Si el dueño ya tiene varias ligas, `leagueAllowance` queda al menos en esa cantidad. Puede conservarlas. Para abrir otra necesita Club (5) o que el cupo sea mayor.

Corre el script antes de desplegar las reglas nuevas:

```bash
node --env-file=.env.local scripts/migrate-tournament-billing.mjs
node --env-file=.env.local scripts/migrate-tournament-billing.mjs --apply
```

La primera pasada solo imprime. `--apply` se puede repetir. Si el torneo ya tiene `stripeCustomerId` o `stripeSubscriptionId`, no se toca el plan.

Una liga nueva nace en Gratis: `legacyPro: false` y `billing.plan: free`. Crear la segunda liga incrementa `ownedTournamentCount`. El cliente no puede bajar ese contador; al borrar la liga, `POST /api/billing/release` lo disminuye con el Admin SDK.

## Variables de entorno

En el host de Next.js (Vercel) y en `.env.local`. Ninguna clave secreta lleva prefijo `NEXT_PUBLIC_`.

| Variable | Uso |
| --- | --- |
| `STRIPE_SECRET_KEY` | Clave secreta. Empieza en modo test (`sk_test_`). |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del endpoint (`whsec_`). |
| `STRIPE_PRICE_PRO_MONTHLY` | Price id de Liga Pro mensual (recurring). |
| `STRIPE_PRICE_PRO_SEASON` | Price id de Liga Pro temporada (one-time, US$49). |
| `STRIPE_PRICE_PRO_YEARLY` | Price id de Liga Pro anual. |
| `STRIPE_PRICE_CLUB_MONTHLY` | Price id de Club mensual. |
| `STRIPE_PRICE_CLUB_YEARLY` | Price id de Club anual. |
| `NEXT_PUBLIC_APP_URL` | Origen público, sin barra final. Ej. `https://laliguita.vercel.app`. Success y cancel de Checkout, y el retorno del portal, salen de aquí. |
| `LEGACY_PRO_UNTIL` | Opcional. ISO-8601. Cortes para torneos sin `billing` y sin `legacyPro`. |

Siguen haciendo falta las variables de Firebase Admin y `ACCESS_CODE_PEPPER` de `docs/security-hardening.md`.

## Productos en Stripe (modo test primero)

1. En el Dashboard de Stripe, activa **Test mode**.
2. Products → Add product.
   - **Liga Pro**: tres precios. US$12 recurring monthly, US$99 recurring yearly, US$49 one time (temporada).
   - **Club**: US$29 recurring monthly y US$249 recurring yearly.
3. Copia cada `price_...` a la variable de arriba. No uses el `prod_...`.
4. Settings → Billing → Customer portal: activa el portal para que **Administrar facturación** pueda abrir el cambio de tarjeta y la cancelación.
5. Cuando los pagos de prueba cuadren, repite los productos en live mode y cambia la clave y los price ids del host.

Federación no tiene price. El botón abre `mailto:romerofront@gmail.com`.

## Webhook en Vercel

Ruta: `POST /api/billing/webhook`.

1. Stripe → Developers → Webhooks → Add endpoint.
2. URL: `https://<tu-dominio>/api/billing/webhook`.
3. Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
4. Copia el signing secret a `STRIPE_WEBHOOK_SECRET` y vuelve a desplegar.
5. Checkout guarda `tournamentId` y `uid` en la metadata de la sesión y, si es suscripción, en la suscripción. El webhook escribe `billing` con el Admin SDK.

Mensual y anual usan `mode: subscription`. La temporada usa `mode: payment` y fija `currentPeriodEnd` a cuatro meses.

`POST /api/billing/checkout` exige el ID token de Firebase y que la cuenta sea dueña o administradora del torneo. `POST /api/billing/portal` abre el customer portal si ya existe `stripeCustomerId`.

## Prueba local con Stripe CLI

```bash
npm run dev
stripe listen --forward-to localhost:3000/api/billing/webhook
```

El CLI imprime un `whsec_...`. Ponlo en `.env.local` como `STRIPE_WEBHOOK_SECRET` y reinicia `next dev`.

Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

Disparo manual:

```bash
stripe trigger checkout.session.completed
```

Ese evento de ejemplo no trae un `tournamentId` real; la ruta responde 200 y no escribe si no encuentra la liga. El flujo de verdad es el botón del panel.

## Despliegue de reglas

Después de la migración:

```bash
npx firebase deploy --only firestore:rules --project <project-id>
```

Sin la migración, una liga vieja sin `billing` sigue contando como Pro hasta `LEGACY_PRO_UNTIL`, pero el contador de ligas del usuario arranca en 0 y podría permitir una liga extra. El script deja el contador en el número real.

## Pruebas

```bash
npm run test:plans
npm run test:access-code
npm run test:rules
npm run build
```
