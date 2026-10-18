const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000';

export default {
  '/api/**': {
    target: backendUrl,
    secure: false,
    changeOrigin: true,
  },
};
