//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

//// https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [react()],

    // Creates the @ alias for the src folder.
    // This allows any frontend file to import shared modules without
    // worrying about how deeply nested the current file is.
    //
    // Example:
    // import { apiFetch } from '@/api/api'
    //
    // @/api/api therefore resolves to:
    // src/api/api.ts
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },

    server: {
        proxy: {
            // Forwards any request the frontend makes to /api/* over to the
            // .NET backend during local dev, so relative apiFetch('/api/...')
            // calls in components actually reach the API instead of 404ing
            // against the Vite dev server itself.
            //
            // The apiFetch helper uses a blank API base URL during local
            // development. This means requests remain relative (/api/*)
            // and continue to pass through this Vite proxy.
            //
            // ⚠️ Replace the target port below with whatever your API's
            // "Now listening on: http://localhost:XXXX" line shows when
            // you run `dotnet run --project src\RccgHopeHouse.Api`.
            '/api': {
                target: 'http://localhost:5208',
                changeOrigin: true
            }
        },

        watch: {
            // Ignore Visual Studio's hidden .vs folder and node_modules
            // so Vite does not unnecessarily watch files in these folders.
            ignored: ['**/.vs/**', '**/node_modules/**']
        }
    }
})