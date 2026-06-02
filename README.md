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
| `GET` | `/api/reviews/product/:productId` | Reseñas de un producto | Buyer App |
| `GET` | `/api/reviews/seller/:sellerId` | Reseñas de un vendedor | Buyer App |
| `GET` | `/api/seller-ratings/:sellerId` | Rating promedio del vendedor | Seller App |
| `GET` | `/api/product-ratings/:productId` | Rating promedio del producto | Seller App |

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
```

---

## Integrante responsable

**Jeremias Eloy Segurado Negrin** — Feedback App