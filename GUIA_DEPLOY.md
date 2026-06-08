# Guia paso a paso: Deploy en Render + Aiven

## Indice

1. [GitHub - Subir el codigo](#1-github)
2. [Aiven - Base de datos MySQL gratis](#2-aiven)
3. [Render - Web service gratis con HTTPS](#3-render)
4. [Mercado Pago - Credenciales](#4-mercado-pago)
5. [Probar la app](#5-probar)

---

## 1. GitHub

### 1.1 Crear repositorio

1. Anda a [github.com/new](https://github.com/new)
2. **Repository name**: `pmp` (o el nombre que quieras)
3. **Public** o **Private** (da igual)
4. No marques nada, crealo vacio
5. Te va a mostrar una pantalla con comandos

### 1.2 Subir el codigo

En tu terminal (PowerShell), dentro de `C:\Users\thiag\Desktop\PMP`, ejecuta:

```powershell
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pmp.git
git push -u origin main
```

> Reemplaza `TU_USUARIO` por tu usuario de GitHub.

---

## 2. Aiven

### 2.1 Crear cuenta

1. Anda a [console.aiven.io/signup](https://console.aiven.io/signup)
2. Registrate con Google, GitHub o email
3. Verifica tu email

### 2.2 Crear servicio MySQL

1. En el dashboard de Aiven, hace click en **Create service**
2. Selecciona **MySQL** (el logo con el delfin)
3. **Plan**: `Startup - Free` (cuesta $0)
4. **Cloud provider**: Elegi **AWS** (cualquier region, ej: `aws-us-east-1`)
5. **Service name**: `pmp-mysql` (o el nombre que quieras)
6. Hace click en **Create service**

Espera 1-2 minutos mientras se crea el servicio.

### 2.3 Obtener datos de conexion

Una vez creado, entra en el servicio `pmp-mysql` y busca en la solapa **Overview** (o en **Connection info**):

Te va a mostrar algo asi:

```
Host: pmp-mysql-project.aivencloud.com
Port: 12345
User: avnadmin
Password: ********************
Database: defaultdb
```

**IMPORTANTE**: Hace click en el ojo para revelar la password y COPIALA en un bloc de notas, la vas a necesitar.

### 2.4 Listo, no necesitas hacer nada mas

Las tablas se crean **automaticamente** cuando el servidor arranque por primera vez. Solo necesitas los datos de conexion que ya copiaste.

---

## 3. Render

### 3.1 Crear cuenta

1. Anda a [dashboard.render.com/register](https://dashboard.render.com/register)
2. Registrate con **GitHub** (recomendado, asi conecta tu repositorio automaticamente)
3. Completa el registro

### 3.2 Crear Web Service

1. En el dashboard de Render, hace click en **New +** → **Web Service**
2. Elegi **Build and deploy from a Git repository**
3. Conecta tu cuenta de GitHub (si no lo hiciste)
4. Selecciona el repositorio `pmp` que creaste antes
5. Configura el servicio:

| Campo | Valor |
|---|---|
| **Name** | `pmp` |
| **Region** | `Frankfurt (EU)` o `Oregon (US)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Plan** | **Free** ($0/mes) |

### 3.3 Agregar variables de entorno

Baja hasta **Environment Variables** y agrega todas estas:

| Clave | Valor |
|---|---|
| `PORT` | `10000` |
| `JWT_SECRET` | Escribi cualquier clave secreta larga (ej: `miClaveSecretaSuperSegura123!`) |
| `DB_HOST` | El host de Aiven (ej: `pmp-mysql-thiagosalaberry08-3000.l.aivencloud.com`) |
| `DB_PORT` | `28787` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | La password que copiaste de Aiven |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `true` |
| `MP_ACCESS_TOKEN` | Lo vas a obtener en el paso 4, pone cualquier cosa por ahora |
| `BASE_URL` | La URL de Render (la vas a ver despues de crear el servicio) |

### 3.4 Deploy

1. Hace click en **Create Web Service**
2. Render va a empezar a hacer el deploy automaticamente (tarda 1-2 minutos)
3. Cuando termine, te va a mostrar la URL: `https://pmp.onrender.com`

### 3.5 Actualizar BASE_URL

1. Una vez que tengas la URL (ej: `https://pmp.onrender.com`), anda a **Environment** en Render
2. Edita la variable `BASE_URL` y pone la URL sin barra al final: `https://pmp.onrender.com`
3. Hace click en **Save Changes**
4. Render va a redeployear automaticamente

---

## 4. Mercado Pago

### 4.1 Crear cuenta developer

1. Anda a [developers.mercadopago.com](https://developers.mercadopago.com/)
2. Inicia sesion con tu cuenta de Mercado Pago (o creala)
3. Si no tenes cuenta de MP, descarga la app y registrate

### 4.2 Crear una Aplicacion

Ahora necesitas crear una **App** (no solo el Access Token). Esto permite que otros usuarios conecten su propia cuenta de MP.

1. En [developers.mercadopago.com](https://developers.mercadopago.com/), anda a **Mis aplicaciones** → **Crear aplicacion**
2. Pone cualquier nombre (ej: "PMP Links")
3. **Producto**: Selecciona **Checkout Pro**
4. **Redirigir URL**: pone `https://pmp-jg0e.onrender.com/api/auth/mp-oauth/callback`
   > Esto es fundamental: despues de que un usuario autorice, MP redirige a esta URL
5. Crea la app

### 4.3 Obtener credenciales de la app

1. Dentro de tu app, anda a la solapa **Credenciales**
2. Vas a ver dos secciones: **Sandbox** (pruebas) y **Produccion**
3. Copia estos dos valores de la seccion Sandbox:

| Variable | Donde esta |
|---|---|
| **Client ID** | Numero largo, ej: `123456789` |
| **Client Secret** | Clave larga, empieza con `TEST-` |

4. Tambien copia el **Access Token** (lo usamos para el webhook)

### 4.4 Configurar en Render

Anda a tu servicio en **Render** → **Environment** y agrega/edita:

| Variable | Valor |
|---|---|
| `MP_CLIENT_ID` | El Client ID de tu app |
| `MP_CLIENT_SECRET` | El Client Secret de tu app |
| `MP_ACCESS_TOKEN` | El Access Token de MP |

**Save Changes**

### 4.5 Configurar Webhook en Mercado Pago

1. En [developers.mercadopago.com](https://developers.mercadopago.com/), anda a **Webhooks** → **Create notification**
2. Configura:

| Campo | Valor |
|---|---|
| **URL** | `https://pmp-jg0e.onrender.com/api/webhook/mp` |
| **Events** | Selecciona **Payment** |

3. Guarda

### 4.6 (Opcional) Probar con tarjeta de prueba

| Campo | Valor |
|---|---|
| **Numero** | `5031 7557 3453 0604` |
| **CVV** | `123` |
| **Vencimiento** | `11/25` |
| **Nombre** | Cualquiera |

---

## 5. Probar

1. Anda a `https://pmp-jg0e.onrender.com`
2. Registrate con un nombre, email y contraseña
3. Te va a aparecer un cartel azul: **"Conecta tu cuenta de Mercado Pago"** → hace click ahi
4. MP te va a pedir que inicies sesion y autorices la app
5. Despues de autorizar, volves al dashboard y ya aparece como **conectado**
6. Ahora crea un link de pago (monto + descripcion)
7. Copia el link y abrirlo en una ventana de incognito
8. Paga con la tarjeta de prueba
9. Volve a tu dashboard → el estado cambia a **Aprobado**

> La plata va a la cuenta de MP del usuario que creo el link, no a la tuya.

### Links utiles

| Sitio | Link |
|---|---|
| Dashboard Render | https://dashboard.render.com/ |
| Consola Aiven | https://console.aiven.io/ |
| Mercado Pago Developers | https://developers.mercadopago.com/ |
| Tarjetas de prueba MP | https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/test-cards |

---

### Notas importantes

- En el plan **Free de Render**, el servicio se duerme despues de 15 minutos sin uso. Al entrar de nuevo tarda ~30 segundos en despertar. Es normal.
- Los datos en Aiven son persistentes (no se pierden).
- Para produccion real, necesitas credenciales de **Produccion** de MP (no las de Sandbox).
- **Cada usuario debe conectar su propia cuenta de MP** para poder crear links y recibir plata.
