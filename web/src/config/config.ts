export const config = {
  apiUrl: process.env.ENVIRONMENT === 'dev' ? 'http://localhost:3001' : 'https://api.satisfactory-factories.app',
  dataVersion: '1.0-11',
}
