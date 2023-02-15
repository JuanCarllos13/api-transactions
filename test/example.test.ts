/* eslint-disable prettier/prettier */
import { afterAll, beforeAll, test, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('User create a transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({ title: 'new transaction', amount: 5000, type: 'credit' })
      .expect(201)
  })

  test('Should be able to list all transactions', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'new transaction', amount: 5000, type: 'credit' })

    const cookies = createTransactionsResponse.get('Set-Cookie')
    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'new transaction', amount: 5000
      })
    ])
  })

  test('Should be able to get specif transactions', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'new transaction', amount: 5000, type: 'credit' })

    const cookies = createTransactionsResponse.get('Set-Cookie')
    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id
    const getTransactionResponse = await request(app.server).get(`/transactions/${transactionId}`).set('Cookie', cookies).expect(200)

    expect(getTransactionResponse.body.transactions).toEqual(
      expect.objectContaining({
        title: 'new transaction', amount: 5000
      })
    )
  })

  test('Should be able to get summary', async () => {
    const createTransactionsResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'credit transaction', amount: 5000, type: 'credit' })

    const cookies = createTransactionsResponse.get('Set-Cookie')

    await request(app.server)
    .post('/transactions')
    .set('Cookie', cookies)
    .send({ title: 'debit transaction', amount: 1000, type: 'debit' })

    const summaryResponse = await request(app.server).get('/transactions/summary').set('Cookie', cookies).expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 4000
    })
  })

})
