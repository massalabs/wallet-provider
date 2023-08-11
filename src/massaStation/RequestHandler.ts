/**
 * This file defines a TypeScript module with methods for performing GET, POST and DELETE http requests.
 *
 * @remarks
 * - The methods implemented here are quite generic and might be useful in other contexts too
 *  but have been particularly developed for making http calls specific to MassaStation's server API
 * - If you want to work on this repo, you will probably be interested in this object
 *
 */
import axios, { AxiosResponse, AxiosRequestHeaders } from 'axios';

const requestHeaders = {
  Accept:
    'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Content-Type': 'application/json',
} as AxiosRequestHeaders;
/**
 * This interface represents a payload returned by making an http call
 */
export interface JsonRpcResponseData<T> {
  isError: boolean;
  result: T | null;
  error: Error | null;
}

/**
 * This method makes a GET request to an http rest point.
 *
 *
 * @param url - The url to call.
 * @returns a Promise that resolves to an instance of JsonRpcResponseData.
 *
 */
export async function getRequest<T>(
  url: string,
  timeout: number = null,
): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;
  try {
    resp = await axios.get<unknown, AxiosResponse, object>(url, {
      headers: requestHeaders,
      timeout,
    });
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('Axios Error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: resp.data as T,
    error: null,
  } as JsonRpcResponseData<T>;
}

/**
 * This method makes a POST request to an http rest point.
 *
 *
 * @param url - The url to call.
 * @param body - The body of the request.
 * @returns a Promise that resolves to an instance of JsonRpcResponseData.
 *
 */
export async function postRequest<T>(
  url: string,
  body: object,
): Promise<JsonRpcResponseData<T>> {
  try {
    const resp = await axios.post<unknown, AxiosResponse, object>(url, body, {
      headers: requestHeaders,
    });

    return {
      isError: false,
      result: resp.data as T,
      error: null,
    } as JsonRpcResponseData<T>;
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: ex.response?.data?.message
        ? new Error(String(ex.response.data.message))
        : new Error('Axios error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }
}

/**
 * This method makes a DELETE request to an http rest point.
 *
 *
 * @param url - The url to call.
 * @returns a Promise that resolves to an instance of JsonRpcResponseData.
 *
 */
export async function deleteRequest<T>(
  url: string,
): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;
  try {
    resp = await axios.delete<unknown, AxiosResponse, object>(url, {
      headers: requestHeaders,
    });
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('Axios Error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: resp.data as T,
    error: null,
  } as JsonRpcResponseData<T>;
}

/**
 * This method makes a PUT request to an http rest point.
 *
 *
 * @param url - The url to call.
 * @param body - The body of the request.
 * @returns a Promise that resolves to an instance of JsonRpcResponseData.
 *
 */
export async function putRequest<T>(
  url: string,
  body: object,
): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;
  try {
    resp = await axios.put<unknown, AxiosResponse, object>(url, body, {
      headers: requestHeaders,
    });
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('Axios error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: resp.data as T,
    error: null,
  } as JsonRpcResponseData<T>;
}
