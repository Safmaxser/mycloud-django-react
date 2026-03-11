import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSearch } from '../store/slices/adminSlice';

import { MainLayout } from '../components/Layout/MainLayout';
import { UserListSection } from '../components/Admin/UserListSection';
import { SearchInput } from '../components/UI/SearchInput';

/**
 * Панель управления учетными записями пользователей.
 * Предоставляет инструменты поиска, изменения данных и удаления аккаунтов.
 * Доступна пользователям с правами администратора (флаг is_staff).
 */
export function AdminPage() {
  const dispatch = useAppDispatch();
  const { search } = useAppSelector((state) => state.admin);

  const handleSearch = (val: string) => {
    dispatch(setSearch(val));
  };

  return (
    <MainLayout
      headerContent={
        <h1 className="text-center text-lg font-bold text-gray-800 lg:text-2xl">
          Управление пользователями
        </h1>
      }
      searchInput={
        <SearchInput value={search} onSearch={handleSearch} placeholder="Поиск пользователей..." />
      }
    >
      <UserListSection />
    </MainLayout>
  );
}
