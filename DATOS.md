# Capa de datos: Prisma + mock-feedback

## 1. Stack y configuración del cliente

### Dependencias clave

| Paquete | Versión | Rol |
|---|---|---|
| `prisma` | ^7.8.0 | CLI (migrate, generate, db execute) |
| `@prisma/client` | ^7.8.0 | Cliente ORM generado |
| `@prisma/adapter-pg` | ^7.8.0 | Adaptador que conecta Prisma con `pg` |
| `pg` | ^8.21.0 | Driver PostgreSQL con pooling de conexiones |

### lib/prisma.ts — cliente singleton

```
lib/prisma.ts
```

El archivo establece un **singleton** del cliente de Prisma para evitar abrir múltiples conexiones en desarrollo (Next.js hace hot-reload y sin esto crearía un pool nuevo en cada rebuild).

```
DATABASE_URL  →  Pool (pg)  →  PrismaPg (adapter)  →  PrismaClient
```

Flujo concreto:
1. `const pool = globalForPrisma.pool ?? new Pool({ connectionString })` — crea el pool solo si no existe en `globalThis`.
2. `new PrismaClient({ adapter: new PrismaPg(pool) })` — usa el adaptador para que Prisma hable con el pool en lugar de abrir su propio TCP.
3. En desarrollo, el pool y el cliente se guardan en `globalThis` para sobrevivir hot-reloads.
4. En producción, cada instancia del servidor arranca fresh (no hay HMR).

**Variable de entorno requerida:** `DATABASE_URL` (string de conexión PostgreSQL). Si no está definida, la app lanza un error al arrancar.

### Dónde vive el cliente generado

```
app/generated/prisma/
```

La configuración del schema define `output = "../app/generated/prisma"`, por eso el cliente **no está en `node_modules`** sino dentro del árbol de la app. Esto es intencional para deployments serverless donde `node_modules` puede no estar disponible en runtime.

Al importar, usar siempre:
```ts
import { prisma } from "@/lib/prisma";
```
Nunca instanciar `PrismaClient` directamente en un componente o route.

---

## 2. Schema de la base de datos

Archivo: `prisma/schema.prisma`

```
PostgreSQL
├── Review
├── ReviewEligibility
├── ReviewReport
└── RatingsCache
```

### Modelo: Review

Representa una reseña que un comprador dejó sobre una compra.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` CUID | PK autogenerada |
| `orderId` | `String` UNIQUE | ID de la orden — **una orden solo puede tener una reseña** |
| `buyerId` | `String` | `sub` de Clerk del comprador |
| `sellerId` | `String` | `sub` de Clerk del vendedor |
| `productId` | `String` | ID del producto reseñado |
| `ratingProduct` | `Int` | Calificación del producto (1–5) |
| `ratingSeller` | `Int` | Calificación del vendedor (1–5) |
| `comment` | `String` | Texto libre de la reseña |
| `status` | `ReviewStatus` | Estado actual (ver enum) |
| `isModerated` | `Boolean` | `true` si un moderador intervino alguna vez |
| `createdAt` / `updatedAt` | `DateTime` | Timestamps automáticos |

**Enum ReviewStatus:**
- `PUBLISHED` — visible para todos
- `HIDDEN` — oculta por moderación, no aparece en vistas públicas
- `DELETED` — borrada por admin, excluida de todas las queries con `status: { not: "DELETED" }`
- `PENDING` — reservado para flujos futuros (revisión previa antes de publicar)

**Relación:** `Review` tiene muchos `ReviewReport` (un → muchos).

---

### Modelo: ReviewEligibility

Controla si un comprador tiene derecho a crear una reseña para una orden específica. Esta tabla la carga el equipo de Shipping App cuando marca una entrega como completada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` CUID | PK |
| `orderId` | `String` UNIQUE | Orden a la que aplica |
| `shipmentId` | `String` | ID del envío asociado |
| `buyerId` | `String` | Clerk `sub` del comprador autorizado |
| `sellerId` | `String` | Clerk `sub` del vendedor |
| `productIds` | `String[]` | Array de IDs de productos de la orden |
| `deliveredAt` | `DateTime` | Momento de entrega registrado |
| `enabled` | `Boolean` | `false` una vez que la reseña fue creada (se consume) |
| `createdAt` | `DateTime` | Timestamp automático |

**Lógica de negocio:** antes de crear una `Review`, la server action verifica que exista una fila en `ReviewEligibility` con `orderId` + `buyerId` + `enabled: true`. Después de crear la reseña, debería marcarse `enabled: false` para evitar duplicados (el `orderId` en `Review` ya tiene `@unique`, así que como segunda línea de defensa).

---

### Modelo: ReviewReport

Un usuario reporta una reseña inapropiada. Cada reporte queda pendiente hasta que un moderador lo resuelve.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` CUID | PK |
| `reviewId` | `String` | FK → `Review.id` |
| `reporterId` | `String` | Clerk `sub` de quien reportó |
| `reason` | `String` | Motivo del reporte (texto libre) |
| `status` | `ReportStatus` | Estado del reporte |
| `createdAt` | `DateTime` | Timestamp automático |

**Enum ReportStatus:**
- `OPEN` — pendiente de revisión (aparece en la cola del moderador)
- `RESOLVED` — el moderador tomó acción (ocultó o publicó la reseña)
- `DISMISSED` — el moderador consideró que el reporte no era válido

---

### Modelo: RatingsCache

Caché de promedios de calificación para evitar recalcular `AVG()` en cada request. Se actualiza vía `refreshRatingsCache()` después de cada nueva reseña.

| Campo | Tipo | Descripción |
|---|---|---|
| `targetId` | `String` | ID del producto o del vendedor |
| `targetType` | `RatingTargetType` | `PRODUCT` o `SELLER` |
| `averageRating` | `Float` | Promedio calculado |
| `totalReviews` | `Int` | Cantidad de reseñas incluidas en el promedio |

**PK compuesta:** `@@id([targetId, targetType])` — una entrada por combinación target+tipo.

**Enum RatingTargetType:** `PRODUCT` | `SELLER`

**APIs que leen este modelo:**
- `GET /api/product-ratings/[productId]`
- `GET /api/seller-ratings/[sellerId]`

---

## 3. Comandos de Prisma

```bash
# Generar cliente TypeScript a partir del schema
npx prisma generate

# Crear y aplicar una nueva migración (desarrollo)
npx prisma migrate dev --name nombre_descriptivo

# Aplicar migraciones pendientes (CI/producción — usado en npm run build)
npx prisma migrate deploy

# Abrir Prisma Studio (explorador visual de la DB)
npx prisma studio

# Ejecutar el seed de datos mock
npm run seed:mock
# equivale a: prisma db execute --file prisma/mock-feedback.sql
```

El script `build` en `package.json` corre `prisma migrate deploy && prisma generate` antes de `next build`, así que el deploy en producción siempre aplica migraciones pendientes automáticamente.

---

## 4. Datos mock: prisma/mock-feedback.sql

### Para qué sirve

Carga datos de prueba en la base de datos real (no es un mock en memoria). Permite que **todos los roles tengan datos visibles desde el primer arranque** sin necesidad de crear reseñas manualmente.

### Cómo ejecutarlo

```bash
npm run seed:mock
```

Es idempotente: usa `ON CONFLICT ... DO UPDATE` en cada tabla, así que puede ejecutarse varias veces sin duplicar filas.

### IDs de usuarios Clerk

El SQL usa los `sub` reales de Clerk. **Si cambia el entorno (local, staging, producción) los IDs cambian** y hay que actualizar el archivo con los IDs correctos.

Los IDs actuales en el archivo corresponden a:

| Rol | Email esperado | Clerk sub en el SQL |
|---|---|---|
| buyer | buyer.feedback@example.com | `user_3EZ24f4ckNuGNicwvUv60v16df5` |
| seller | seller.feedback@example.com | `user_3EZ21jRpTuRcgSfKa94ytFJM1Eq` |
| moderator | moderator.feedback@example.com | `user_3EY16ziKMUxsmaAXntfuJajRpIR` |
| admin | admin.feedback@example.com | `user_3EY1BlufGgMT4Sbl0VIjABwoIUe` |

Para obtener el `sub` de un usuario: Clerk Dashboard → Users → click en el usuario → copiar el "User ID" (empieza con `user_`).

### Qué inserta cada sección

#### ReviewEligibility (3 filas)

Habilita al buyer para crear reseñas sobre 3 órdenes distintas. Las órdenes `order_001`, `order_002` y `order_003` tienen `enabled: true`. Estas órdenes **no tienen `Review` asociada todavía**, así que el formulario de buyer puede usarlas para crear nuevas reseñas.

#### Review (5 filas)

Cubre todos los estados para que cada rol vea datos al entrar:

| ID | Orden | Estado | `isModerated` | Propósito |
|---|---|---|---|---|
| `rev_001` | `order_004` | `PUBLISHED` | `false` | Reseña normal visible para seller y admin |
| `rev_002` | `order_005` | `PUBLISHED` | `false` | Segunda reseña normal |
| `rev_003` | `order_006` | `PUBLISHED` | `true` | Reseña que pasó por moderación y quedó publicada |
| `rev_004` | `order_007` | `HIDDEN` | `true` | Reseña ocultada (el moderador la puede volver a publicar) |
| `rev_005` | `order_008` | `PUBLISHED` | `false` | Rating bajo — genera variedad en el promedio del caché |

Notar que las órdenes de las reviews (`order_004` a `order_008`) son **distintas** a las de `ReviewEligibility` (`order_001` a `order_003`). Esto es correcto: las eligibilities son para órdenes todavía sin reseña; las reviews ya existen sobre otras órdenes.

#### ReviewReport (3 filas)

| ID | Review reportada | Estado | Descripción |
|---|---|---|---|
| `report_001` | `rev_004` (HIDDEN) | `OPEN` | Aparece en la cola del moderador |
| `report_002` | `rev_005` (PUBLISHED) | `OPEN` | Aparece en la cola del moderador |
| `report_003` | `rev_003` (PUBLISHED) | `RESOLVED` | Reporte cerrado — solo visible en historial futuro |

La página `/feedback/moderator` filtra por `status: "OPEN"`, así que muestra `report_001` y `report_002`.

#### RatingsCache (4 filas)

Promedios pre-cargados para las APIs de ratings:

| Target | Tipo | Promedio | Total |
|---|---|---|---|
| `product_001` | PRODUCT | 3.0 | 2 |
| `product_002` | PRODUCT | 3.0 | 2 |
| `product_003` | PRODUCT | 3.0 | 1 |
| `user_3EY1BlufGgMT4Sbl0VIjABwoIUe` (seller) | SELLER | 3.4 | 5 |

Estos valores se actualizan automáticamente vía `refreshRatingsCache()` cada vez que se crea una nueva reseña.

---

## 5. Flujo completo: desde una compra hasta una reseña

```
Shipping App
  └─ POST /api/reviews/enable
       → crea ReviewEligibility { orderId, buyerId, sellerId, productIds, enabled: true }

Buyer App (usuario logueado como buyer)
  └─ GET /feedback/buyer
       → muestra BuyerReviewForm
  └─ createBuyerReview(formData)  [server action]
       1. Verifica rol "buyer" en Clerk
       2. Busca ReviewEligibility { orderId, buyerId, enabled: true }
       3. Crea Review { status: PUBLISHED }
       4. Llama refreshRatingsCache() para actualizar promedios
       5. revalidatePath("/feedback/buyer")

Cualquier usuario
  └─ GET /api/product-ratings/[productId]
       → lee RatingsCache { targetId: productId, targetType: PRODUCT }
  └─ POST /api/reviews/[id]/report
       → crea ReviewReport { status: OPEN }

Moderador
  └─ GET /feedback/moderator
       → lee ReviewReport WHERE status = "OPEN" WITH review
  └─ moderateReviewAction(reviewId, "HIDDEN")  [server action]
       → UPDATE Review SET status = "HIDDEN", isModerated = true
  └─ resolveReportAction(reportId, "RESOLVED")  [server action]
       → UPDATE ReviewReport SET status = "RESOLVED"

Admin
  └─ GET /feedback/admin?q=...
       → lee Review WHERE status != "DELETED" AND (búsqueda full-text)
  └─ deleteReviewAction(reviewId)  [server action]
       → UPDATE Review SET status = "DELETED"
```
