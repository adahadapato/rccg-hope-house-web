//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

//// https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        watch: {
            // Ignore Visual Studio's hidden .vs folder and node_modules
            ignored: ['**/.vs/**', '**/node_modules/**']
        }
    }
})
