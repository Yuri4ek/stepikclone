import { courseApi } from '@/entities/course'
import type { Role } from '@/shared/api'
import { useAsync } from '@/shared/lib'


export function useCourseOptions(role: Role) {
  return useAsync(async () => {
    if (role === 'admin') return (await courseApi.adminList()).map((c) => ({ id: c.id, title: c.title }))
    return (await courseApi.catalog()).items.map((c) => ({ id: c.id, title: c.title }))
  }, [role])
}
