import { useMutation } from '@tanstack/react-query'
import { useNotification } from '../../context/NotificationContext';

interface UseUploadImageProps<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>,
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: unknown) => Promise<unknown> | unknown
}

export const useUploadImage = <TData, TVariables>({mutationFn, onSuccess, onSettled}: UseUploadImageProps<TData, TVariables>) => {
  const { notify } = useNotification()
  
  return useMutation({
    mutationFn,
    onError: (error: Error) => {
      notify(error.message ?? 'Sorry, there was an error', true);
    },
    onSuccess,
    onSettled,
  })
}