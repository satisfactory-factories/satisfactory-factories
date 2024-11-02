export const config = {
  apiUrl: process.env.ENVIRONMENT === 'production' ? 'https://api.satisfactory-factories.app' : 'http://localhost:3001',
  dataVersion: '1.0-10',
}
