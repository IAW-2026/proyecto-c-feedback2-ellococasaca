<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Capa de datos

Antes de tocar cualquier query, model o seed, leer `DATOS.md`. Explica el setup de Prisma (cliente singleton con adaptador pg, cliente generado en `app/generated/prisma/`), cada modelo del schema con sus campos y reglas de negocio, y la estructura completa del seed SQL en `prisma/mock-feedback.sql`.
