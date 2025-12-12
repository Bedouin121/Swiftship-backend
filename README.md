# Swiftship Backend API

Backend API for the Swiftship logistics platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   PORT=4000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/swiftship
   API_BASE_URL=http://localhost:4000/api
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system. If using Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000/api`

## API Endpoints

### Admin Endpoints

All admin endpoints require the `x-role: admin` header.

- `GET /api/dashboard` - Get dashboard metrics and activities
- `GET /api/vendors` - List all vendors
- `PATCH /api/vendors/:id/status` - Update vendor status
- `GET /api/drivers` - List all drivers
- `PATCH /api/drivers/:id/status` - Update driver status
- `GET /api/microhubs` - List all microhubs
- `POST /api/microhubs` - Create a new microhub
- `PUT /api/microhubs/:id` - Update a microhub
- `GET /api/fleet/metrics` - Get fleet performance metrics
- `GET /api/billing/invoices` - List all invoices
- `PATCH /api/billing/invoices/:id` - Update invoice status
- `GET /api/inventory/logs` - Get inventory movement logs

### Vendor Endpoints

All vendor endpoints require:
- `x-role: vendor` header
- `x-vendor-id: <vendor-id>` header

- `GET /api/orders` - List vendor's orders
- `GET /api/products` - List vendor's products
- `POST /api/products` - Create a new product
- `PATCH /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/analytics/vendor/sales` - Get sales analytics
- `GET /api/analytics/vendor/categories` - Get category distribution
- `GET /api/analytics/vendor/fulfillment` - Get fulfillment metrics

## Testing with Frontend

The frontend expects the API to be available at `http://localhost:4000/api`. Make sure:

1. The backend server is running
2. MongoDB is running and seeded
3. The frontend `.env` file has `VITE_API_BASE_URL=http://localhost:4000/api`
4. For vendor routes, set `VITE_DEMO_VENDOR_ID` to a valid vendor ID (you'll get this from the seed script output)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth and error handling
│   ├── scripts/         # Seed scripts
│   └── server.ts        # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

