import { useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSearch } from '../store/slices/storageSlice';

import { MainLayout } from '../components/Layout/MainLayout';
import { FileListSection } from '../components/Dashboard/FileTable/FileListSection';
import { HeaderContent } from '../components/Dashboard/Header/HeaderContent';
import { SearchInput } from '../components/UI/SearchInput';

/**
 * Основная страница облачного хранилища (Dashboard).
 * Отображает список файлов, инструменты поиска и управления.
 * Поддерживает динамический параметр userId для просмотра хранилищ в режиме администратора.
 */
export function DashboardPage() {
  const { userId } = useParams<{ userId: string }>();
  const dispatch = useAppDispatch();
  const { search } = useAppSelector((state) => state.storage);

  const handleSearch = (val: string) => {
    dispatch(setSearch(val));
  };

  return (
    <MainLayout
      headerContent={<HeaderContent userId={userId} />}
      searchInput={
        <SearchInput value={search} onSearch={handleSearch} placeholder="Поиск файлов..." />
      }
    >
      <FileListSection userId={userId} />
    </MainLayout>
  );
}
