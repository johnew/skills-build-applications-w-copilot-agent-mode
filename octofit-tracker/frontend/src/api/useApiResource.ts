import { useEffect, useState } from 'react';

type ApiResource<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};

export function useApiResource<T>(path: string, load: (path: string) => Promise<T>): ApiResource<T> {
  const [resource, setResource] = useState<ApiResource<T>>({ data: null, loading: true, error: false });

  useEffect(() => {
    let active = true;
    setResource({ data: null, loading: true, error: false });
    load(path).then(
      (data) => {
        if (active) setResource({ data, loading: false, error: false });
      },
      () => {
        if (active) setResource({ data: null, loading: false, error: true });
      },
    );
    return () => { active = false; };
  }, [path, load]);

  return resource;
}