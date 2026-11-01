# App de agendamiento genérico (frontend)

Interfaz de la plataforma de agendamiento. Aquí se construyen el panel privado de cada profesional y la página pública donde sus clientes reservan. Las reglas de negocio viven en la API; esta app solo muestra la interfaz y reenvía las acciones a la API. Ver [`../requerimientos_funcionales.md`](../requerimientos_funcionales.md) y [`../requerimientos_tecnicos.md`](../requerimientos_tecnicos.md).

## Qué hace hoy

- `/registro`: formulario para crear la cuenta de un profesional. Propone el slug a partir del nombre («Ana Pérez» → `ana-perez`), y el profesional puede cambiarlo. Valida los campos antes de enviar y muestra el mensaje de la API si la cuenta no se puede crear.
- `/entrar`: inicio de sesión con correo y clave. Si no coinciden, muestra un error que no dice cuál de los dos falló.
- `/panel`: panel privado del profesional. Sin sesión válida, manda a `/entrar`. Tiene el botón para cerrar sesión.

La página de inicio (`/`) todavía es la plantilla de Next.js.

## Stack

- Next.js 16 (App Router) con React 19
- Tailwind CSS 4 y shadcn/ui (estilo base-nova, sobre Base UI)
- zod para validar el formulario
- react-icons para los íconos
- Biome para lint y formato

## Requisitos

- Node.js 24
- pnpm 12
- La [API](../generic-scheduling-api/README.md) corriendo, para que el registro funcione

## Puesta en marcha

1. Instala las dependencias.

   ```bash
   pnpm install
   ```

2. Crea `.env.local` con la dirección de la API.

   ```bash
   echo 'API_URL=http://localhost:8080' > .env.local
   ```

3. Arranca la app en modo desarrollo. Queda en `http://localhost:3000`.

   ```bash
   pnpm dev
   ```

4. Abre `http://localhost:3000/registro`.

## Variables de entorno

| Variable  | Obligatoria | Para qué                                                                                                                                            |
| --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL` | Sí          | Dirección base de la API (por ejemplo, `http://localhost:8080`). Se lee en el servidor. Si falta, el registro muestra «No pudimos crear tu cuenta». |

## Scripts

| Comando       | Qué hace                                                |
| ------------- | ------------------------------------------------------- |
| `pnpm dev`    | Modo desarrollo con recarga.                            |
| `pnpm build`  | Compila la app para producción.                         |
| `pnpm start`  | Sirve la versión compilada. Ejecuta `pnpm build` antes. |
| `pnpm lint`   | Revisa el código con Biome.                             |
| `pnpm format` | Corrige el formato y los imports con Biome.             |

## Estructura

```
app/
  registro/
    page.tsx               página de registro (servidor)
    registration-form.tsx  formulario y validación (cliente)
    actions.ts             Server Action que llama a la API
  entrar/
    page.tsx               página de inicio de sesión
    login-form.tsx         formulario de login (cliente)
    actions.ts             Server Action: llama a la API y guarda la cookie de sesión
  panel/
    page.tsx               panel privado (verifica la sesión dentro de Suspense)
    actions.ts             Server Action para cerrar sesión
  globals.css              estilos y variables de tema de shadcn/ui
components/ui/             componentes de shadcn/ui (generados, no se editan a mano)
lib/
  session.ts               nombre de la cookie y requireSessionProfessional()
  utils.ts                 función cn para combinar clases
```

Para agregar un componente de shadcn/ui:

```bash
pnpm dlx shadcn@latest add <nombre-del-componente>
```

`AGENTS.md` contiene reglas para agentes que trabajan con esta versión de Next.js. Lo genera `next dev`.
