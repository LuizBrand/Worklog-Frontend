import type { AxiosRequestConfig } from 'axios'

import { api } from '@/lib/api'

export const customInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    const controller = new AbortController()

    const promise = api({
        ...config,
        ...options,
        signal: controller.signal,
    }).then(({ data }) => data as T)

    ;(promise as Promise<T> & { cancel: () => void }).cancel = () => {
        controller.abort()
    }

    return promise
}

export default customInstance

export type ErrorType<E> = import('axios').AxiosError<E>
export type BodyType<B> = B
