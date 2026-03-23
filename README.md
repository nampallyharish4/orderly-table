# Orderly Table - Restaurant POS System

A modern Point of Sale (POS) system built for restaurant management, with a premium UI and dedicated backend.

## Architecture

- **Frontend**: React (Vite) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Spring Boot 3 + PostgreSQL (Supabase)

## Deployment Instructions

### Backend (Render)

1. Connect your Github repository to [Render](https://render.com/).
2. Create a new **Web Service**.
3. Set **Root Directory** to `backend`.
4. Render will automatically detect the `Dockerfile`.
5. Add the following **Environment Variables**:
   - `PORT`: `8080` (or any value, the app will adapt)
   - `SUPABASE_DB_HOST`: Your Supabase database host
   - `SUPABASE_DB_USER`: Your Supabase database user
   - `SUPABASE_DB_PASSWORD`: Your Supabase database password

### Frontend (Vercel)

1. Connect your Github repository to [Vercel](https://vercel.com/).
2. Initialize a new project and select the **root** of the repository.
3. Vercel will detect the Vite project in `frontend/`.
4. Set **Root Directory** to `frontend`.
5. In **vercel.json** (already provided), ensure the API proxy points to your Render backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-render-app-name.onrender.com/api/$1"
       }
     ]
   }
   ```
   *Replace `your-render-app-name` with your actual Render service URL.*

## Development

```sh
# Root project
cd frontend
npm install
npm run dev

# For backend
cd backend
mvn clean compile spring-boot:run
```

## Features

- **Table Management**: Real-time occupation status with staff tracking.
- **Premium UI**: Custom-designed switches, animated loading states, and modern typography.
- **Menu Management**: Dynamic categories/items with image support.
- **Global Loading**: Global progress indicators for all async operations.
- **Order Flow**: Multi-table order handling with kitchen status updates.

## License

Private and proprietary.
