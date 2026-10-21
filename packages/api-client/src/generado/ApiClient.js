// Transporte propio (fetch) para el cliente generado.
//
// Este archivo NO lo escribe openapi-generator: el generador produce su
// ApiClient.js basado en superagent y se descarta (docs/api-integration.md §1.2).
// Mantiene la misma superficie que consumen `src/api/*` y `src/model/*`:
//   - instancia: callApi(), buildCollectionParam(), isJsonMime(), jsonPreferredMime(),
//     normalizeParams(), buildUrl(), applyAuthToRequest(), isFileParam()
//   - estáticos: convertToType(), constructFromObject(), parseDate(), instance

import { ApiError } from '../problemas.js';

const JSON_MIME = /^application\/(?:[\w!#$%&'*+.^`|~-]+\+)?json/i;

class ApiClient {
  constructor(basePath = '/v1') {
    this.basePath = String(basePath).replace(/\/+$/, '');
    this.authentications = {
      bearerAuth: { type: 'bearer', accessToken: null },
    };
    this.defaultHeaders = {};
    this.timeout = 60000;
    this.cache = true;
    // Inyectables para pruebas y para la capa de sesión (core).
    this.fetchImpl = (...args) => globalThis.fetch(...args);
    this.getAccessToken = null;
  }

  isJsonMime(contentType) {
    return typeof contentType === 'string' && JSON_MIME.test(contentType);
  }

  jsonPreferredMime(contentTypes = []) {
    for (const tipo of contentTypes) if (this.isJsonMime(tipo)) return tipo;
    return contentTypes.length > 0 ? contentTypes[0] : null;
  }

  normalizeParams(params = {}) {
    const salida = {};
    for (const [clave, valor] of Object.entries(params)) {
      if (valor === undefined || valor === null) continue;
      salida[clave] = Array.isArray(valor) ? valor.join(',') : valor;
    }
    return salida;
  }

  buildUrl(path, pathParams, apiBasePath) {
    const base = apiBasePath ?? this.basePath;
    let url = `${base}${path}`;
    for (const [clave, valor] of Object.entries(pathParams ?? {})) {
      url = url.replace(`{${clave}}`, encodeURIComponent(String(valor)));
    }
    return url;
  }

  buildCollectionParam(param, collectionFormat) {
    if (param === null || param === undefined) return null;
    switch (collectionFormat) {
      case 'csv':
        return param.join(',');
      case 'ssv':
        return param.join(' ');
      case 'tsv':
        return param.join('\t');
      case 'pipes':
        return param.join('|');
      case 'multi':
        return param;
      case 'passthrough':
        return param;
      default:
        throw new Error(`Unknown collection format: ${collectionFormat}`);
    }
  }

  applyAuthToRequest(headers, authNames = []) {
    for (const nombre of authNames) {
      const auth = this.authentications[nombre];
      if (!auth) continue;
      if (auth.type === 'bearer') {
        const token = this.getAccessToken?.() ?? auth.accessToken;
        if (token) headers.Authorization = `Bearer ${token}`;
      } else if (auth.type === 'basic' && auth.username) {
        const par = `${auth.username}:${auth.password ?? ''}`;
        headers.Authorization = `Basic ${btoa(par)}`;
      } else if (auth.type === 'apiKey' && auth.apiKey) {
        headers[auth.apiKeyName ?? 'X-API-Key'] = auth.apiKey;
      }
    }
    return headers;
  }

  isFileParam(valor) {
    if (!valor) return false;
    if (typeof Blob !== 'undefined' && valor instanceof Blob) return true;
    if (typeof File !== 'undefined' && valor instanceof File) return true;
    // React Native: FormData acepta { uri, name, type }.
    return typeof valor === 'object' && typeof valor.uri === 'string' && typeof valor.name === 'string';
  }

  async callApi(
    path,
    httpMethod,
    pathParams = {},
    queryParams = {},
    headerParams = {},
    formParams = {},
    bodyParam = null,
    authNames = [],
    contentTypes = [],
    accepts = [],
    returnType = null,
    apiBasePath = undefined,
  ) {
    let url = this.buildUrl(path, pathParams, apiBasePath);

    const query = this.normalizeParams(queryParams);
    const qs = new URLSearchParams();
    for (const [clave, valor] of Object.entries(query)) qs.append(clave, String(valor));
    if ([...qs].length > 0) url += `?${qs.toString()}`;

    const headers = { ...this.defaultHeaders, ...this.normalizeParams(headerParams) };
    this.applyAuthToRequest(headers, authNames);

    let body;
    const contentType = this.jsonPreferredMime(contentTypes);

    if (contentType === 'multipart/form-data') {
      body = new FormData();
      for (const [clave, valor] of Object.entries(formParams ?? {})) {
        if (valor === undefined || valor === null) continue;
        const valores = Array.isArray(valor) ? valor : [valor];
        for (const item of valores) {
          if (this.isFileParam(item)) {
            // En RN se pasa el objeto tal cual; en web, File/Blob.
            if (typeof item === 'object' && item.uri) body.append(clave, item);
            else body.append(clave, item, item.name ?? 'archivo');
          } else {
            body.append(clave, String(item));
          }
        }
      }
      // No se fija Content-Type: la plataforma debe añadir el boundary.
    } else if (contentType === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams(this.normalizeParams(formParams)).toString();
      headers['Content-Type'] ??= 'application/x-www-form-urlencoded';
    } else if (bodyParam !== null && bodyParam !== undefined) {
      body = JSON.stringify(bodyParam);
      headers['Content-Type'] ??= 'application/json';
    }

    const accept = this.jsonPreferredMime(accepts);
    if (accept) headers.Accept ??= accept;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const temporizador = controller ? setTimeout(() => controller.abort(), this.timeout) : null;

    let response;
    try {
      response = await this.fetchImpl(url, {
        method: httpMethod.toUpperCase(),
        headers,
        body,
        signal: controller?.signal,
      });
    } finally {
      if (temporizador) clearTimeout(temporizador);
    }

    const requestId = response.headers?.get?.('x-request-id') ?? null;

    if (!response.ok) {
      const problema = await this.leerProblema(response);
      throw new ApiError(problema?.title ?? `HTTP ${response.status}`, {
        status: response.status,
        problem: problema,
        requestId,
        response,
      });
    }

    if (response.status === 204 || response.status === 205) {
      return { response, data: null };
    }

    let data;
    if (returnType === 'Blob') {
      data = await response.blob();
    } else {
      const tipo = response.headers?.get?.('content-type') ?? '';
      data = this.isJsonMime(tipo) ? await response.json() : await response.text();
    }

    const deserializado =
      returnType !== null && returnType !== undefined ? ApiClient.convertToType(data, returnType) : data;

    return { response, data: deserializado };
  }

  async leerProblema(response) {
    try {
      const tipo = response.headers?.get?.('content-type') ?? '';
      if (this.isJsonMime(tipo) || tipo.includes('problem')) return await response.json();
    } catch {
      // Cuerpo no-JSON: el ApiError conservará el estado HTTP.
    }
    return null;
  }

  static parseDate(str) {
    return new Date(str);
  }

  static convertToType(data, type) {
    if (data === null || data === undefined) return null;
    if (typeof type === 'string') {
      switch (type) {
        case 'String':
          return String(data);
        case 'Number':
          return Number(data);
        case 'Boolean':
          return Boolean(data);
        case 'Date':
          return ApiClient.parseDate(data);
        case 'Blob':
          return data;
        default:
          return data;
      }
    }
    if (Array.isArray(type)) {
      return Array.isArray(data) ? data.map((item) => ApiClient.convertToType(item, type[0])) : data;
    }
    if (type && typeof type.constructFromObject === 'function') {
      return type.constructFromObject(data);
    }
    return data;
  }

  static constructFromObject(data, obj, itemType) {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) return data.map((item) => ApiClient.convertToType(item, itemType));
    if (itemType && typeof itemType.constructFromObject === 'function') {
      return itemType.constructFromObject(data);
    }
    return data;
  }
}

ApiClient.instance = new ApiClient();

export default ApiClient;
