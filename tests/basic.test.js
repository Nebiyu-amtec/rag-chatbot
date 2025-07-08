const request = require('supertest');
const app = require('../server');

describe('Amtec Chatbot API', () => {
  it('should respond to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
  });

  it('should reject non-Amtec queries', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ query: 'What is the weather today?' });
    
    expect(res.body.response).toContain('Amtec Links');
  });
});
