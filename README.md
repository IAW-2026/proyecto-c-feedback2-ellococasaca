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

## API REST

### Endpoints inter-servicio

| Método | Ruta | Descripción | Llamado por |
|--------|------|-------------|-------------|
| `POST` | `/api/reviews/enable` | Habilita elegibilidad de reseña tras entrega | Shipping App |
| `POST` | `/api/reviews` | Crea una reseña | Buyer App |
| `GET` | `/api/reviews/product/:productId` | Reseñas paginadas de un producto | Buyer App |
| `GET` | `/api/reviews/seller/:sellerId` | Reseñas paginadas de un vendedor | Buyer App |
| `GET` | `/api/seller-ratings/:sellerId` | Rating promedio del vendedor | Seller App |
| `GET` | `/api/product-ratings/:productId` | Rating promedio del producto | Seller App |

> Los endpoints de reseñas por producto y vendedor aceptan `?limit=N&skip=N` para paginación (máximo 100 por página, default 10).

### Endpoints del buyer

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/buyer/purchases` | Compras paginadas del buyer con estado de reseña por producto | Buyer |
| `GET` | `/api/buyer/purchases/eligible/:productId` | Verifica si el buyer puede reseñar un producto concreto | Buyer |

> `/api/buyer/purchases` acepta `?limit=N&skip=N`. Cada item del array `orders` incluye `canReview` y `reason` (`eligible` / `already_reviewed` / `not_enabled`).

> `/api/buyer/purchases/eligible/:productId` devuelve `canReview` (boolean) y `reason` a nivel raíz, más el detalle por orden en `orders[]`. Si el buyer nunca compró el producto, `reason: "not_purchased"`.

### Endpoints de moderación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/reviews/:id/report` | Reporta una reseña | Autenticado |
| `PATCH` | `/api/reviews/:id/moderate` | Cambia estado de reseña | Moderator / Admin |
| `DELETE` | `/api/reviews/:id` | Elimina reseña (soft delete) | Admin |

---

## Modelo de datos

```
Review         — reseña con ratings (producto 1-5, vendedor 1-5) y estado
ReviewEligibility — habilita que un comprador pueda reseñar una orden entregada
ReviewReport   — reporte de una reseña por contenido inapropiado
RatingsCache   — promedio pre-calculado de ratings por producto o vendedor
```

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