// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Next.js 13+ App Router testing
// import 'whatwg-fetch'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (!global.Request) {
    global.Request = class Request {
        constructor(input, init) {
            this.input = input;
            this.init = init;
            this.headers = new Headers(init?.headers);
            this.method = init?.method || 'GET';
            this.body = init?.body;
        }
        json() {
            return Promise.resolve(JSON.parse(this.body));
        }
    }
}

if (!global.Headers) {
    global.Headers = class Headers {
        constructor(init) {
            this.map = new Map();
        }
    }
}

if (!global.Response) {
    global.Response = class Response {
        constructor(body, init) {
            this.body = body
            this.status = init?.status || 200
        }
        json() {
            return Promise.resolve(this.body)
        }
        static json(data, init) {
            return new Response(JSON.stringify(data), init);
        }
    }
}
