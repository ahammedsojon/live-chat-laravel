import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        proxy: {
            '/broadcasting': {
                target: 'http://chat-app-laravel.test',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/echo.js',
                'resources/js/message.js',
            ],
            refresh: true,
        }),
    ],
});
