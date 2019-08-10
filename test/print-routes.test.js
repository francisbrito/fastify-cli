'use strict'

const proxyquire = require('proxyquire')
const tap = require('tap')
const sinon = require('sinon')

const printRoutes = require('../print-routes')

const test = tap.test

test('should print routes', t => {
  t.plan(2)

  const spy = sinon.spy()
  const command = proxyquire('../print-routes', {
    './log': spy
  })

  command.printRoutes(['./examples/plugin.js'], (err, fastify) => {
    if (err) t.error(err)

    fastify.close(() => {
      t.ok(spy.called)
      t.ok(spy.calledWithMatch('debug', '└── / (GET|POST)\n'))
    })
  })
})

test('should warn on file not found', t => {
  t.plan(1)

  const oldStop = printRoutes.stop
  t.tearDown(() => { printRoutes.stop = oldStop })
  printRoutes.stop = function (message) {
    t.ok(/.*not-found.js doesn't exist within/.test(message), message)
  }

  const argv = ['./data/not-found.js']
  printRoutes.printRoutes(argv)
})

test('should only accept plugin functions with 3 arguments', t => {
  t.plan(1)

  const oldStop = printRoutes.stop
  t.tearDown(() => { printRoutes.stop = oldStop })
  printRoutes.stop = function (err) {
    t.equal(err.message, 'Plugin function should contain 3 arguments. Refer to documentation for more information.')
  }

  printRoutes.printRoutes(['./test/data/incorrect-plugin.js'])
})

test('should throw on package not found', t => {
  t.plan(1)

  const oldStop = printRoutes.stop
  t.tearDown(() => { printRoutes.stop = oldStop })
  printRoutes.stop = function (err) {
    t.ok(/Cannot find module 'unknown-package'/.test(err.message), err.message)
  }

  const argv = ['./test/data/package-not-found.js']
  printRoutes.printRoutes(argv)
})

test('should throw on parsing error', t => {
  t.plan(1)

  const oldStop = printRoutes.stop
  t.tearDown(() => { printRoutes.stop = oldStop })
  printRoutes.stop = function (err) {
    t.equal(err.constructor, SyntaxError)
  }

  const argv = ['./test/data/parsing-error.js']
  printRoutes.printRoutes(argv)
})

test('should print routes of server with an async/await plugin', t => {
  t.plan(2)

  const nodeMajorVersion = process.versions.node.split('.').map(x => parseInt(x, 10))[0]
  if (nodeMajorVersion < 7) {
    t.pass('Skip because Node version < 7')
    return t.end()
  }

  const spy = sinon.spy()
  const command = proxyquire('../print-routes', {
    './log': spy
  })

  const argv = ['./examples/async-await-plugin.js']
  command.printRoutes(argv, (err, fastify) => {
    if (err) t.error(err)

    fastify.close(() => {
      t.ok(spy.called)
      t.ok(spy.calledWithMatch('debug', '└── / (GET)\n'))
    })
  })
})
