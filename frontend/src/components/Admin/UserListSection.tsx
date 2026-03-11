import { useEffect } from 'react';
import { AlertCircle, SearchX, Users } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearItems, fetchUsers, setPage } from '../../store/slices/adminSlice';

import { UserTable } from './UserTable';
import { LoadingState } from '../UI/LoadingState';
import { EmptyState } from '../UI/EmptyState';
import { Pagination } from '../UI/Pagination';
import { SearchResultsInfo } from '../UI/SearchResultsInfo';

/**
 * Основная контентная секция со списком пользователей.
 * Управляет загрузкой данных, пагинацией и переключением состояний (загрузка, ошибка, пустой список).
 */
export function UserListSection() {
  const dispatch = useAppDispatch();
  const { users, loading, error, totalCount, page, ordering, search } = useAppSelector(
    (state) => state.admin,
  );

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    const promise = dispatch(fetchUsers());
    return () => {
      promise.abort();
    };
  }, [page, ordering, search, dispatch]);

  // Очистка данных при размонтировании компонента
  useEffect(() => {
    return () => {
      dispatch(clearItems());
    };
  }, [dispatch]);

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  if (loading && users.length === 0) {
    return <LoadingState title="Загрузка данных пользователей..." />;
  }

  if (error && !loading && users.length === 0) {
    return (
      <div className="flex h-full flex-col p-3 pt-7 lg:p-7">
        <EmptyState
          title="Произошла ошибка"
          description={error}
          icon={AlertCircle}
          action={
            <button
              onClick={() => dispatch(fetchUsers())}
              className="mt-4 cursor-pointer rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-700"
            >
              Попробовать снова
            </button>
          }
        />
      </div>
    );
  }

  if (users.length === 0 && search === '' && !loading) {
    return (
      <div className="flex h-full flex-col p-3 pt-7 lg:p-7">
        <EmptyState
          title="Пользователей пока нет"
          description="Новые пользователи появятся здесь после регистрации."
          icon={Users}
        />
      </div>
    );
  }

  if (users.length === 0 && search !== '' && !loading) {
    return (
      <div className="relative flex h-full flex-col p-3 pt-7 lg:p-7">
        <SearchResultsInfo search={search} count={totalCount} />
        <EmptyState
          title="Ничего не найдено"
          description={`По запросу «${search}» совпадений нет. Попробуйте изменить фильтры.`}
          icon={SearchX}
        />
      </div>
    );
  }

  return (
    <div className="custom-scrollbar relative flex h-full flex-col gap-6 overflow-y-auto p-3 pt-7 lg:p-7">
      <SearchResultsInfo search={search} count={totalCount} />
      <div className="flex-1">
        <UserTable users={users} />
      </div>
      <Pagination current={page} total={totalCount} onChange={handlePageChange} />
    </div>
  );
}
