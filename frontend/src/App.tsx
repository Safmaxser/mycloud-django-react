import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppDispatch } from './store/hooks';
import { fetchMe } from './store/slices/authSlice';
import { router } from './routes';
import type { Abortable } from './types/common';

export function App() {
  const dispatch = useAppDispatch();
  const fetchMePromiseRef = useRef<Abortable | null>(null);

  useEffect(() => {
    const promise = dispatch(fetchMe());
    fetchMePromiseRef.current = promise;
    return () => {
      if (fetchMePromiseRef.current) {
        fetchMePromiseRef.current.abort();
      }
    };
  }, [dispatch]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} className="mt-16" theme="colored" />
    </>
  );
}
