# Feedback App — El Loco Casaca

Aplicación **Feedback** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `<!-- completar -->`.

Módulo de reseñas y calificaciones del ecosistema **El Loco Casaca** (Marketplace — Tipo C).  
Permite a compradores calificar productos y vendedores, gestionar reportes y moderar contenido.

**Deploy:** <https://proyecto-web-feedback-ellococasaca.vercel.app>

---

## Roles y credenciales de prueba

| Rol | Usuario | Mail | Contraseña |
|-----|---------|------|------------|
| Admin | `adminTest` | admin+clerk_test@iaw.com | `iawuser#` |
| Moderator | `moderator` | moderator+clerk_test@iaw.com | `iawuser#` |
| Seller | `seller` | seller+clerk_test@iaw.com | `iawuser#` |
| Buyer | `buyer` | buyer+clerk_test@iaw.com | `iawuser#` |

---

## Funcionalidades por rol

| Funcionalidad | Buyer | Seller | Moderator | Admin |
|---------------|:-----:|:------:|:---------:|:-----:|
| Crear reseña (orden entregada) | ✅ | — | — | — |
| Ver reseñas propias | ✅ | ✅ | — | — |
| Ver reportes abiertos | — | — | ✅ | ✅ |
| Ocultar / publicar reseña | — | — | ✅ | ✅ |
| Resolver / desestimar reporte | — | — | ✅ | ✅ |
| Búsqueda global de reseñas | — | — | — | ✅ |
| Eliminar reseña | — | — | — | ✅ |
| Ver sellers y sus ratings | — | — | — | ✅ |

---

## Condiciones para publicar una reseña (Buyer)

Para que un buyer pueda crear una reseña, se validan estas condiciones en orden:

1. **El usuario debe estar autenticado** y tener el rol `buyer` en Clerk.
2. **Debe existir una `ReviewEligibility` habilitada** para el `orderId` ingresado — la crea la Shipping App al registrar una entrega.
3. **El `buyerId` de la eligibility debe coincidir** con el usuario logueado — un buyer no puede reseñar una orden que no es suya.
4. **La eligibility debe estar activa** (`enabled: true`) — una vez usada se marca `false` para evitar doble envío.
5. **El `productId` ingresado debe pertenecer a esa orden** — se verifica contra el array `productIds` de la eligibility.
6. **El comentario pasa por moderación automática** antes de guardarse:
   - Score **< 15** → aprobado localmente → `PUBLISHED`
   - Score **15–49** → dudoso → se consulta a Claude (Haiku):
     - Claude aprueba → `PUBLISHED` (isModerated: true)
     - Claude rechaza → `HIDDEN` (isModerated: true)
     - Claude no disponible → `PENDING` para revisión manual
   - Score **≥ 50** → rechazado localmente → `HIDDEN`
7. **Solo se permite una reseña por orden** (`orderId` único en `Review`). No importa cuántos productos tenga la orden — se elige uno al crear la reseña.

---

## Stack tecnológico

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Base de datos:** PostgreSQL (Neon) — `db_feedback`
- **ORM:** Prisma 7
- **Autenticación:** Clerk
- **Estilos:** Tailwind CSS 4
- **Deploy:** Vercel

---

## Rating del seller

El rating del seller **no se almacena en cada reseña**. Se calcula como el **promedio de los ratings promedio de sus productos** y se persiste en `RatingsCache` (targetType `SELLER`). Cada vez que se aprueba una nueva reseña de producto, el cache del seller se recalcula automáticamente.

---

## API REST

### Endpoints inter-servicio

| Método | Ruta | Descripción | Auth | Llamado por |
|--------|------|-------------|------|-------------|
| `POST` | `/api/reviews/enable` | Habilita elegibilidad de reseña tras entrega | `x-inter-service-secret` (opcional) | Shipping App |
| `POST` | `/api/reviews` | Crea una reseña con moderación automática | Clerk (buyer) | Buyer App |
| `GET` | `/api/reviews/product/:productId` | Reseñas paginadas de un producto | Pública | Buyer App |
| `GET` | `/api/reviews/seller/:sellerId` | Reseñas paginadas de un vendedor | Pública | Buyer App |
| `GET` | `/api/seller-ratings/:sellerId` | Rating promedio del seller (promedio de productos) | Pública | Seller App |
| `GET` | `/api/product-ratings/:productId` | Rating promedio del producto | Pública | Seller App |

> **`POST /api/reviews`** — body: `{ orderId, productId, sellerId, productRating (1-5), comment }`. El campo `sellerRating` fue eliminado; el rating del seller se deriva de los productos.

> **Paginación** — `/api/reviews/product/:id` y `/api/reviews/seller/:id` aceptan `?limit=N&skip=N` (máx. 100, default 10). La respuesta incluye `totalReviews`, `skip` y `take`.

> **Rating del seller en `/api/reviews/seller/:id`** — `averageRating` proviene del cache (promedio de productos). El fallback sin cache también calcula promedio de promedios por producto usando `groupBy`.

### Endpoints del buyer

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/buyer/purchases` | Compras paginadas del buyer con estado de reseña por producto | Clerk (buyer) |
| `GET` | `/api/buyer/purchases/eligible/:productId` | Verifica si el buyer puede reseñar un producto concreto | Clerk (buyer) |

> `/api/buyer/purchases` acepta `?limit=N&skip=N`. Cada item incluye `canReview` y `reason` (`eligible` / `already_reviewed` / `not_enabled`). La respuesta no incluye `ratingSeller` (campo eliminado).

> `/api/buyer/purchases/eligible/:productId` devuelve `canReview` (boolean) y `reason` a nivel raíz, más el detalle por orden en `orders[]`. Si el buyer nunca compró el producto, `reason: "not_purchased"`.

### Endpoints de moderación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/reviews/:id/report` | Reporta una reseña | Clerk (autenticado) |
| `PATCH` | `/api/reviews/:id/moderate` | Cambia estado de reseña | Clerk (moderator / admin) |
| `DELETE` | `/api/reviews/:id` | Elimina reseña (soft delete) | Clerk (admin) |

### Endpoint de analytics (Dashboard)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/analytics` | Métricas agregadas para el dashboard general | Clerk (admin) |

Devuelve un snapshot de:
- **reviews** — total, desglose por estado (`PUBLISHED / HIDDEN / DELETED / PENDING`), reseñas moderadas, últimas 7 y 30 días, promedio de rating de producto, distribución de ratings (1–5), serie temporal diaria de los últimos 30 días
- **reports** — total, desglose por estado (`OPEN / RESOLVED / DISMISSED`), últimas 7 y 30 días
- **eligibilities** — total habilitadas, consumidas y pendientes
- **topSellers / topProducts** — top 10 por rating promedio (desde `RatingsCache`)

**Uso desde el dashboard app** — el admin logueado obtiene su session token de Clerk y lo pasa como `Authorization: Bearer <token>`. El endpoint valida el JWT y verifica el rol `admin` en los metadatos de Clerk.

```ts
const token = await auth.getToken();
const res = await fetch("https://proyecto-web-feedback-ellococasaca.vercel.app/api/analytics", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Integración con Super Admin

La página de administración externa (Super Admin) consume directamente los endpoints de esta app en lugar de usar las páginas internas `/feedback/admin`. A continuación los endpoints relevantes para cada acción administrativa:

### Acciones disponibles vía API

| Acción | Endpoint | Rol requerido |
|--------|----------|:-------------:|
| Ver métricas globales | `GET /api/analytics` | admin |
| Listar reseñas de un seller | `GET /api/reviews/seller/:sellerId?limit=N&skip=N` | público |
| Listar reseñas de un producto | `GET /api/reviews/product/:productId?limit=N&skip=N` | público |
| Ver rating de un seller | `GET /api/seller-ratings/:sellerId` | público |
| Ver rating de un producto | `GET /api/product-ratings/:productId` | público |
| Eliminar una reseña | `DELETE /api/reviews/:id` | admin |
| Moderar una reseña (ocultar/publicar) | `PATCH /api/reviews/:id/moderate` | admin / moderator |
| Resolver un reporte | — | *pendiente* |
| Buscar reseñas (texto libre) | — | *pendiente* |
| Listar todos los sellers con ratings | — | *pendiente* |

Los endpoints marcados como *pendiente* aún no existen como API REST; la funcionalidad equivalente solo está disponible en las páginas SSR internas.

### Cómo autenticar desde la Super Admin

El Super Admin pasa el JWT de Clerk del usuario admin logueado como `Authorization: Bearer <token>`. No hay secreto compartido — el endpoint verifica el JWT directamente con Clerk y chequea que el rol sea `admin`:

```ts
const token = await auth.getToken();
const res = await fetch("https://proyecto-web-feedback-ellococasaca.vercel.app/api/analytics", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Modelo de datos

```
Review            — reseña con ratingProduct (1-5) y estado; sin ratingSeller (eliminado)
ReviewEligibility — habilita que un comprador pueda reseñar una orden entregada
ReviewReport      — reporte de una reseña por contenido inapropiado
RatingsCache      — promedio pre-calculado por producto (PRODUCT) o seller (SELLER)
                    El cache SELLER = promedio de los promedios de sus productos
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|:---------:|
| `DATABASE_URL` | String de conexión PostgreSQL (Neon) | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk | ✅ |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk | ✅ |
| `ANTHROPIC_API_KEY` | API key de Anthropic (Claude) para moderación automática | ✅ |
| `GENERAL_ADMIN_URL` | URL del dashboard admin general al que redirige el botón "Inicio" del header | — |

---

## Comandos útiles

```bash
npm run dev          # desarrollo local
npm run build        # build de producción
npm run lint         # linter
npm run seed:mock    # cargar datos de prueba
npm run db:reset     # ← el nuevo: TRUNCA todo + recarga el mock desde cero
npm run seed:mock    # solo recarga el mock (sin borrar lo que ya está)
npx prisma studio    # explorador visual en localhost:5555
```

---

## Cuestiones a tener en cuenta
- El diseño de las páginas es básico y generado con IA, no sería el definitivo.
- Ingresar reseñas es molesto al tener que ingresar a mano los campos de IDs de producto y orden de compra. El endpoint `/api/buyer/purchases` fue creado para que la Buyer App pueda listar las órdenes elegibles y evitar este ingreso manual.

## Integrante responsable

**Jeremias Eloy Segurado Negrin** — Feedback App