import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    // Allow access via tunnels like ngrok/cloudflared
    allowedHosts: true
  }
})
