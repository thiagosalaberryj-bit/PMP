# PMP - Links de Pago con Mercado Pago

App web que permite a cualquier usuario registrarse, crear links de pago de Mercado Pago y compartirlos. Cuando alguien paga, el servidor recibe la notificacion via webhook y actualiza el estado automaticamente.

## Stack

- Backend: Node.js + Express + mysql2
- Frontend: Vanilla JS (SPA sin frameworks)
- Base de datos: MySQL
- Pagos: API de Mercado Pago

## Requisitos

- Node.js 18+
- MySQL 8+
- Cuenta de Mercado Pago (developer o productivo)
- (Opcional) Cuenta en Render para deploy

## Instalacion local

```bash
# 1. Clonar e instalar
git clone <repo> pmp
cd pmp
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con tus datos

# 3. Crear la base de datos MySQL
mysql -u root -p < src/db/schema.sql

# 4. Iniciar
npm run dev
```

## Configuracion de Mercado Pago

1. Crea una cuenta en [Mercado Pago Developers](https://developers.mercadopago.com/)
2. Ve a **Credenciales** y copia tu **Access Token** (modo test o produccion)
3. Pega el token en `.env` como `MP_ACCESS_TOKEN`
4. Configura el webhook en tu dashboard de MP apuntando a `https://tudominio.com/api/webhook/mp`

> En desarrollo local, usa [ngrok](https://ngrok.com/) para exponer tu servidor con HTTPS y configurar el webhook.

## Deploy en Render + MySQL

### MySQL gratis (2 opciones)

**Opcion A - Aiven** (MySQL, 1GB gratis):
1. Registrate en [Aiven.io](https://console.aiven.io/)
2. Crea un servicio **MySQL** (plan free)
3. Obtene los credenciales (host, user, password, dbname)
4. Corre el schema.sql contra esa DB

**Opcion B - TiDB Cloud** (MySQL compatible, 5GB gratis):
1. Registrate en [TiDB Cloud](https://tidbcloud.com/)
2. Crea un cluster **Serverless** (plan free)
3. Obtene la connection string (tcp://...)
4. Corre el schema.sql contra esa DB

### Render (Web Service)

1. Subi el proyecto a GitHub
2. En [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**
3. Conecta tu repo
4. Configura:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Agrega las **Environment Variables** del `.env` (sin el `PORT`, Render lo asigna solo)
6. Deploy → Render te da una URL tipo `https://pmp.onrender.com` con HTTPS automatico
7. Usa esa URL para configurar el webhook en Mercado Pago: `https://pmp.onrender.com/api/webhook/mp`

## Endpoints de la API

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesion |
| POST | `/api/payments` | JWT | Crear link de pago |
| GET | `/api/payments` | JWT | Listar mis pagos |
| GET | `/api/payments/:id` | JWT | Detalle de un pago |
| POST | `/api/webhook/mp` | No | Webhook de MP (IPN) |

## Flujo de uso

1. Usuario se registra e inicia sesion
2. Crea un link de pago (monto + descripcion)
3. El sistema crea una preferencia en MP y devuelve el link
4. Usuario copia el link y lo comparte
5. Pagador abre el link y paga
6. MP notifica al webhook
7. El servidor verifica el pago y actualiza el estado
8. Usuario ve el estado actualizado en su dashboard
