# Eventos en el Bahía Blanca Plaza Shopping

Pantalla única con dos scrolls (próximos arriba, pasados abajo) y panel de carga en `/admin`.

## Estructura
```
index.html        pantalla principal
admin.html        panel de carga (usuario admin / contraseña bbps2153)
assets/           estilos, lógica compartida y título
api/events.js     API serverless que guarda los eventos
vercel.json       URLs limpias (/admin)
```

## Deploy en Vercel
1. Subí esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project**, importá el repo y dejá todo por defecto (Framework: Other). Deploy.
3. En el proyecto: **Storage → Create Database → Upstash (Redis)**, plan gratuito, y conectala al proyecto.
   Esto crea solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. **Deployments → ⋯ → Redeploy** para que tome las variables.

Opcional: en **Settings → Environment Variables** podés definir `ADMIN_USER` y `ADMIN_PASS`
para cambiar las credenciales sin tocar el código.

## Probar en local
Abrí `index.html` con un servidor estático (por ejemplo la extensión Live Server de VS Code).
Sin la API disponible, el sitio entra en modo de prueba y guarda los eventos en el navegador.
