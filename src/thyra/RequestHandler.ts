import axios, { AxiosResponse, AxiosRequestHeaders } from 'axios';

const requestHeaders = {
  'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
} as AxiosRequestHeaders;

export interface JsonRpcResponseData<T> {
  isError: boolean;
  result: T | null;
  error: Error | null;
}

export async function postRequest<T>(
  url: string,
  body: object,
): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;
  try {
    resp = await axios.post(
      url,
      body,
      requestHeaders,
    );
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('JSON.parse error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  const responseData: any = resp.data;

  if (responseData.error) {
    return {
      isError: true,
      result: null,
      error: new Error(responseData.error.message),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: responseData.result as T,
    error: null,
  } as JsonRpcResponseData<T>;
}

// =======================================================

export async function getRequest<T>(url: string): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;
  try {
    resp = await axios.get(url, requestHeaders);
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('Network Error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  const responseData: any = resp.data;

  if (responseData.error) {
    return {
      isError: true,
      result: null,
      error: new Error(responseData.error.message),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: responseData.result as T,
    error: null,
  } as JsonRpcResponseData<T>;
}
